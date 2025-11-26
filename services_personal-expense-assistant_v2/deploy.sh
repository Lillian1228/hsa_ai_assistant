#!/bin/bash

# Deploy HSA AI Assistant to Google Cloud Run
# Usage: ./deploy.sh [OPTIONS]

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"
SERVICE_NAME="hsa-ai-assistant"
FRONTEND_PORT=8082  # Default to React frontend
MEMORY="2Gi"
CPU="2"

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT_ID    Google Cloud project ID (default: current gcloud project)"
    echo "  -r, --region REGION          Cloud Run region (default: us-central1)"
    echo "  -n, --name SERVICE_NAME      Cloud Run service name (default: hsa-ai-assistant)"
    echo "  -f, --frontend-type TYPE     Frontend type: react|react-only|gradio|backend (default: react)"
    echo "  -m, --memory MEMORY          Memory allocation (default: 2Gi)"
    echo "  -c, --cpu CPU                CPU allocation (default: 2)"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy with defaults (React frontend + Backend)"
    echo "  $0 -f react-only             # Deploy React frontend ONLY (lighter, faster)"
    echo "  $0 -f gradio                 # Deploy with Gradio frontend"
    echo "  $0 -f backend                # Deploy backend only"
    echo "  $0 -p my-project -r us-west1 # Deploy to specific project and region"
}

FRONTEND_TYPE="react"  # Default frontend type

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -n|--name)
            SERVICE_NAME="$2"
            shift 2
            ;;
        -f|--frontend-type)
            FRONTEND_TYPE="$2"
            case $2 in
                react)
                    FRONTEND_PORT=8082
                    ;;
                react-only)
                    FRONTEND_PORT=8082
                    MEMORY="512Mi"  # Frontend only needs less memory
                    CPU="1"         # Frontend only needs less CPU
                    ;;
                gradio)
                    FRONTEND_PORT=8080
                    ;;
                backend)
                    FRONTEND_PORT=8081
                    ;;
                *)
                    echo -e "${RED}Error: Invalid frontend type. Use: react|react-only|gradio|backend${NC}"
                    exit 1
                    ;;
            esac
            shift 2
            ;;
        -m|--memory)
            MEMORY="$2"
            shift 2
            ;;
        -c|--cpu)
            CPU="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No project ID specified and no default project configured${NC}"
    echo "Set a default project: gcloud config set project PROJECT_ID"
    echo "Or use: $0 -p PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deploying HSA AI Assistant to Cloud Run      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Project ID:    $PROJECT_ID"
echo "  Region:        $REGION"
echo "  Service Name:  $SERVICE_NAME"
echo "  Port:          $FRONTEND_PORT"
echo "  Memory:        $MEMORY"
echo "  CPU:           $CPU"
echo ""

# Check if we're in the correct directory
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found${NC}"
    echo "Please run this script from the services_personal-expense-assistant_v2/ directory"
    exit 1
fi

# Check if we need to go to repository root
if [ ! -d "../frontend" ]; then
    echo -e "${RED}Error: Frontend directory not found at ../frontend${NC}"
    echo "Please ensure you're running from services_personal-expense-assistant_v2/ directory"
    echo "and that frontend/ directory exists in the parent directory"
    exit 1
fi

# Set gcloud project
echo -e "${YELLOW}Setting gcloud project...${NC}"
gcloud config set project $PROJECT_ID

# Image name
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Determine Dockerfile to use
DOCKERFILE="services_personal-expense-assistant_v2/Dockerfile"
if [ "$FRONTEND_TYPE" == "react-only" ]; then
    DOCKERFILE="services_personal-expense-assistant_v2/Dockerfile.frontend"
    echo -e "${YELLOW}Using frontend-only Dockerfile: $DOCKERFILE${NC}"
fi

# Step 1: Build with Cloud Build
echo ""
echo -e "${YELLOW}Step 1/3: Building Docker image with Cloud Build...${NC}"
cd ..  # Go to repository root

# Create a temporary cloudbuild.yaml because gcloud builds submit --dockerfile is not supported
cat > cloudbuild_temp.yaml <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', '$DOCKERFILE', '-t', '$IMAGE_NAME', '.']
images:
  - '$IMAGE_NAME'
timeout: 1200s
EOF

gcloud builds submit --config cloudbuild_temp.yaml .

# Clean up
rm cloudbuild_temp.yaml

# Go back to services directory
cd services_personal-expense-assistant_v2

# Step 2: Check if env.yaml exists
if [ ! -f ".env.yaml" ]; then
    echo -e "${YELLOW}Warning: .env.yaml not found. Creating a template...${NC}"
    cat > .env.yaml <<EOF
# Environment variables for Cloud Run
# Update these values for your deployment

STORAGE_BUCKET_NAME: "your-gcs-bucket-name"
GOOGLE_CLOUD_PROJECT: "$PROJECT_ID"

# Add other environment variables from settings.yaml as needed
EOF
    echo -e "${YELLOW}Please edit .env.yaml and run the script again${NC}"
    exit 1
fi

# Step 3: Deploy to Cloud Run
echo ""
echo -e "${YELLOW}Step 2/3: Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port $FRONTEND_PORT \
    --env-vars-file .env.yaml \
    --memory $MEMORY \
    --cpu $CPU \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

# Step 4: Print success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deployment Successful! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""

if [ $FRONTEND_PORT -eq 8082 ]; then
    echo "1. Update the backend API URL in Dockerfile:"
    if [ "$FRONTEND_TYPE" == "react-only" ]; then
        echo "   Edit services_personal-expense-assistant_v2/Dockerfile.frontend"
    else
        echo "   Edit services_personal-expense-assistant_v2/Dockerfile"
    fi
    echo "   RUN echo \"VITE_API_BASE_URL=$SERVICE_URL\" > .env"
    echo ""
    echo "2. Rebuild and redeploy:"
    echo "   ./deploy.sh"
    echo ""
    echo "3. Access your React application:"
    echo "   $SERVICE_URL"
elif [ $FRONTEND_PORT -eq 8080 ]; then
    echo "Access your Gradio application:"
    echo "   $SERVICE_URL"
elif [ $FRONTEND_PORT -eq 8081 ]; then
    echo "Your backend API is available at:"
    echo "   $SERVICE_URL/chat"
    echo "   $SERVICE_URL/review"
fi

echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "   gcloud run services logs read $SERVICE_NAME --region $REGION --tail"
echo ""
echo -e "${YELLOW}Update service:${NC}"
echo "   ./deploy.sh"
echo ""


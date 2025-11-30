#!/bin/bash

# Simple script to deploy the frontend to Google Cloud Run
# Usage: ./deploy-frontend.sh

set -e  # Exit on error

# Configuration
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"
SERVICE_NAME="hsa-ai-assistant-frontend"
BACKEND_URL="https://personal-expense-assistant-43823015060.us-central1.run.app"

echo "======================================"
echo "Deploying React frontend to Cloud Run"
echo "======================================"
echo ""
echo "Project ID:    $PROJECT_ID"
echo "Region:       $REGION"
echo "Service Name:     $SERVICE_NAME"
echo "Backend API:   $BACKEND_URL"
echo ""

# Check project ID
if [ -z "$PROJECT_ID" ]; then
    echo "Error: No Google Cloud project configured"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Build image
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Step 1/2: Building Docker image..."
echo ""

# Create temporary Dockerfile (inject backend URL at build time)
cat > Dockerfile.frontend.tmp <<EOF
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (.dockerignore will automatically exclude unnecessary files)
COPY . ./

# Set backend API URL
RUN echo "VITE_API_BASE_URL=$BACKEND_URL" > .env

# Build
RUN npm run build

# Stage 2: Nginx service
FROM nginx:alpine

# Copy build artifacts
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8082

CMD ["nginx", "-g", "daemon off;"]
EOF

# Use Cloud Build to build
cat > cloudbuild_frontend.yaml <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'Dockerfile.frontend.tmp', '-t', '$IMAGE_NAME', '.']
images:
  - '$IMAGE_NAME'
timeout: 1200s
EOF

gcloud builds submit --config cloudbuild_frontend.yaml .

# Clean up temporary files
rm Dockerfile.frontend.tmp cloudbuild_frontend.yaml

echo ""
echo "✅ Image built successfully"
echo ""
echo "Step 2/2: Deploying to Cloud Run..."
echo ""

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8082 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 5 \
    --min-instances 0

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "======================================"
echo "✅ Deployed successfully!"
echo "======================================"
echo ""
echo "Frontend URL: $SERVICE_URL"
echo "Backend API: $BACKEND_URL"
echo ""
echo "View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region $REGION --tail"
echo ""


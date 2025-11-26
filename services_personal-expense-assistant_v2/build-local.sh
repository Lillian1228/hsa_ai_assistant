#!/bin/bash

# Build and run Docker container locally for testing
# Usage: ./build-local.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

IMAGE_NAME="hsa-ai-assistant-local"
CONTAINER_NAME="hsa-ai-assistant-test"

echo -e "${GREEN}Building Docker image locally...${NC}"

# Check if we're in the correct directory
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found${NC}"
    echo "Please run this script from the services_personal-expense-assistant_v2/ directory"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "../frontend" ]; then
    echo -e "${RED}Error: Frontend directory not found at ../frontend${NC}"
    exit 1
fi

# Build from parent directory
echo -e "${YELLOW}Building from repository root...${NC}"
cd ..
docker build -t $IMAGE_NAME -f services_personal-expense-assistant_v2/Dockerfile .

echo ""
echo -e "${GREEN}Build successful!${NC}"
echo ""
echo -e "${YELLOW}To run the container:${NC}"
echo "  docker run -p 8080:8080 -p 8081:8081 -p 8082:8082 \\"
echo "    --env-file services_personal-expense-assistant_v2/settings.yaml \\"
echo "    --name $CONTAINER_NAME \\"
echo "    $IMAGE_NAME"
echo ""
echo -e "${YELLOW}Access the services:${NC}"
echo "  - React Frontend (nginx):  http://localhost:8082"
echo "  - FastAPI Backend:         http://localhost:8081"
echo "  - Gradio Frontend:         http://localhost:8080"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "  docker logs -f $CONTAINER_NAME"
echo ""
echo -e "${YELLOW}Stop and remove:${NC}"
echo "  docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
echo ""


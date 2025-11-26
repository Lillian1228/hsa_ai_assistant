# Deploy to Google Cloud Run

This guide shows how to deploy the HSA AI Assistant (Python backend + React frontend) to Google Cloud Run.

## Architecture

The Docker container runs three services via supervisord:
- **Port 8080**: Gradio frontend (Python web UI, optional)
- **Port 8081**: FastAPI backend (API)
- **Port 8082**: React frontend (nginx serving static files)

## Prerequisites

1. **Google Cloud SDK** installed and configured
   ```bash
   gcloud --version
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Docker** installed for local testing

3. **Required GCP APIs enabled**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

## Build Configuration

**Important**: The Dockerfile expects the frontend code to be in the parent directory. Build from the repository root:

```bash
# From repository root (/Users/xli8/code/hsa_ai_assistant/)
cd /Users/xli8/code/hsa_ai_assistant
```

## Step 1: Update Frontend API URL

Before building, update the backend API URL in the Dockerfile:

Edit `services_personal-expense-assistant_v2/Dockerfile` line that creates .env:

```dockerfile
# Change this line to your Cloud Run backend URL after first deployment
RUN echo "VITE_API_BASE_URL=https://YOUR_CLOUD_RUN_URL" > .env
```

**Note**: On first deployment, you can use a placeholder. After deployment, rebuild with the actual Cloud Run URL.

## Step 2: Build Docker Image

### Option A: Build Locally and Push

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export SERVICE_NAME=hsa-ai-assistant
export IMAGE_NAME=gcr.io/$PROJECT_ID/$SERVICE_NAME

# Build from repository root
docker build -t $IMAGE_NAME \
  -f services_personal-expense-assistant_v2/Dockerfile \
  .

# Push to Google Container Registry
docker push $IMAGE_NAME
```

### Option B: Use Cloud Build (Recommended)

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export SERVICE_NAME=hsa-ai-assistant

# Build using Cloud Build from repository root
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --dockerfile services_personal-expense-assistant_v2/Dockerfile \
  .
```

## Step 3: Configure Environment Variables

Create a `.env.yaml` file for Cloud Run environment variables:

```yaml
# .env.yaml
STORAGE_BUCKET_NAME: "your-gcs-bucket-name"
GOOGLE_CLOUD_PROJECT: "your-project-id"
# Add other environment variables from settings.yaml
```

## Step 4: Deploy to Cloud Run

```bash
# Deploy the service
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8082 \
  --env-vars-file .env.yaml \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10
```

**Important**: 
- `--port 8082` tells Cloud Run to route traffic to the React frontend (nginx)
- If you want to expose the FastAPI backend directly, use `--port 8081`
- If you want to expose Gradio, use `--port 8080`

## Step 5: Update Frontend API URL (Second Deployment)

After first deployment, you'll get a Cloud Run URL like:
```
https://hsa-ai-assistant-xxxxx-uc.a.run.app
```

1. Update the Dockerfile with the actual backend URL:
   ```dockerfile
   # In Dockerfile, update the VITE_API_BASE_URL
   RUN echo "VITE_API_BASE_URL=https://hsa-ai-assistant-xxxxx-uc.a.run.app" > .env
   ```

2. Rebuild and redeploy:
   ```bash
   # Rebuild
   gcloud builds submit \
     --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
     --dockerfile services_personal-expense-assistant_v2/Dockerfile \
     .
   
   # Redeploy (Cloud Run will automatically use the new image)
   gcloud run deploy $SERVICE_NAME \
     --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
     --platform managed \
     --region $REGION
   ```

## Architecture Options

### Option 1: Expose React Frontend (Recommended)
- Users access: `https://your-service.run.app` (React UI on port 8082)
- React calls backend API: `https://your-service.run.app:8081/chat` (same origin, no CORS issues)

### Option 2: Expose Backend Only
- Use `--port 8081`
- Deploy React frontend separately (e.g., Firebase Hosting, Netlify)
- Update CORS settings in `backend.py` to allow your frontend domain

### Option 3: Expose Gradio Frontend
- Use `--port 8080`
- Access Python Gradio UI instead of React

## Testing

After deployment, test the services:

```bash
# Get service URL
export SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

# Test React frontend
curl $SERVICE_URL

# Test backend API
curl -X POST $SERVICE_URL:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "files": [], "session_id": "test", "user_id": "test"}'

# Test Gradio
curl $SERVICE_URL:8080
```

## Troubleshooting

### Build Errors

**Error: `COPY ../frontend/` fails**
- Make sure you're building from the repository root, not from `services_personal-expense-assistant_v2/`

**Error: `npm ci` fails**
- Check that `frontend/package-lock.json` exists
- Try: `cd frontend && npm install && cd ..`

### Deployment Errors

**Error: Container failed to start**
- Check logs: `gcloud run services logs read $SERVICE_NAME --region $REGION`
- Common issues: Missing environment variables, incorrect port

**Error: 502 Bad Gateway**
- nginx or supervisor may have failed to start
- Check container logs

### CORS Errors

If React frontend gets CORS errors calling the backend:
1. Verify backend has CORS middleware configured (already done in `backend.py`)
2. Check that frontend is calling the correct backend URL
3. Verify `allow_origins` in `backend.py` includes your Cloud Run URL

## Monitoring

View logs:
```bash
gcloud run services logs read $SERVICE_NAME --region $REGION --tail
```

## Clean Up

```bash
# Delete the service
gcloud run services delete $SERVICE_NAME --region $REGION

# Delete the image
gcloud container images delete gcr.io/$PROJECT_ID/$SERVICE_NAME
```

## Cost Optimization

Cloud Run charges for:
- **CPU/Memory**: Charged per 100ms of usage
- **Requests**: $0.40 per million requests
- **Network egress**: Varies by region

To optimize costs:
- Use `--cpu-throttling` to reduce CPU usage when idle
- Set `--min-instances 0` to scale to zero
- Use `--memory 512Mi` if your workload allows

## Security Best Practices

1. **Authentication**: Add Cloud Run authentication or use Cloud Identity-Aware Proxy
   ```bash
   gcloud run services update $SERVICE_NAME --no-allow-unauthenticated
   ```

2. **Environment Variables**: Use Secret Manager for sensitive data
   ```bash
   gcloud run services update $SERVICE_NAME \
     --set-secrets="API_KEY=my-api-key:latest"
   ```

3. **CORS**: Restrict `allow_origins` to specific domains in production

4. **Rate Limiting**: Implement rate limiting in FastAPI

## Next Steps

- Set up CI/CD with Cloud Build triggers
- Add custom domain with Cloud Run domain mapping
- Enable Cloud CDN for static assets
- Set up monitoring with Cloud Monitoring


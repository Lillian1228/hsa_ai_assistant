# Docker Deployment Guide

This directory contains a multi-service Docker deployment that includes:
- **FastAPI Backend** (Port 8081)
- **React Frontend** (Port 8082, served by nginx)
- **Gradio Frontend** (Port 8080, optional Python UI)

## Quick Start

### Local Development

1. **Build locally**:
   ```bash
   ./build-local.sh
   ```

2. **Run container**:
   ```bash
   docker run -p 8080:8080 -p 8081:8081 -p 8082:8082 \
     --name hsa-ai-assistant \
     hsa-ai-assistant-local
   ```

3. **Access services**:
   - React Frontend: http://localhost:8082
   - FastAPI Backend: http://localhost:8081
   - Gradio Frontend: http://localhost:8080

### Deploy to Google Cloud Run

1. **Configure environment**:
   ```bash
   cp settings.yaml.example settings.yaml
   # Edit settings.yaml with your configuration
   ```

2. **Create .env.yaml** for Cloud Run:
   ```yaml
   STORAGE_BUCKET_NAME: "your-bucket-name"
   GOOGLE_CLOUD_PROJECT: "your-project-id"
   ```

3. **Deploy**:
   ```bash
   ./deploy.sh
   ```

   Or with options:
   ```bash
   ./deploy.sh -p my-project -r us-west1 -f react
   ```

See [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md) for detailed deployment instructions.

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Supervisord                │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  React Frontend (nginx)  │  │   │
│  │  │  Port 8082               │  │   │
│  │  └──────────────────────────┘  │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  FastAPI Backend         │  │   │
│  │  │  Port 8081               │  │   │
│  │  └──────────────────────────┘  │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  Gradio Frontend         │  │   │
│  │  │  Port 8080               │  │   │
│  │  └──────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Node.js (frontend) + Python (backend) |
| `nginx.conf` | Nginx configuration for serving React static files |
| `supervisord.conf` | Process manager configuration (runs all services) |
| `deploy.sh` | Automated deployment script for Cloud Run |
| `build-local.sh` | Local Docker build script |
| `DEPLOY_CLOUD_RUN.md` | Detailed Cloud Run deployment guide |

## Dockerfile Changes

The Dockerfile has been updated to support React frontend:

### Stage 1: Build React App
```dockerfile
FROM node:18-alpine AS frontend-builder
# Install dependencies and build React app
npm ci && npm run build
# Output: /frontend/dist
```

### Stage 2: Python + Nginx
```dockerfile
FROM python:3.12-slim
# Install nginx and supervisor
# Copy built React app to /app/frontend-dist
# Configure nginx to serve React app on port 8082
```

## CORS Configuration

The backend (`backend.py`) has been configured with CORS middleware to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)
- `http://localhost:8080` (Gradio)
- And their 127.0.0.1 equivalents

For production, update `allow_origins` in `backend.py` to your Cloud Run URL.

## Environment Variables

Create `.env.yaml` for Cloud Run deployment:

```yaml
STORAGE_BUCKET_NAME: "your-gcs-bucket-name"
GOOGLE_CLOUD_PROJECT: "your-project-id"
# Add other variables from settings.yaml as needed
```

## Troubleshooting

### Build fails with "frontend not found"
- Ensure you're building from the repository root
- The Dockerfile expects frontend at `../frontend/` relative to Dockerfile location

### React app shows "API connection error"
- Check that VITE_API_BASE_URL is set correctly in Dockerfile
- For Cloud Run, update the URL after first deployment and rebuild

### Container fails to start
- Check logs: `docker logs hsa-ai-assistant`
- Common issues: Missing env vars, port conflicts

### CORS errors in browser
- Verify backend CORS middleware includes your frontend origin
- Check browser console for exact error message

## Port Reference

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Gradio Frontend | 8080 | HTTP | Python web UI (optional) |
| FastAPI Backend | 8081 | HTTP | REST API |
| React Frontend | 8082 | HTTP | Main web UI (nginx) |

## Development Workflow

1. **Local development** (outside Docker):
   - Frontend: `cd frontend && npm run dev` (port 3000)
   - Backend: `cd services_personal-expense-assistant_v2 && uv run backend.py` (port 8081)

2. **Test in Docker**:
   ```bash
   ./build-local.sh
   docker run -p 8080:8080 -p 8081:8081 -p 8082:8082 hsa-ai-assistant-local
   ```

3. **Deploy to Cloud Run**:
   ```bash
   ./deploy.sh
   ```

## Cloud Run Considerations

### Which Port to Expose?

**Option 1: React Frontend (Recommended)**
```bash
./deploy.sh -f react  # Port 8082
```
- Best user experience
- Single URL for users
- No CORS issues (same origin)

**Option 2: Backend Only**
```bash
./deploy.sh -f backend  # Port 8081
```
- Deploy frontend separately (Firebase Hosting, Netlify, etc.)
- Need to configure CORS properly

**Option 3: Gradio**
```bash
./deploy.sh -f gradio  # Port 8080
```
- Use Python Gradio UI instead of React

### Cost Optimization

Cloud Run charges based on usage:
- Set `--min-instances 0` to scale to zero (included in deploy.sh)
- Use appropriate memory/CPU (default: 2Gi/2CPU)
- Consider Cloud CDN for static assets

## Security

1. **Authentication**: Consider adding Cloud Run authentication
2. **CORS**: Restrict origins in production
3. **Secrets**: Use Secret Manager for sensitive data
4. **Rate Limiting**: Implement in FastAPI middleware

## Monitoring

View logs:
```bash
# Local
docker logs -f hsa-ai-assistant

# Cloud Run
gcloud run services logs read hsa-ai-assistant --region us-central1 --tail
```

## Next Steps

- [ ] Configure production environment variables
- [ ] Update frontend API URL for Cloud Run
- [ ] Set up custom domain
- [ ] Enable Cloud CDN
- [ ] Configure authentication
- [ ] Set up CI/CD with Cloud Build
- [ ] Add monitoring and alerting

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Supervisord](http://supervisord.org/)


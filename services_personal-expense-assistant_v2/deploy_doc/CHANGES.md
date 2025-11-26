# Changes Summary - Docker & Cloud Run Support for React Frontend

## Overview

This document summarizes the changes made to support React frontend deployment alongside the Python backend in a single Docker container for Google Cloud Run.

## Modified Files

### 1. `backend.py`
**Changes**: Added CORS middleware configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "http://localhost:8080",  # Gradio frontend
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why**: Allows the React frontend to make API calls to the backend without CORS errors.

### 2. `Dockerfile`
**Changes**: Complete rewrite with multi-stage build

**Stage 1 (frontend-builder)**:
- Uses `node:18-alpine` image
- Copies frontend code from `frontend/` directory
- Runs `npm ci` to install dependencies
- Runs `npm run build` to create production build
- Output: `/frontend/dist`

**Stage 2 (main)**:
- Uses `python:3.12-slim` base image
- Installs nginx, supervisor, curl
- Copies backend code from `services_personal-expense-assistant_v2/`
- Copies built frontend from Stage 1 to `/app/frontend-dist`
- Configures nginx to serve frontend
- Exposes ports 8081 (backend) and 8082 (frontend)

**Important**: Must be built from repository root:
```bash
docker build -f services_personal-expense-assistant_v2/Dockerfile .
```

### 3. `supervisord.conf`
**Changes**: Added nginx process

Added new program section:
```ini
[program:react_frontend]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
startsecs=5
startretries=3
priority=999
```

**Why**: Supervisor manages all three services (backend, gradio, nginx) in a single container.

## New Files

### 4. `nginx.conf`
**Purpose**: Nginx configuration for serving React static files

**Features**:
- Serves React app from `/app/frontend-dist`
- Listens on port 8082
- Enables gzip compression
- Configures React Router (SPA routing)
- Sets cache headers for static assets
- Adds security headers
- Provides `/health` endpoint for Cloud Run

### 5. `deploy.sh`
**Purpose**: Automated deployment script for Google Cloud Run

**Features**:
- Build with Cloud Build
- Deploy to Cloud Run with proper configuration
- Options for different frontend types (react/gradio/backend)
- Configurable project, region, memory, CPU
- Color-coded output and progress indicators

**Usage**:
```bash
./deploy.sh                    # Deploy with defaults
./deploy.sh -f react           # Deploy React frontend
./deploy.sh -f gradio          # Deploy Gradio frontend
./deploy.sh -p my-project      # Deploy to specific project
```

### 6. `build-local.sh`
**Purpose**: Build and test Docker image locally

**Usage**:
```bash
./build-local.sh
docker run -p 8080:8080 -p 8081:8081 -p 8082:8082 hsa-ai-assistant-local
```

### 7. `.dockerignore`
**Purpose**: Optimize Docker build by excluding unnecessary files

**Excludes**:
- Python cache files (`__pycache__/`, `*.pyc`)
- Virtual environments (`venv/`, `env/`)
- IDE files (`.vscode/`, `.idea/`)
- Testing files (`.pytest_cache/`)
- Git files (`.git/`)
- Documentation (most `.md` files)

### 8. `DEPLOY_CLOUD_RUN.md`
**Purpose**: Comprehensive deployment guide

**Contents**:
- Prerequisites and setup
- Step-by-step deployment instructions
- Architecture options
- Troubleshooting guide
- Cost optimization tips
- Security best practices

### 9. `README_DOCKER.md`
**Purpose**: Quick reference for Docker deployment

**Contents**:
- Quick start guide
- Architecture diagram
- Files overview
- CORS configuration
- Port reference
- Development workflow
- Cloud Run considerations

## Architecture

### Container Structure
```
Docker Container
├── Supervisord (process manager)
│   ├── FastAPI Backend (port 8081)
│   ├── Gradio Frontend (port 8080)
│   └── Nginx (port 8082)
│       └── React Static Files (/app/frontend-dist)
└── Python Environment + Dependencies
```

### Port Assignment
- **8080**: Gradio frontend (Python web UI)
- **8081**: FastAPI backend (REST API)
- **8082**: React frontend (nginx serving static files)

## Deployment Options

### Option 1: Expose React Frontend (Recommended)
```bash
./deploy.sh -f react
```
- Users access React UI at Cloud Run URL
- React calls backend on same domain (no CORS issues)
- Best user experience

### Option 2: Expose Backend Only
```bash
./deploy.sh -f backend
```
- Deploy frontend separately (Firebase Hosting, Netlify)
- Configure CORS for external frontend domain

### Option 3: Expose Gradio Frontend
```bash
./deploy.sh -f gradio
```
- Use Python Gradio UI instead of React
- Simpler deployment, less modern UI

## Environment Variables

### Local Development
Use `settings.yaml` for local configuration

### Cloud Run Deployment
Create `.env.yaml`:
```yaml
STORAGE_BUCKET_NAME: "your-bucket-name"
GOOGLE_CLOUD_PROJECT: "your-project-id"
```

### Frontend API URL
Update in Dockerfile before deployment:
```dockerfile
RUN echo "VITE_API_BASE_URL=https://your-cloud-run-url" > .env
```

## Build Context

**Critical**: All Docker builds must run from repository root:

```bash
# Correct ✅
cd /Users/xli8/code/hsa_ai_assistant
docker build -f services_personal-expense-assistant_v2/Dockerfile .

# Wrong ❌
cd services_personal-expense-assistant_v2
docker build -f Dockerfile .
```

**Why**: The Dockerfile needs access to both `frontend/` and `services_personal-expense-assistant_v2/` directories.

## Testing Checklist

### Local Testing
- [ ] Build Docker image: `./build-local.sh`
- [ ] Run container: `docker run -p 8080:8080 -p 8081:8081 -p 8082:8082 ...`
- [ ] Access React frontend: http://localhost:8082
- [ ] Test backend API: http://localhost:8081
- [ ] Check Gradio UI: http://localhost:8080
- [ ] Verify logs: `docker logs hsa-ai-assistant`

### Cloud Run Testing
- [ ] Deploy: `./deploy.sh`
- [ ] Access service URL
- [ ] Test API endpoints
- [ ] Check CORS headers
- [ ] View logs: `gcloud run services logs read ...`
- [ ] Test scaling (multiple requests)
- [ ] Verify environment variables

## Known Issues & Solutions

### Issue 1: Frontend shows "API connection error"
**Solution**: Update `VITE_API_BASE_URL` in Dockerfile with actual Cloud Run URL and rebuild.

### Issue 2: CORS errors in browser console
**Solution**: Ensure backend CORS middleware includes your frontend origin in `allow_origins`.

### Issue 3: Build fails with "frontend not found"
**Solution**: Build from repository root, not from `services_personal-expense-assistant_v2/`.

### Issue 4: Container fails to start
**Solution**: Check that `.env.yaml` has all required environment variables.

## Performance Considerations

### Build Time
- **Frontend build**: ~2-3 minutes (npm install + build)
- **Backend setup**: ~1-2 minutes (uv sync)
- **Total build time**: ~3-5 minutes

### Image Size
- **Frontend builder**: ~500MB (node:18-alpine + dependencies)
- **Final image**: ~800MB-1GB (python:3.12-slim + nginx + app)
- **Optimization**: Use multi-stage build (frontend builder discarded)

### Runtime Performance
- **nginx**: Serves static files efficiently with gzip
- **supervisord**: Minimal overhead for process management
- **Cold start**: ~3-5 seconds on Cloud Run

## Security Considerations

1. **CORS**: Restrict `allow_origins` to specific domains in production
2. **Authentication**: Add Cloud Run authentication for sensitive data
3. **Secrets**: Use Secret Manager for API keys
4. **Headers**: nginx adds security headers (X-Frame-Options, etc.)
5. **Rate Limiting**: Consider adding in FastAPI middleware

## Maintenance

### Updating Frontend
1. Make changes in `frontend/` directory
2. Rebuild Docker image
3. Redeploy to Cloud Run

### Updating Backend
1. Make changes in `services_personal-expense-assistant_v2/`
2. Update dependencies in `pyproject.toml` if needed
3. Rebuild and redeploy

### Updating Dependencies
- **Frontend**: Update `frontend/package.json` and run `npm install`
- **Backend**: Update `pyproject.toml` and run `uv sync`

## Rollback

If deployment fails:
```bash
# List revisions
gcloud run revisions list --service hsa-ai-assistant --region us-central1

# Rollback to previous revision
gcloud run services update-traffic hsa-ai-assistant \
  --to-revisions REVISION-NAME=100 \
  --region us-central1
```

## Next Steps

1. **CI/CD Setup**: Create Cloud Build trigger for automatic deployments
2. **Custom Domain**: Map custom domain to Cloud Run service
3. **Monitoring**: Set up Cloud Monitoring alerts
4. **CDN**: Enable Cloud CDN for static assets
5. **Authentication**: Implement user authentication
6. **Database**: Connect to Cloud SQL or Firestore
7. **Logging**: Enhance structured logging
8. **Testing**: Add integration tests

## Resources

- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Supervisord](http://supervisord.org/)


# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Stage 1: Build React frontend
# Note: Docker build must be run from repository root with:
#   docker build -f services_personal-expense-assistant_v2/Dockerfile .
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Create production .env file with backend API URL
# Note: Update VITE_API_BASE_URL to your Cloud Run backend URL after deployment
RUN echo "VITE_API_BASE_URL=https://personal-expense-assistant-43823015060.us-central1.run.app" > .env

# Build frontend for production
RUN npm run build

# Stage 2: Python backend + serve static frontend
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install nginx, supervisor, and curl
RUN apt-get update && apt-get install -y \
    supervisor \
    curl \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend code from services_personal-expense-assistant_v2/
COPY backend/ /app/

# Install Python dependencies
RUN uv sync --frozen

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /frontend/dist /app/frontend-dist

# Copy nginx configuration
COPY nginx.conf /etc/nginx/sites-available/frontend

# Enable the site and remove default
RUN ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/frontend \
    && rm -f /etc/nginx/sites-enabled/default

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
# 8080: Gradio frontend (optional, if you still want to keep it)
# 8081: FastAPI backend
# 8082: React frontend (nginx)
EXPOSE 8080 8081 8082

ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

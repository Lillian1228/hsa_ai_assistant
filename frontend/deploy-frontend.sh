#!/bin/bash

# 简单的 React 前端部署脚本
# 用法: ./deploy-frontend.sh

set -e  # 遇到错误就退出

# 配置
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"
SERVICE_NAME="hsa-ai-assistant-frontend"
BACKEND_URL="https://personal-expense-assistant-43823015060.us-central1.run.app"

echo "======================================"
echo "部署 React 前端到 Cloud Run"
echo "======================================"
echo ""
echo "项目 ID:    $PROJECT_ID"
echo "区域:       $REGION"
echo "服务名:     $SERVICE_NAME"
echo "后端 API:   $BACKEND_URL"
echo ""

# 检查项目 ID
if [ -z "$PROJECT_ID" ]; then
    echo "错误: 没有配置 Google Cloud 项目"
    echo "请运行: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# 设置项目
gcloud config set project $PROJECT_ID

# 构建镜像
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "步骤 1/2: 构建 Docker 镜像..."
echo ""

# 创建临时 Dockerfile（在构建时注入后端 URL）
cat > Dockerfile.frontend.tmp <<EOF
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码（.dockerignore 会自动排除不需要的文件）
COPY . ./

# 设置后端 API URL
RUN echo "VITE_API_BASE_URL=$BACKEND_URL" > .env

# 构建
RUN npm run build

# Stage 2: Nginx 服务
FROM nginx:alpine

# 复制构建产物
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8082

CMD ["nginx", "-g", "daemon off;"]
EOF

# 使用 Cloud Build 构建
cat > cloudbuild_frontend.yaml <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'Dockerfile.frontend.tmp', '-t', '$IMAGE_NAME', '.']
images:
  - '$IMAGE_NAME'
timeout: 1200s
EOF

gcloud builds submit --config cloudbuild_frontend.yaml .

# 清理临时文件
rm Dockerfile.frontend.tmp cloudbuild_frontend.yaml

echo ""
echo "✅ 镜像构建完成"
echo ""
echo "步骤 2/2: 部署到 Cloud Run..."
echo ""

# 部署到 Cloud Run
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

# 获取服务 URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "======================================"
echo "✅ 部署成功！"
echo "======================================"
echo ""
echo "前端地址: $SERVICE_URL"
echo "后端 API: $BACKEND_URL"
echo ""
echo "查看日志:"
echo "  gcloud run services logs read $SERVICE_NAME --region $REGION --tail"
echo ""


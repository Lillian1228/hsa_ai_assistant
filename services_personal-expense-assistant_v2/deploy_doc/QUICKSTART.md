# 🚀 Quick Start Guide

快速部署 HSA AI Assistant (React 前端 + FastAPI 后端) 到 Google Cloud Run

## ⚡ 最快部署方式

### 1️⃣ 本地测试 (可选)

```bash
cd /Users/xli8/code/hsa_ai_assistant/services_personal-expense-assistant_v2
./build-local.sh

# 运行容器
docker run -p 8080:8080 -p 8081:8081 -p 8082:8082 \
  --name hsa-ai-assistant \
  hsa-ai-assistant-local

# 访问服务
# React 前端: http://localhost:8082
# FastAPI 后端: http://localhost:8081
# Gradio 前端: http://localhost:8080
```

### 2️⃣ 部署到 Cloud Run

```bash
cd /Users/xli8/code/hsa_ai_assistant/services_personal-expense-assistant_v2

# 创建环境变量文件
cat > .env.yaml <<EOF
STORAGE_BUCKET_NAME: "your-gcs-bucket-name"
GOOGLE_CLOUD_PROJECT: "your-project-id"
EOF

# 部署 (使用 React 前端)
./deploy.sh

# 或者指定选项
./deploy.sh -p my-project -r us-west1 -f react
```

### 3️⃣ 更新前端 API URL 并重新部署

部署后，你会得到一个 Cloud Run URL，比如：
`https://hsa-ai-assistant-xxxxx-uc.a.run.app`

更新 Dockerfile 的第 34 行：
```dockerfile
RUN echo "VITE_API_BASE_URL=https://hsa-ai-assistant-xxxxx-uc.a.run.app" > .env
```

重新部署：
```bash
./deploy.sh
```

## 📋 修改内容

### 已修改的文件
1. ✅ `backend.py` - 添加了 CORS 中间件
2. ✅ `Dockerfile` - 多阶段构建 (Node.js + Python)
3. ✅ `supervisord.conf` - 添加了 nginx 进程

### 新增的文件
4. ✅ `nginx.conf` - Nginx 配置文件
5. ✅ `deploy.sh` - 自动化部署脚本
6. ✅ `build-local.sh` - 本地构建脚本
7. ✅ `.dockerignore` - Docker 构建优化
8. ✅ `DEPLOY_CLOUD_RUN.md` - 详细部署指南
9. ✅ `README_DOCKER.md` - Docker 快速参考
10. ✅ `CHANGES.md` - 修改总结
11. ✅ `QUICKSTART.md` - 本文件

## 🎯 关键要点

### 跨域问题已解决 ✅
- `backend.py` 添加了 CORS 中间件
- 支持 `localhost:5173`, `localhost:3000`, `localhost:8080`
- 生产环境需要添加你的 Cloud Run URL

### Docker 构建必须从 Repository Root 运行
```bash
# ✅ 正确
cd /Users/xli8/code/hsa_ai_assistant
docker build -f services_personal-expense-assistant_v2/Dockerfile .

# ❌ 错误
cd services_personal-expense-assistant_v2
docker build -f Dockerfile .
```

### 端口分配
- **8080**: Gradio 前端 (Python Web UI)
- **8081**: FastAPI 后端 (REST API)
- **8082**: React 前端 (Nginx 静态文件)

## 📖 详细文档

| 文档 | 用途 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 快速开始 (本文件) |
| [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md) | Cloud Run 详细部署指南 |
| [README_DOCKER.md](./README_DOCKER.md) | Docker 架构和配置 |
| [CHANGES.md](./CHANGES.md) | 完整修改列表和技术细节 |

## 🔧 部署脚本选项

```bash
./deploy.sh [OPTIONS]

选项:
  -p, --project PROJECT_ID      # Google Cloud 项目 ID
  -r, --region REGION            # Cloud Run 区域 (默认: us-central1)
  -n, --name SERVICE_NAME        # 服务名称 (默认: hsa-ai-assistant)
  -f, --frontend-type TYPE       # 前端类型: react|gradio|backend
  -m, --memory MEMORY            # 内存分配 (默认: 2Gi)
  -c, --cpu CPU                  # CPU 分配 (默认: 2)
  -h, --help                     # 显示帮助

示例:
  ./deploy.sh                           # 使用默认设置 (React 前端)
  ./deploy.sh -f gradio                 # 部署 Gradio 前端
  ./deploy.sh -f backend                # 仅部署后端
  ./deploy.sh -p my-project -r us-west1 # 指定项目和区域
```

## 🐛 常见问题

### Q: 前端显示 "API connection error"
**A**: 更新 Dockerfile 中的 `VITE_API_BASE_URL` 为你的 Cloud Run URL，然后重新部署。

### Q: 浏览器显示 CORS 错误
**A**: 确保 `backend.py` 的 CORS 中间件中包含了你的前端域名。

### Q: Docker 构建失败 "frontend not found"
**A**: 必须从 repository root 构建，使用 `-f` 参数指定 Dockerfile 路径。

### Q: Container 启动失败
**A**: 检查 `.env.yaml` 是否包含所有必需的环境变量。

## 📊 架构图

```
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Run Container                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Supervisord (进程管理)              │  │
│  │                                                  │  │
│  │  ┌──────────────────┐  ┌──────────────────┐    │  │
│  │  │  Nginx (8082)    │  │  FastAPI (8081)  │    │  │
│  │  │  React 静态文件  │  │  REST API        │    │  │
│  │  └──────────────────┘  └──────────────────┘    │  │
│  │                                                  │  │
│  │  ┌──────────────────┐                          │  │
│  │  │  Gradio (8080)   │                          │  │
│  │  │  Python Web UI   │                          │  │
│  │  └──────────────────┘                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## ✅ 部署检查清单

- [ ] 安装了 Google Cloud SDK (`gcloud --version`)
- [ ] 已登录 Google Cloud (`gcloud auth login`)
- [ ] 设置了项目 ID (`gcloud config set project PROJECT_ID`)
- [ ] 启用了必要的 API (Cloud Run, Cloud Build, Artifact Registry)
- [ ] 创建了 `.env.yaml` 文件
- [ ] 从 repository root 运行构建命令
- [ ] 首次部署后更新了 `VITE_API_BASE_URL`
- [ ] 重新部署以使用正确的 API URL

## 🎉 完成！

部署成功后，你会得到一个 Cloud Run URL。访问这个 URL 即可使用你的应用！

```bash
# 查看日志
gcloud run services logs read hsa-ai-assistant --region us-central1 --tail

# 查看服务详情
gcloud run services describe hsa-ai-assistant --region us-central1
```

## 📞 需要帮助？

查看详细文档：
- [DEPLOY_CLOUD_RUN.md](./DEPLOY_CLOUD_RUN.md) - 完整部署指南
- [README_DOCKER.md](./README_DOCKER.md) - Docker 架构
- [CHANGES.md](./CHANGES.md) - 技术细节

祝部署顺利！🚀


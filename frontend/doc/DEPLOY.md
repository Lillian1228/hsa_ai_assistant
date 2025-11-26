# 🚀 前端部署指南

## 快速开始

```bash
cd frontend
./deploy-frontend.sh
```

就这么简单！🎉

## 目录结构

```
frontend/
├── deploy-frontend.sh    # 部署脚本
├── nginx.conf            # Nginx 配置
├── .dockerignore         # Docker 构建排除文件
├── package.json
├── src/
└── ...
```

## 配置

### 修改后端 API 地址

编辑 `deploy-frontend.sh` 第 12 行：

```bash
BACKEND_URL="https://your-backend-url.run.app"
```

### 修改服务名称

编辑 `deploy-frontend.sh` 第 11 行：

```bash
SERVICE_NAME="your-service-name"
```

## 工作原理

1. **构建阶段**：
   - 使用 Node.js 18 Alpine 镜像
   - 安装依赖（`npm ci`）
   - 注入后端 API URL 到 `.env` 文件
   - 构建生产版本（`npm run build`）

2. **服务阶段**：
   - 使用 Nginx Alpine 镜像
   - 复制构建产物到 `/usr/share/nginx/html`
   - 配置 SPA 路由支持
   - 暴露 8082 端口

3. **部署阶段**：
   - 上传到 Google Container Registry
   - 部署到 Cloud Run
   - 配置自动扩缩容

## 镜像大小

- **总大小**: ~50MB
- **Node.js 构建阶段**: 丢弃（多阶段构建）
- **Nginx + 静态文件**: 保留

## 性能配置

- **内存**: 512Mi
- **CPU**: 1
- **最小实例**: 0（省钱）
- **最大实例**: 5

## 本地开发

```bash
cd frontend
npm install
npm run dev
```

本地开发端口：http://localhost:3000

## 更新部署

修改代码后，重新运行脚本：

```bash
./deploy-frontend.sh
```

## 查看日志

```bash
gcloud run services logs read hsa-ai-assistant-frontend --region us-central1 --tail
```

## 删除服务

```bash
gcloud run services delete hsa-ai-assistant-frontend --region us-central1
```

## 常见问题

### Q: 构建失败？
**A**: 
- 确保在 `frontend/` 目录下运行脚本
- 检查 `package.json` 是否存在
- 检查 Google Cloud 项目配置

### Q: 404 错误？
**A**: 
- 检查 `nginx.conf` 配置
- 确认构建产物在 `/usr/share/nginx/html`

### Q: API 连接失败？
**A**: 
- 检查 `BACKEND_URL` 是否正确
- 确认后端服务已部署并运行
- 检查后端 CORS 配置

### Q: 修改代码后没生效？
**A**: 
- 需要重新运行 `./deploy-frontend.sh`
- Cloud Run 会使用新镜像自动更新

## 优化建议

### 1. 开发流程
```bash
# 本地开发（推荐）
npm run dev

# 测试通过后再部署
./deploy-frontend.sh
```

### 2. 缓存优化
`.dockerignore` 已配置，排除不必要的文件加速构建。

### 3. 成本控制
- 设置 `--min-instances 0` 闲置时不收费
- 使用较小的资源配置（512Mi/1CPU）
- 定期清理旧镜像

## 文件说明

| 文件 | 用途 |
|------|------|
| `deploy-frontend.sh` | 部署脚本 |
| `nginx.conf` | Nginx 配置 |
| `.dockerignore` | 排除不需要的文件 |
| `Dockerfile.frontend.tmp` | 临时 Dockerfile（自动生成） |
| `cloudbuild_frontend.yaml` | Cloud Build 配置（自动生成） |

## 技术栈

- **构建**: Node.js 18 Alpine
- **Web 服务器**: Nginx Alpine
- **部署平台**: Google Cloud Run
- **容器注册**: Google Container Registry

## 成本估算

个人使用（每天 100 次访问）：
- **请求**: 免费额度内 ✅
- **CPU**: 免费额度内 ✅
- **内存**: 免费额度内 ✅
- **存储**: ~$0.001/月

基本免费！🎉

## 支持

如有问题，请检查：
1. Google Cloud 配置
2. 网络连接
3. 构建日志
4. Cloud Run 日志


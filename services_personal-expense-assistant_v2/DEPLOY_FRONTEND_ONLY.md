# 🚀 仅部署 React 前端

最简单的前端部署方式，只需一个命令。

## 快速开始

```bash
cd services_personal-expense-assistant_v2
./deploy-frontend.sh
```

## 配置说明

脚本会自动使用以下配置：

| 配置项 | 默认值 |
|--------|--------|
| 项目 ID | 当前 gcloud 配置的项目 |
| 区域 | us-central1 |
| 服务名 | hsa-ai-assistant-frontend |
| 后端 API | https://personal-expense-assistant-43823015060.us-central1.run.app |
| 内存 | 512Mi |
| CPU | 1 |

## 修改后端 API 地址

编辑 `deploy-frontend.sh` 第 10 行：

```bash
BACKEND_URL="https://your-backend-url.run.app"
```

## 工作原理

1. **构建阶段**：
   - 使用 Node.js 18 构建 React 应用
   - 将后端 API URL 写入 `.env` 文件
   - 运行 `npm run build` 生成静态文件

2. **部署阶段**：
   - 使用 Nginx Alpine 镜像作为基础
   - 复制构建好的静态文件到 Nginx
   - 配置 SPA 路由支持
   - 部署到 Cloud Run

## 镜像大小

- **基础镜像**: nginx:alpine (~40MB)
- **React 构建产物**: ~2-5MB
- **总大小**: ~50MB (比完整镜像小很多)

## 优势

✅ **快速**：构建时间 ~2-3 分钟  
✅ **轻量**：镜像只有 50MB  
✅ **便宜**：512Mi 内存 + 1 CPU，成本低  
✅ **简单**：一个命令完成部署  
✅ **独立**：前端和后端分开部署，解耦合

## 查看日志

```bash
gcloud run services logs read hsa-frontend --region us-central1 --tail
```

## 更新部署

修改代码后，重新运行脚本即可：

```bash
./deploy-frontend.sh
```

## 删除服务

```bash
gcloud run services delete hsa-frontend --region us-central1
```

## 常见问题

### Q: 前端无法连接后端？
**A**: 检查 `BACKEND_URL` 是否正确，并确保后端已经部署且可访问。

### Q: 构建失败？
**A**: 确保在 `services_personal-expense-assistant_v2/` 目录下运行脚本。

### Q: 想修改服务名？
**A**: 编辑脚本第 9 行的 `SERVICE_NAME`。

### Q: 需要认证访问？
**A**: 移除脚本中的 `--allow-unauthenticated` 参数。

## 与完整部署的区别

| 特性 | 仅前端 | 完整部署 |
|------|--------|----------|
| 镜像大小 | ~50MB | ~800MB |
| 构建时间 | 2-3分钟 | 5-8分钟 |
| 内存需求 | 512Mi | 2Gi |
| CPU 需求 | 1 | 2 |
| 包含后端 | ❌ | ✅ |
| 包含 Gradio | ❌ | ✅ |
| 成本 | 低 | 高 |

## 适用场景

- ✅ 前后端分离部署
- ✅ 快速迭代前端
- ✅ 降低部署成本
- ✅ 多个前端连接同一后端
- ❌ 需要 all-in-one 部署（用 `./deploy.sh` 代替）


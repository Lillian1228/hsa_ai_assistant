# HSA AI Assistant Frontend - 部署指南 🚀

## 📋 部署前检查清单

### 1. 代码准备
- [ ] 所有功能测试通过
- [ ] 无 ESLint 错误
- [ ] 无 TypeScript 错误
- [ ] 生产构建成功
- [ ] 环境变量配置正确

### 2. 环境配置
- [ ] 配置正确的 API 端点
- [ ] 设置生产环境变量
- [ ] 准备 SSL 证书（HTTPS）
- [ ] 配置 CDN（可选）

---

## 🔧 环境变量配置

### 开发环境（`.env.development`）
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 生产环境（`.env.production`）
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## 🏗️ 构建生产版本

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 运行 Lint 检查
```bash
npm run lint
```

### 3. 构建
```bash
npm run build
```

构建产物将生成在 `dist/` 目录。

### 4. 本地预览
```bash
npm run preview
```

访问 `http://localhost:4173` 预览生产版本。

---

## 🌐 部署选项

### 选项 1: Vercel（推荐）

#### 优点
- ✅ 零配置部署
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动预览环境
- ✅ 免费额度充足

#### 步骤
1. 在 Vercel 创建账号
2. 连接 GitHub 仓库
3. 配置环境变量：
   ```
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```
4. 点击部署

#### vercel.json 配置（可选）
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 选项 2: Netlify

#### 优点
- ✅ 简单易用
- ✅ 自动 HTTPS
- ✅ 表单处理
- ✅ 函数支持
- ✅ 免费额度

#### 步骤
1. 在 Netlify 创建账号
2. 连接 GitHub 仓库
3. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 配置环境变量
5. 部署

#### netlify.toml 配置
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 选项 3: GitHub Pages

#### 优点
- ✅ 完全免费
- ✅ 简单部署
- ✅ 集成 GitHub

#### 步骤
1. 安装 `gh-pages`：
```bash
npm install --save-dev gh-pages
```

2. 在 `package.json` 添加：
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/hsa-ai-assistant"
}
```

3. 修改 `vite.config.ts`：
```typescript
export default defineConfig({
  base: '/hsa-ai-assistant/',
  // ...
});
```

4. 部署：
```bash
npm run deploy
```

---

### 选项 4: Docker 容器化

#### Dockerfile
```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 构建和运行
```bash
# 构建镜像
docker build -t hsa-ai-assistant-frontend .

# 运行容器
docker run -d -p 8080:80 hsa-ai-assistant-frontend
```

---

### 选项 5: 传统服务器（Nginx）

#### 步骤
1. 构建生产版本：
```bash
npm run build
```

2. 将 `dist/` 目录上传到服务器

3. 配置 Nginx：
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/hsa-ai-assistant;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（可选）
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. 重启 Nginx：
```bash
sudo systemctl restart nginx
```

---

## 🔒 安全配置

### 1. HTTPS 配置

#### 使用 Let's Encrypt（免费）
```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 2. 安全头部

在 Nginx 配置中添加：
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

### 3. CORS 配置

如果 API 在不同域名：
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 📊 性能优化

### 1. 构建优化

#### 启用代码压缩
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

#### 代码分割
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'antd': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
});
```

### 2. CDN 配置

#### 使用公共 CDN
```html
<!-- index.html -->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
```

### 3. 图片优化

- 使用 WebP 格式
- 启用懒加载
- 使用响应式图片

---

## 🐛 故障排查

### 常见问题

#### 1. 路由 404 错误
**问题**：刷新页面出现 404

**解决**：配置服务器将所有路由指向 `index.html`
```nginx
try_files $uri $uri/ /index.html;
```

#### 2. API 跨域错误
**问题**：API 请求被 CORS 阻止

**解决**：
- 后端配置 CORS 头部
- 使用代理
- 确保 API 域名配置正确

#### 3. 环境变量不生效
**问题**：`import.meta.env` 未定义

**解决**：
- 确保环境变量以 `VITE_` 开头
- 重新构建项目
- 检查 `.env` 文件位置

#### 4. 白屏问题
**问题**：部署后页面空白

**解决**：
- 检查浏览器控制台错误
- 确认 `base` 路径配置正确
- 检查资源路径

---

## 📈 监控和分析

### 1. 错误监控

#### 集成 Sentry
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 2. 性能监控

#### Google Analytics
```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. 用户行为分析
- Mixpanel
- Amplitude
- Hotjar

---

## 🔄 CI/CD 配置

### GitHub Actions

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
        
      - name: Build
        run: npm run build
        working-directory: ./frontend
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

---

## ✅ 部署后检查

### 1. 功能测试
- [ ] 所有页面可访问
- [ ] 路由跳转正常
- [ ] API 调用成功
- [ ] 文件上传功能
- [ ] 响应式布局

### 2. 性能测试
- [ ] 首屏加载时间 < 3秒
- [ ] Lighthouse 分数 > 90
- [ ] 无内存泄漏

### 3. 安全检查
- [ ] HTTPS 正常工作
- [ ] 安全头部配置
- [ ] 无敏感信息泄露

### 4. 监控配置
- [ ] 错误监控正常
- [ ] 性能监控正常
- [ ] 日志收集正常

---

## 📞 支持

如有部署问题，请联系：
- Email: support@example.com
- Slack: #hsa-ai-assistant
- GitHub Issues: [项目地址]

---

**文档版本：** 1.0.0  
**最后更新：** 2024-11-22


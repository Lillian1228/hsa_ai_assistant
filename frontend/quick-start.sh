#!/bin/bash

# HSA AI Assistant Frontend - Quick Start Script

echo "🚀 HSA AI Assistant Frontend - Quick Start"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✓ npm 版本: $(npm --version)"
echo ""

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✓ 依赖安装完成"
else
    echo "✓ 依赖已安装"
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  创建环境变量文件..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✓ 已创建 .env 文件（从 env.example 复制）"
        echo "  请检查并根据需要修改 .env 文件中的配置"
    else
        echo "⚠️  未找到 env.example 文件"
    fi
fi

echo ""
echo "✅ 设置完成！"
echo ""
echo "📝 可用命令："
echo "  npm run dev      - 启动开发服务器"
echo "  npm run build    - 构建生产版本"
echo "  npm run preview  - 预览生产构建"
echo "  npm run lint     - 代码检查"
echo "  npm run format   - 代码格式化"
echo ""
echo "🌐 启动开发服务器..."
npm run dev


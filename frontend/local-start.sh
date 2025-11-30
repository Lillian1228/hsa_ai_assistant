#!/bin/bash

# HSA AI Assistant Frontend - Quick Start Script

echo "🚀 HSA AI Assistant Frontend - Quick Start"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed, please install Node.js >= 18.0.0"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not installed"
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Install dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Dependency installation failed"
        exit 1
    fi
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Check environment variable file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating environment variable file..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✓ Created .env file (from env.example)"
        echo "  Please check and modify the configuration in .env file as needed"
    else
        echo "⚠️  env.example file not found"  
    fi
fi

echo ""
echo "✅ Setup completed!"
echo ""
echo "📝 Available commands:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build production version"
echo "  npm run preview  - Preview production build"
echo "  npm run lint     - Code quality check"
echo "  npm run format   - Code formatting"
echo ""
echo "🌐 Start development server..."
npm run dev


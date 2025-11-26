# Get Started

Quick guide to set up and run the HSA AI Assistant frontend.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Install Node.js

**macOS (Homebrew)**:
```bash
brew install node
```

**Windows**: Download from [nodejs.org](https://nodejs.org/)

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

## Installation

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Run Development Server

```bash
npm run dev
```

Application will start at `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint code quality check |
| `npm run format` | Format code with Prettier |

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (routes)
│   ├── services/       # API layer
│   ├── store/          # State management (Zustand)
│   ├── types/          # TypeScript types
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
├── public/             # Static assets
├── doc/                # Documentation
└── package.json        # Dependencies
```

## Testing with Mock Data

If backend is not ready, use Apifox or similar tools to mock API responses.

See `MOCK_DATA_EXAMPLES.md` for complete mock data examples.

### Quick Mock Setup

1. **POST /chat** (upload receipt):
   - Match condition: `has_file=true`
   - Response: Return `ReceiptResponse` with receipt data

2. **POST /approve** (save receipt):
   - Response: Return `ApproveResponse` with `ItemFull[]` array

## Common Issues

### Port already in use
Change port in `vite.config.ts`:
```typescript
server: {
  port: 3001,
}
```

### Module not found
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Type errors
Run type check:
```bash
npx tsc --noEmit
```

## Next Steps

1. Read `PROJECT_OVERVIEW.md` for architecture details
2. Check `MOCK_DATA_EXAMPLES.md` for API testing
3. See `DEPLOYMENT.md` for production deployment

## Quick Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000 (configure in `.env`)
- **Documentation**: `/frontend/doc/`


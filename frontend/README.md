# HSA AI Assistant - Frontend

React-based web application for managing HSA (Health Savings Account) expenses with AI-powered receipt analysis.

## Features

- 📸 **Receipt Upload**: Drag & drop or click to upload receipt images
- 🤖 **AI Analysis**: Automatic identification of HSA-eligible items
- ✏️ **Review & Edit**: Verify and correct AI-recognized information
- 📊 **Expense Tracking**: Filter, sort, and analyze your HSA expenses
- 💬 **Chat Assistant**: Real-time help and guidance

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Application runs at `http://localhost:3000`

## Documentation

- **[Get Started](doc/GET_STARTED.md)** - Installation and setup guide
- **[Project Overview](doc/PROJECT_OVERVIEW.md)** - Architecture and structure
- **[Mock Data Examples](doc/MOCK_DATA_EXAMPLES.md)** - API testing data
- **[Deployment](doc/DEPLOYMENT.md)** - Production deployment guide

## Tech Stack

- React 18 + TypeScript + Vite
- Ant Design
- Zustand (State Management)
- Axios (HTTP Client)
- React Router v6

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API layer
│   ├── store/          # State management
│   ├── types/          # TypeScript types
│   └── hooks/          # Custom hooks
├── public/             # Static assets
└── doc/                # Documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Environment Variables

Create `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

See LICENSE file for details.

# HSA AI Assistant - Frontend Overview

## Project Description

A React-based web application for managing HSA (Health Savings Account) expenses. Users upload receipts, AI analyzes HSA-eligible items, and the system stores expense records for future analysis.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Ant Design
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS + Ant Design

## Core Features

### 1. Upload Page (`/`)
- Receipt image upload (drag & drop or click)
- Real-time chat assistant
- File validation and preview

### 2. Review Page (`/review`)
- Edit receipt information (store, date, payment card)
- View receipt image alongside items
- Categorize items: Eligible / Non-eligible / Unsure
- Edit, move, or delete items
- Approve or discard receipt

### 3. Summary Page (`/summary`)
- Filterable and sortable expense table
- Search by item name or description
- Filter by store, date range, eligibility
- Display all saved items with full details

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ChatBox/        # Chat interface
│   │   ├── ReceiptUploader/ # Upload component
│   │   ├── ReceiptReview/  # Review components
│   │   ├── ItemsTable/     # Summary table
│   │   └── common/         # Shared components
│   │
│   ├── pages/              # Page components
│   │   ├── HomePage/
│   │   ├── ReviewPage/
│   │   └── SummaryPage/
│   │
│   ├── services/           # API layer
│   │   └── api.ts
│   │
│   ├── store/              # State management
│   │   ├── useAppStore.ts
│   │   ├── useChatStore.ts
│   │   └── useReceiptStore.ts
│   │
│   ├── types/              # TypeScript types
│   │   ├── item.ts
│   │   ├── receipt.ts
│   │   ├── message.ts
│   │   └── api.ts
│   │
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
│
├── public/                 # Static assets
├── doc/                    # Documentation
└── package.json            # Dependencies

```

## Key Components

### State Management (Zustand)

- **useAppStore**: Global app state (current step, session ID, user ID)
- **useChatStore**: Chat messages and history
- **useReceiptStore**: Receipt data and approved items

### API Service

All backend communication goes through `src/services/api.ts`:
- Request/response interceptors
- Error handling and retry logic
- FormData support for file uploads

### Type System

- **ItemBasic**: Simplified item for review page
- **ItemFull**: Complete item with all fields for summary page
- **ReceiptData**: Receipt information
- **ReceiptResponse**: API response from `/chat`
- **ApproveResponse**: API response from `/approve`

## Data Flow

```
1. Upload Receipt
   └─> POST /chat (with file)
       └─> ReceiptResponse
           └─> Navigate to /review

2. Review & Edit
   └─> Edit items, move between categories
       └─> Click "Approve"
           └─> POST /approve
               └─> ApproveResponse (ItemFull[])
                   └─> Navigate to /summary

3. View Summary
   └─> Display all items in table
       └─> Filter, sort, search
```

## Naming Conventions

- **Components**: PascalCase (`ChatBox.tsx`)
- **Files**: kebab-case (`use-chat.ts`)
- **Types**: PascalCase (`ReceiptData`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_SESSION_ID`)
- **Functions**: camelCase (`formatDate`)

## Path Aliases

Use `@/` prefix for imports:

```typescript
import { ChatBox } from '@/components';
import { useAppStore } from '@/store/useAppStore';
import type { ReceiptData } from '@/types';
```

## Development Workflow

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`
4. Run linter: `npm run lint`
5. Format code: `npm run format`

## Environment Variables

Create `.env` file from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Documentation

- `GET_STARTED.md` - Quick start guide
- `MOCK_DATA_EXAMPLES.md` - API mock data examples
- `DEPLOYMENT.md` - Deployment instructions


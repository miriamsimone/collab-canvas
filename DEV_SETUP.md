# 🛠️ Development Setup Guide

Complete guide for setting up CollabCanvas for local development.

---

## Prerequisites

### Required Software

1. **Node.js 18+** (LTS recommended)
   ```bash
   # Check version
   node --version  # Should be 18.x or higher
   
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   ```

2. **npm or yarn**
   ```bash
   npm --version  # Should be 9.x or higher
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Firebase CLI** (for deployment)
   ```bash
   npm install -g firebase-tools
   firebase --version
   ```

### Optional Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript + JavaScript Language Features
  - Tailwind CSS IntelliSense
  
- **Chrome/Firefox DevTools** for debugging

---

## Initial Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/miriamsimone/collab-canvas.git
cd collab-canvas

# Check current branch
git branch  # Should be on 'main'
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# This installs:
# - React 19 + TypeScript
# - Vite (build tool)
# - Konva.js (canvas rendering)
# - Firebase SDK
# - Vercel AI SDK
# - Testing libraries (Vitest, React Testing Library)
# - And ~50 other dependencies
```

**Common Issues**:
- If you see peer dependency warnings, they're usually safe to ignore
- If installation fails, try: `rm -rf node_modules package-lock.json && npm install`

### 3. Firebase Configuration

The project uses pre-configured Firebase credentials. **No additional setup required** for basic development!

**Firebase Project Details**:
- Project ID: `collab-canvas-2e4c5`
- Firestore Database: `(default)`
- RTDB URL: `https://collab-canvas-2e4c5-default-rtdb.firebaseio.com/`
- Region: `us-central1`

**Configuration Location**: `src/services/firebase.ts`

```typescript
// Already configured - no changes needed
const firebaseConfig = {
  apiKey: "AIzaSyDjGg4kTx1YSE8XG5TqvHWsVJy3j6xN6EU",
  authDomain: "collab-canvas-2e4c5.firebaseapp.com",
  projectId: "collab-canvas-2e4c5",
  // ...
};
```

---

## Running the Development Server

### Start Local Server

```bash
# Start Vite dev server
npm run dev

# Output:
# VITE v7.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### Start AI Development Server (for AI features)

The AI commands need a local server to proxy OpenAI requests:

```bash
# In a SEPARATE terminal window
node dev-server.js

# Output:
# 🤖 AI Development Server running on http://localhost:3001
# 📝 Handling AI commands locally
```

**Why two servers?**
- Vite server (5173): Serves React app
- AI dev server (3001): Proxies OpenAI API calls with your API key

### Access the App

Open your browser to:
- **Local App**: http://localhost:5173
- **Network Access**: http://[your-ip]:5173 (for mobile testing)

---

## Project Structure

```
collab-canvas/
├── src/                      # Source code
│   ├── components/           # React components
│   │   ├── Canvas.tsx       # Main canvas orchestrator
│   │   ├── shapes/          # Shape components
│   │   ├── features/        # Feature modules
│   │   └── Auth/            # Authentication
│   ├── hooks/               # Custom React hooks
│   │   ├── useShapes.ts
│   │   ├── useAI.ts
│   │   └── useComments.ts
│   ├── services/            # Firebase & API services
│   │   ├── firebase.ts      # Firebase initialization
│   │   ├── shapesService.ts
│   │   └── aiService.ts
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Helper functions
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── api/                     # Vercel serverless functions
│   └── ai/
│       └── command.ts       # AI endpoint
├── tests/                   # Test files
│   └── unit/
├── public/                  # Static assets
├── dev-server.js            # Local AI development server
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── firebase.json            # Firebase deployment
└── package.json             # Dependencies
```

---

## Development Workflow

### 1. Start Development

```bash
# Terminal 1: Start React dev server
npm run dev

# Terminal 2: Start AI dev server
node dev-server.js

# Terminal 3: Run tests in watch mode (optional)
npm test
```

### 2. Make Changes

Edit files in `src/`:
- **Components**: UI and canvas rendering
- **Hooks**: State management and business logic
- **Services**: Firebase and API integration
- **Types**: TypeScript definitions

Hot Module Replacement (HMR) will automatically reload changes.

### 3. Test Changes

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Run specific test file
npm test useShapes

# Run with coverage
npm run test:coverage
```

### 4. Check Types

```bash
# TypeScript type checking
npx tsc --noEmit

# Should output: "Found 0 errors"
```

### 5. Lint Code

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## Environment Variables

### Local Development (.env.local)

Create a `.env.local` file for local overrides (optional):

```env
# OpenAI API Key (for AI features)
VITE_OPENAI_API_KEY=sk-...

# Firebase overrides (optional)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=collab-canvas-2e4c5
```

### Production Environment (Vercel)

Set in Vercel dashboard:
- `OPENAI_API_KEY` - For production AI features

---

## Firebase Development

### View Data

**Firestore Console**:
https://console.firebase.google.com/project/collab-canvas-2e4c5/firestore

Collections:
- `canvas/shared/shapes` - All canvas shapes
- `canvasComments` - Comments and replies
- `users` - User profiles

**RTDB Console**:
https://console.firebase.google.com/project/collab-canvas-2e4c5/database

Real-time data:
- `presence/` - User cursors and presence
- `objectMovements/` - Temporary drag positions

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy RTDB rules
firebase deploy --only database

# Deploy both
firebase deploy --only firestore:rules,database
```

### Test Security Rules

```bash
# Firestore rules
firebase emulators:start --only firestore

# RTDB rules
firebase emulators:start --only database
```

---

## Debugging

### Browser DevTools

1. **React DevTools**
   - Install extension
   - Inspect component tree
   - Profile performance

2. **Network Tab**
   - Monitor Firestore writes
   - Check AI API calls
   - View WebSocket connections

3. **Console**
   - All service calls are logged
   - Errors show with stack traces

### Firebase Debugging

```typescript
// Enable Firebase debug logging
import { enableFirestoreDebug } from 'firebase/firestore';
enableFirestoreDebug();

// Log RTDB operations
import { enableLogging } from 'firebase/database';
enableLogging(true);
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

---

## Common Development Tasks

### Add a New Shape Type

1. **Define type** in `src/types/shapes.ts`:
```typescript
export interface TriangleShape extends BaseShape {
  type: 'triangle';
  points: [number, number, number, number, number, number];
}
```

2. **Create component** in `src/components/shapes/Triangle.tsx`

3. **Add to service** in `src/services/shapesService.ts`:
```typescript
export const createTriangleShape = (...) => { ... }
```

4. **Update hook** in `src/hooks/useShapes.ts`:
```typescript
const createTriangle = async (...) => { ... }
```

5. **Add to Canvas** in `src/components/Canvas.tsx`

### Add a New AI Command

1. **Define schema** in `api/ai/command.ts`:
```typescript
const triangleSchema = z.object({
  x: z.number(),
  y: z.number(),
  size: z.number(),
  color: z.string()
});
```

2. **Update AI prompt** with examples

3. **Add handler** in `src/hooks/useAI.ts`:
```typescript
onCreateTriangle?: (params) => Promise<void>;
```

4. **Wire up in Canvas** in `src/components/Canvas.tsx`

### Add a New Keyboard Shortcut

Update `src/hooks/useKeyboardShortcuts.ts`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Add your shortcut
    if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
      // Create triangle
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Testing Strategy

### Unit Tests

```bash
# Test a specific service
npm test shapesService

# Test a hook
npm test useShapes

# Test utils
npm test canvasHelpers
```

### Integration Tests

```bash
# Test multi-hook interactions
npm test Canvas

# Test command pattern
npm test commandService
```

### Manual Testing Checklist

- [ ] Create all shape types
- [ ] Multi-select and drag
- [ ] Undo/redo operations
- [ ] AI commands (all categories)
- [ ] Comments (create, reply, resolve)
- [ ] Keyboard shortcuts
- [ ] Multi-user real-time sync
- [ ] Pan and zoom
- [ ] Grid snapping

---

## Performance Profiling

### React DevTools Profiler

1. Open React DevTools
2. Go to "Profiler" tab
3. Click record
4. Perform actions
5. Stop and analyze render times

### Chrome Performance

1. Open Chrome DevTools
2. Go to "Performance" tab
3. Record session
4. Identify bottlenecks
5. Optimize slow components

### Bundle Analysis

```bash
# Build and analyze bundle
npm run build
npx vite-bundle-analyzer dist/stats.html
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill

# Or use different port
npm run dev -- --port 3000
```

### Firebase Connection Issues

```bash
# Check Firebase status
firebase status

# Re-login
firebase logout
firebase login
```

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall
npm install
```

### Build Errors

```bash
# Clean build
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

---

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/new-shape-type

# Make changes and commit
git add .
git commit -m "feat: Add triangle shape support"

# Push to GitHub
git push origin feature/new-shape-type

# Create Pull Request on GitHub
```

### Commit Message Format

```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance
```

---

## Next Steps

1. ✅ Complete this setup guide
2. 🏃 Run the development server
3. 🧪 Run tests to ensure everything works
4. 📖 Read ARCHITECTURE.md to understand the system
5. 🚀 Start building features!

---

## Resources

- **Firebase Console**: https://console.firebase.google.com/project/collab-canvas-2e4c5
- **Vercel Dashboard**: https://vercel.com/miriamsimone/collab-canvas
- **GitHub Repo**: https://github.com/miriamsimone/collab-canvas
- **Live Demo**: https://collab-canvas-miriam.vercel.app

---

**Questions?** Check the troubleshooting section or review ARCHITECTURE.md for system design details.


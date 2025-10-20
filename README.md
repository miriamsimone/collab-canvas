# 🎨 CollabCanvas

A real-time collaborative design canvas that enables multiple users to create, manipulate, and view design elements simultaneously. Built with React, Firebase, and Konva.js for bulletproof multiplayer collaboration with AI-powered natural language commands.

**🌐 Live Demo**: https://collab-canvas-miriam.vercel.app

## ✨ Features

### 🤝 **Real-time Collaboration**
- **Multiplayer Editing**: Multiple users can create and manipulate shapes simultaneously
- **Live Cursors**: See other users' cursors with their names in real-time (10-20ms latency)
- **Presence Awareness**: Know who's currently online with live user count and status
- **Collaborative Locking**: Prevent editing conflicts with automatic object locking
- **Conflict Resolution**: Optimistic updates with automatic rollback on errors

### 🎨 **Shape & Design Tools**
- **Multiple Shape Types**: Rectangles, circles, lines, and text with full customization
- **Multi-Select**: Select and manipulate multiple objects at once
- **Transform Controls**: Resize, rotate, and position shapes with visual handles
- **Connection Arrows**: Link shapes with arrows to show relationships
- **Z-Index Management**: Layer ordering with bring to front/send to back controls
- **Alignment Tools**: Align and distribute shapes with precision
- **Grid Snapping**: Snap to grid for pixel-perfect placement
- **Smart Guides**: Visual alignment guides when moving shapes

### 🤖 **AI Canvas Agent**
- **Natural Language Commands**: Create and manipulate shapes using plain English
- **8 Command Categories**: Shape creation, selection, bulk operations, resize, rotate, alignment, distribution, z-index
- **Complex Multi-Step Commands**: "Create a login form" or "build a navigation bar"
- **Smart Object Selection**: Select by color, position, or type
- **Sub-2s Response Times**: Fast AI processing with GPT-4o-mini
- **Fully Undoable**: All AI operations integrate with undo/redo system

### 🎙️ **Audio Rambles**
- **Voice Recordings**: Record up to 30 seconds of audio per shape
- **Ramble Sequences**: Mark shapes as ramble starts for sequential playback
- **Ramble Player**: Play through all connected audio recordings in order
- **Firebase Storage**: Secure audio storage with automatic cleanup

### 💬 **Comments & Collaboration**
- **Comment Pins**: Add comments anywhere on the canvas
- **Threaded Replies**: Reply to comments with full conversation threads
- **Resolve/Unresolve**: Track comment resolution status
- **Shape Attachments**: Attach comments to specific shapes
- **Live Updates**: Real-time comment synchronization

### ⌨️ **Keyboard Shortcuts**
- **30+ Shortcuts**: Comprehensive keyboard support for power users
- **Standard Operations**: Copy (Cmd/Ctrl+C), Paste (Cmd/Ctrl+V), Undo (Cmd/Ctrl+Z), etc.
- **Alignment Shortcuts**: Quick alignment with Cmd/Ctrl+Shift+L/C/R/T/M/B
- **Layer Controls**: Bring forward/backward with [ and ] keys
- **Nudge Movement**: Arrow keys for precise 1px movements (10px with Shift)
- **Help Panel**: Press ? to view all shortcuts

### 🖼️ **Canvas Experience**
- **Smooth Navigation**: Pan and zoom across a 5000x5000px workspace
- **Context Menus**: Right-click for quick actions on shapes
- **Visual Feedback**: Selected objects with transform handles and smart guides
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Smooth 60fps rendering with large numbers of objects

### 🔄 **Editing & History**
- **Undo/Redo**: Full command pattern with unlimited history
- **Copy/Paste/Duplicate**: Standard clipboard operations
- **Bulk Operations**: Move, delete, or change color of multiple objects
- **Transform Persistence**: All transformations survive page refresh

### 🔐 **Authentication & Security**
- **Secure Authentication**: Firebase Auth with email/password
- **State Persistence**: Canvas survives page refreshes and disconnects
- **User Profiles**: Custom display names and assigned colors
- **Security Rules**: Comprehensive Firestore and RTDB security rules
- **API Key Protection**: Server-side AI API key management

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Canvas**: Konva.js + React-Konva for 2D graphics rendering
- **Backend**: Firebase (Firestore + Realtime Database + Authentication + Storage)
- **Real-time**: Firebase RTDB for smooth cursors/dragging (10-20ms latency) + Firestore for persistence
- **AI Integration**: OpenAI GPT-4o-mini via Vercel serverless functions
- **Deployment**: Vercel (primary) with automatic preview deployments
- **Testing**: Vitest + React Testing Library + Unit/Integration tests
- **CI/CD**: GitHub Actions with automated testing and deployment

## 📋 Development Setup

### Prerequisites

- Node.js 18+ (using NVM recommended)
- Firebase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/miriamsimone/collab-canvas.git
   cd collab-canvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - The app uses hardcoded Firebase config in `src/services/firebase.ts`
   - For development, you can replace with your own Firebase project config

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   npm run test:run  # Run once
   ```

### Firebase Setup (For Custom Deployment)

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init
   ```

2. **Configure Firebase Services**
   - **Firestore**: Enable database with security rules from `firestore.rules`
   - **Authentication**: Enable Email/Password provider
   - **Hosting**: Configure with `public` folder as `dist`

3. **Update Configuration**
   - Replace Firebase config in `src/services/firebase.ts` with your project values
   - Deploy security rules: `firebase deploy --only firestore:rules`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Lint code

## 🏗️ Architecture

The application follows a clean architecture pattern with comprehensive feature modules:

- **Components**: React components for UI, canvas rendering, and feature modules
  - Shape components (Rectangle, Circle, Line, Text)
  - Feature modules (AI, Audio, Comments, Grid, Alignment, etc.)
  - Tools (SelectionBox, Context Menus, Shortcuts Panel)
- **Hooks**: Custom hooks for state management and Firebase integration
  - useShapes, useCanvas, useSelection, usePresence
  - useAI, useComments, useConnections, useLocks
  - useUndoRedo, useAlignment, useZIndex, useGrid
- **Services**: Firebase service layer and API abstraction
  - shapesService, audioService, aiService, commentsService
  - lockService, presenceService, connectionService
  - Command pattern for undo/redo
- **Utils**: Utility functions for canvas operations and helpers
  - Shape helpers, clipboard helpers, selection helpers, AI helpers

**📖 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation**

## 🚀 Deployment

### Vercel Deployment (Primary)
- **🌐 Live App**: https://collab-canvas-miriam.vercel.app
- **📖 Full Deployment Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**⚠️ Important**: Always update the Vercel alias after deployment! See the deployment guide for details.

### Firebase Deployment (Alternative)
```bash
# Build and deploy to Firebase
npm run deploy

# Deploy only hosting (faster)
npm run deploy:hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## 🐛 Troubleshooting

### Common Issues

**CORS Errors with Firebase**
- Ensure Firebase config is properly set in `src/services/firebase.ts`
- Check that Firestore security rules are deployed
- Verify project ID matches in all configurations

**Cursor/Presence Not Working**
- Check browser console for Firebase connection errors
- Ensure user is authenticated before accessing presence features
- Verify Firestore rules allow read/write access to `presence` collection

**Build Failures**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all required environment variables are set

**Performance Issues**
- Monitor bundle size with `npm run build`
- Check for memory leaks in presence/cursor subscriptions
- Limit concurrent users during testing

## 📝 Development Process

This project was built following a structured 24-hour MVP approach:

- **10 Pull Requests** covering all major features
- **Continuous deployment** after each milestone  
- **Test-driven development** with unit and integration tests
- **Real-time validation** with multi-user production testing

### Architecture Decisions
- **Firestore over WebSockets**: Easier scaling and offline support
- **Optimistic Updates**: Better UX with rollback on conflicts
- **Component-based Architecture**: Reusable and maintainable code
- **TypeScript**: Better DX and fewer runtime errors

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Add tests** for your changes
4. **Ensure** all tests pass (`npm run test:run`)
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Development Guidelines
- Write tests for new features
- Follow the existing code style
- Update documentation for API changes
- Test with multiple users before submitting

## 📊 Performance Metrics

- **Bundle Size**: Optimized with code splitting and lazy loading
- **First Paint**: <2s on 3G connection
- **Cursor Latency**: 10-20ms for real-time updates (RTDB)
- **AI Response Time**: <2s for most commands
- **Concurrent Users**: Tested with 10+ simultaneous users
- **Real-time Sync**: Sub-50ms for shape updates
- **Test Coverage**: >70% with comprehensive unit tests

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and quick start
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed technical architecture
- **[DEV_SETUP.md](./DEV_SETUP.md)** - Complete development setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[AI_SETUP.md](./AI_SETUP.md)** - AI Canvas Agent configuration
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature showcase
- **[STORAGE_SETUP.md](./STORAGE_SETUP.md)** - Firebase Storage CORS setup

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
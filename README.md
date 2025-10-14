# CollabCanvas MVP

A real-time collaborative design canvas that enables multiple users to create, manipulate, and view rectangles simultaneously. Built with React, Firebase, and Konva.js.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit rectangles simultaneously
- **Multiplayer Cursors**: See other users' cursors with name labels in real-time
- **Presence Awareness**: Know who's currently online and editing
- **Canvas Navigation**: Smooth pan and zoom across a large workspace
- **User Authentication**: Secure login/register with Firebase Auth
- **State Persistence**: Canvas state survives disconnects and page refreshes

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Canvas**: Konva.js + React-Konva for 2D graphics
- **Backend**: Firebase (Firestore + Authentication)
- **Real-time**: Firestore real-time listeners
- **Testing**: Vitest + React Testing Library
- **Deployment**: Firebase Hosting

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database and Authentication (Email/Password)
3. Add your Firebase config to `.env`
4. Deploy Firestore security rules from the console

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Lint code

## 🏗️ Architecture

The application follows a clean architecture pattern:

- **Components**: React components for UI and canvas rendering
- **Hooks**: Custom hooks for state management and Firebase integration
- **Services**: Firebase service layer and API abstraction
- **Utils**: Utility functions for canvas operations and color management

## 🚀 Deployment

The application is deployed using Firebase Hosting with continuous deployment from the main branch.

**Live Demo**: _Coming soon_

## 📝 Development Process

This project follows a structured 24-hour MVP development approach with:

- 11 focused Pull Requests
- Continuous deployment after major milestones
- Comprehensive testing strategy
- Real-time validation with production deployments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
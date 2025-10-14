import React from 'react';
import { AuthProvider } from './components/Auth/AuthProvider';
import { useAuth } from './hooks/useAuth';
import './App.css';

// Main canvas component (placeholder for now)
const CanvasApp: React.FC = () => {
  const { userProfile, signOut } = useAuth();

  return (
    <div className="canvas-app">
      <header className="app-header">
        <div className="header-content">
          <h1>CollabCanvas</h1>
          <div className="user-info">
            <span className="welcome-text">
              Welcome, {userProfile?.displayName}!
            </span>
            <button 
              onClick={signOut} 
              className="sign-out-button"
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="canvas-placeholder">
          <div className="placeholder-content">
            <h2>🎨 Canvas Coming Soon</h2>
            <p>Authentication is working! Canvas will be built in PR #3.</p>
            <div className="user-details">
              <p><strong>User ID:</strong> {userProfile?.uid}</p>
              <p><strong>Email:</strong> {userProfile?.email}</p>
              <p><strong>Display Name:</strong> {userProfile?.displayName}</p>
              <p><strong>Account Created:</strong> {userProfile?.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CanvasApp />
    </AuthProvider>
  );
}

export default App;
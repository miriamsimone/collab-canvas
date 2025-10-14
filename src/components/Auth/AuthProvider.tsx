import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Login } from './Login';
import { Register } from './Register';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'register' : 'login');
  };

  // Show loading spinner during initial auth check
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading CollabCanvas...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show auth forms
  if (!user || !userProfile) {
    return (
      <div className="auth-layout">
        {authMode === 'login' ? (
          <Login onToggleMode={toggleAuthMode} />
        ) : (
          <Register onToggleMode={toggleAuthMode} />
        )}
      </div>
    );
  }

  // User is authenticated, render the main app
  return <>{children}</>;
};

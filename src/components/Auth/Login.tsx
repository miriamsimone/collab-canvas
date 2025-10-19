import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginProps {
  onToggleMode: () => void;
}

export const Login: React.FC<LoginProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { signIn, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    // Validation
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!password) {
      setFormError('Password is required');
      return;
    }

    try {
      await signIn(email, password);
      // Navigation will be handled by AuthProvider
    } catch (err) {
      // Error is set by useAuth hook
    }
  };

  const displayError = formError || error;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          {/* Ram Icon - Large version */}
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 16px' }}>
            {/* Head circle */}
            <circle cx="12" cy="13" r="5" fill="currentColor" />
            
            {/* Left horn (curved) */}
            <path
              d="M 8 10 Q 4 7 3 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Right horn (curved) */}
            <path
              d="M 16 10 Q 20 7 21 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Ears */}
            <circle cx="9" cy="12" r="2" fill="currentColor" />
            <circle cx="15" cy="12" r="2" fill="currentColor" />
            
            {/* Eyes */}
            <circle cx="10" cy="13" r="0.8" fill="#fff" />
            <circle cx="14" cy="13" r="0.8" fill="#fff" />
          </svg>
          
          <h1>Welcome to Ramble</h1>
          <p>Sign in to start rambling!</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {displayError && (
            <div className="error-message" role="alert">
              {displayError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              className="link-button" 
              onClick={onToggleMode}
              disabled={loading}
            >
              Create one here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface AIErrorDisplayProps {
  error: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const AIErrorDisplay: React.FC<AIErrorDisplayProps> = ({
  error,
  onDismiss,
  showDismiss = true,
}) => {
  return (
    <div className="ai-error-display">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">{error}</div>
        {showDismiss && onDismiss && (
          <button 
            onClick={onDismiss}
            className="dismiss-button"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
      
    </div>
  );
};

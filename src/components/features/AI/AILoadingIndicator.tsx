import React from 'react';

interface AILoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({
  message = 'AI is thinking...',
  size = 'medium',
}) => {
  const sizeClasses = {
    small: 'size-small',
    medium: 'size-medium',
    large: 'size-large',
  };

  return (
    <div className={`ai-loading-indicator ${sizeClasses[size]}`}>
      <div className="spinner">
        <div className="dot dot-1"></div>
        <div className="dot dot-2"></div>
        <div className="dot dot-3"></div>
      </div>
      <span className="message">{message}</span>
      
    </div>
  );
};

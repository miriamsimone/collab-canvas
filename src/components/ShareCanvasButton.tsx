import React, { useState } from 'react';

interface ShareCanvasButtonProps {
  canvasId: string;
  className?: string;
}

export const ShareCanvasButton: React.FC<ShareCanvasButtonProps> = ({ canvasId, className }) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleShareCanvas = async () => {
    const canvasUrl = `${window.location.origin}/canvas/${canvasId}`;
    
    try {
      await navigator.clipboard.writeText(canvasUrl);
      setShowCopied(true);
      
      // Hide the "Copied!" message after 2 seconds
      setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy canvas link:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = canvasUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        alert(`Copy this link: ${canvasUrl}`);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      className={className || 'share-canvas-button'}
      onClick={handleShareCanvas}
      title="Copy canvas link to share with others"
      type="button"
    >
      <span className="button-icon">🔗</span>
      <span className="button-text">{showCopied ? 'Copied!' : 'Share Canvas'}</span>
    </button>
  );
};


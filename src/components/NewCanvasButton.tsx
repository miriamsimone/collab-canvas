import React from 'react';
import { canvasService } from '../services/canvasService';

interface NewCanvasButtonProps {
  className?: string;
}

export const NewCanvasButton: React.FC<NewCanvasButtonProps> = ({ className }) => {
  const handleNewCanvas = () => {
    // Generate a new canvas ID
    const newCanvasId = canvasService.generateCanvasId();
    
    // Navigate to the new canvas and reload
    window.location.href = `/canvas/${newCanvasId}`;
  };

  return (
    <button
      className={className || 'new-canvas-button'}
      onClick={handleNewCanvas}
      title="Create a new canvas"
      type="button"
    >
      <span className="button-icon">➕</span>
    </button>
  );
};


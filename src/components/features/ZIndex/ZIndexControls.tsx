import React from 'react';
import './ZIndexControls.css';

interface ZIndexControlsProps {
  hasSelection: boolean;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
}

/**
 * Z-Index controls for managing layer order of shapes
 * Allows users to bring shapes forward or send them backward
 */
export const ZIndexControls: React.FC<ZIndexControlsProps> = ({
  hasSelection,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
}) => {
  return (
    <div className="zindex-controls">
      <h4 className="zindex-title">Layer Order</h4>
      
      <div className="zindex-buttons">
        <button
          className="zindex-button"
          onClick={onBringToFront}
          disabled={!hasSelection}
          title="Bring to Front (Ctrl+Shift+])"
          type="button"
        >
          <span className="zindex-icon">⬆️⬆️</span>
          <span className="zindex-label">To Front</span>
        </button>

        <button
          className="zindex-button"
          onClick={onBringForward}
          disabled={!hasSelection}
          title="Bring Forward (Ctrl+])"
          type="button"
        >
          <span className="zindex-icon">⬆️</span>
          <span className="zindex-label">Forward</span>
        </button>

        <button
          className="zindex-button"
          onClick={onSendBackward}
          disabled={!hasSelection}
          title="Send Backward (Ctrl+[)"
          type="button"
        >
          <span className="zindex-icon">⬇️</span>
          <span className="zindex-label">Backward</span>
        </button>

        <button
          className="zindex-button"
          onClick={onSendToBack}
          disabled={!hasSelection}
          title="Send to Back (Ctrl+Shift+[)"
          type="button"
        >
          <span className="zindex-icon">⬇️⬇️</span>
          <span className="zindex-label">To Back</span>
        </button>
      </div>

      {!hasSelection && (
        <p className="zindex-hint">Select shapes to reorder layers</p>
      )}
    </div>
  );
};


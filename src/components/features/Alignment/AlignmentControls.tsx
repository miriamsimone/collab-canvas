import React from 'react';
import './AlignmentControls.css';

interface AlignmentControlsProps {
  hasSelection: boolean;
  hasMultipleSelection: boolean;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
  onDistributeHorizontally: () => void;
  onDistributeVertically: () => void;
}

/**
 * Alignment controls for aligning and distributing shapes
 * Requires at least 2 shapes selected for alignment, 3 for distribution
 */
export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  hasSelection,
  hasMultipleSelection,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onDistributeHorizontally,
  onDistributeVertically,
}) => {
  return (
    <div className="alignment-controls">
      {/* Horizontal Alignment */}
      <div className="alignment-section">
        <h4 className="alignment-section-title">Horizontal</h4>
        <div className="alignment-buttons">
          <button
            className="alignment-button"
            onClick={onAlignLeft}
            disabled={!hasMultipleSelection}
            title="Align Left"
            type="button"
          >
            <span className="alignment-icon">⫷</span>
            <span className="alignment-label">Left</span>
          </button>

          <button
            className="alignment-button"
            onClick={onAlignCenter}
            disabled={!hasMultipleSelection}
            title="Align Center"
            type="button"
          >
            <span className="alignment-icon">⬌</span>
            <span className="alignment-label">Center</span>
          </button>

          <button
            className="alignment-button"
            onClick={onAlignRight}
            disabled={!hasMultipleSelection}
            title="Align Right"
            type="button"
          >
            <span className="alignment-icon">⫸</span>
            <span className="alignment-label">Right</span>
          </button>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div className="alignment-section">
        <h4 className="alignment-section-title">Vertical</h4>
        <div className="alignment-buttons">
          <button
            className="alignment-button"
            onClick={onAlignTop}
            disabled={!hasMultipleSelection}
            title="Align Top"
            type="button"
          >
            <span className="alignment-icon">⫴</span>
            <span className="alignment-label">Top</span>
          </button>

          <button
            className="alignment-button"
            onClick={onAlignMiddle}
            disabled={!hasMultipleSelection}
            title="Align Middle"
            type="button"
          >
            <span className="alignment-icon">⬍</span>
            <span className="alignment-label">Middle</span>
          </button>

          <button
            className="alignment-button"
            onClick={onAlignBottom}
            disabled={!hasMultipleSelection}
            title="Align Bottom"
            type="button"
          >
            <span className="alignment-icon">⫵</span>
            <span className="alignment-label">Bottom</span>
          </button>
        </div>
      </div>

      {/* Distribution */}
      <div className="alignment-section">
        <h4 className="alignment-section-title">Distribute</h4>
        <div className="alignment-buttons">
          <button
            className="alignment-button"
            onClick={onDistributeHorizontally}
            disabled={!hasMultipleSelection}
            title="Distribute Horizontally (3+ shapes)"
            type="button"
          >
            <span className="alignment-icon">⬌⬌</span>
            <span className="alignment-label">Horiz.</span>
          </button>

          <button
            className="alignment-button"
            onClick={onDistributeVertically}
            disabled={!hasMultipleSelection}
            title="Distribute Vertically (3+ shapes)"
            type="button"
          >
            <span className="alignment-icon">⬍⬍</span>
            <span className="alignment-label">Vert.</span>
          </button>
        </div>
      </div>

      {!hasSelection && (
        <p className="alignment-hint">Select 2+ shapes to align</p>
      )}
      {hasSelection && !hasMultipleSelection && (
        <p className="alignment-hint">Select 2+ shapes to use alignment</p>
      )}
    </div>
  );
};


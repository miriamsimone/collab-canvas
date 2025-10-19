import React from 'react';

export type ToolType = 'select' | 'pan' | 'rectangle' | 'circle' | 'line' | 'text' | 'comment' | 'audioConnector';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  snapToGridEnabled?: boolean;
  onToggleSnapToGrid?: () => void;
  unresolvedCommentsCount?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  onToolChange,
  snapToGridEnabled = false,
  onToggleSnapToGrid,
  unresolvedCommentsCount = 0,
}) => {
  const tools = [
    {
      id: 'select' as const,
      name: 'Select',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2 l10 4 l-3 3 l2 5 l-2 1 l-2-5 l-5-8z"/>
        </svg>
      ),
      description: 'Select shapes and drag to multi-select',
    },
    {
      id: 'pan' as const,
      name: 'Pan',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1 C7.5 1 7 1.5 7 2 L7 6 L6 6 C5.5 6 5 6.5 5 7 L5 8 L4 8 C3.5 8 3 8.5 3 9 L3 11 C3 12.5 4 14 6 14 L10 14 C11.5 14 13 12.5 13 11 L13 7 C13 6.5 12.5 6 12 6 L11 6 L11 7 L12 7 L12 11 C12 12 11 13 10 13 L6 13 C5 13 4 12 4 11 L4 9 L5 9 L5 11 L6 11 L6 7 L7 7 L7 10 L8 10 L8 2 L9 2 L9 10 L10 10 L10 7 C10 6.5 9.5 6 9 6 L8 6 L8 2 C8 1.5 8.5 1 8 1 Z" />
        </svg>
      ),
      description: 'Pan and navigate around the canvas',
    },
    {
      id: 'rectangle' as const,
      name: 'Rectangle',
      icon: '⬜',
      description: 'Click to create rectangles',
    },
    {
      id: 'circle' as const,
      name: 'Circle',
      icon: '⭕',
      description: 'Click to create circles',
    },
    {
      id: 'line' as const,
      name: 'Line',
      icon: '📏',
      description: 'Click and drag to create lines',
    },
    {
      id: 'text' as const,
      name: 'Text',
      icon: '📝',
      description: 'Click to add text',
    },
    {
      id: 'audioConnector' as const,
      name: 'Audio Connector',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 8 L6 8 M10 8 L14 8 M8 2 L8 14 M6 8 L8 4 L10 8 M6 8 L8 12 L10 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      description: 'Connect two shapes with an arrow',
    },
    {
      id: 'comment' as const,
      name: 'Comment',
      icon: '💬',
      description: 'Click to add comments',
      badge: unresolvedCommentsCount > 0 ? unresolvedCommentsCount : undefined,
    },
  ];

  const getToolInstructions = (tool: ToolType): string => {
    switch (tool) {
      case 'select':
        return 'Click shapes to select, drag empty area for multi-select box';
      case 'pan':
        return 'Click and drag to pan around the canvas';
      case 'rectangle':
        return 'Click on canvas to create rectangles';
      case 'circle':
        return 'Click on canvas to create circles';
      case 'line':
        return 'Click and drag to create lines between two points';
      case 'text':
        return 'Click on canvas to add text, double-click to edit';
      case 'comment':
        return 'Click on canvas to add comments, click comment pins to view threads';
      case 'audioConnector':
        return 'Click first shape, then click second shape to create a connection';
      default:
        return 'Select a tool to get started';
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <div className="toolbar-tools">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`toolbar-button ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => onToolChange(tool.id)}
              title={tool.description}
              type="button"
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-name">{tool.name}</span>
            </button>
          ))}
        </div>
        
        <div className="toolbar-info">
          <p className="current-tool">
            Current: <strong>{tools.find(t => t.id === activeTool)?.name || 'Unknown'}</strong>
          </p>
          <p className="tool-instructions">
            {getToolInstructions(activeTool)}
          </p>
        </div>

        {onToggleSnapToGrid && (
          <div className="toolbar-section">
            <h4 className="toolbar-section-title">Grid & Snap</h4>
            <button
              className={`toolbar-toggle-button ${snapToGridEnabled ? 'active' : ''}`}
              onClick={onToggleSnapToGrid}
              title={snapToGridEnabled ? 'Disable snap to grid' : 'Enable snap to grid'}
              type="button"
            >
              <span className="toggle-icon">
                {snapToGridEnabled ? '🟩' : '⬜'}
              </span>
              <span className="toggle-label">
                Snap to Grid
              </span>
              <span className="toggle-status">
                {snapToGridEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';

export type ToolType = 'select' | 'pan' | 'rectangle' | 'circle' | 'line' | 'text';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolChange }) => {
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
          <path d="M8 2 C7 2 7 3 7 3 L7 6 C6 6 5 6 5 7 L5 9 C4 9 3 9 3 10 L3 12 C3 13 4 14 5 14 L11 14 C12 14 13 13 13 12 L13 10 C13 9 12 9 11 9 L11 7 C11 6 10 6 9 6 L9 3 C9 3 9 2 8 2 Z M8 3 L8 7 L10 7 L10 10 L12 10 L12 12 C12 12.5 11.5 13 11 13 L5 13 C4.5 13 4 12.5 4 12 L4 10 L6 10 L6 7 L8 7 L8 3 Z"/>
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
      default:
        return 'Select a tool to get started';
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <h3 className="toolbar-title">Tools</h3>
        
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
      </div>
    </div>
  );
};

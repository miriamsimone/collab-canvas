import React from 'react';

export type ToolType = 'select' | 'rectangle';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolChange }) => {
  const tools = [
    {
      id: 'select' as const,
      name: 'Select',
      icon: '🔍',
      description: 'Select and move rectangles',
    },
    {
      id: 'rectangle' as const,
      name: 'Rectangle',
      icon: '⬜',
      description: 'Click to create rectangles',
    },
  ];

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
            Current: <strong>{activeTool === 'select' ? 'Select' : 'Rectangle'}</strong>
          </p>
          <p className="tool-instructions">
            {activeTool === 'select' 
              ? 'Click rectangles to select, drag to move' 
              : 'Click on canvas to create rectangles'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

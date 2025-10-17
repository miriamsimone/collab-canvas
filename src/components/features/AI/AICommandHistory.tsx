import React from 'react';
import { type AICommand } from '../../../types/ai';

interface AICommandHistoryProps {
  commands: AICommand[];
  maxVisible?: number;
  onClearHistory?: () => void;
}

export const AICommandHistory: React.FC<AICommandHistoryProps> = ({
  commands,
  maxVisible = 5,
  onClearHistory,
}) => {
  if (commands.length === 0) {
    return null;
  }

  const visibleCommands = commands.slice(0, maxVisible);

  const getStatusIcon = (status: AICommand['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      case 'processing':
        return '⏳';
      case 'pending':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: AICommand['status']) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'processing':
        return '#f59e0b';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="ai-command-history">
      <div className="history-header">
        <h4 className="history-title">Recent Commands</h4>
        {onClearHistory && commands.length > 0 && (
          <button 
            onClick={onClearHistory}
            className="clear-button"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="commands-list">
        {visibleCommands.map((command) => (
          <div key={command.id} className="command-item">
            <div className="command-status">
              <span 
                className="status-icon"
                style={{ color: getStatusColor(command.status) }}
              >
                {getStatusIcon(command.status)}
              </span>
            </div>
            <div className="command-content">
              <div className="command-prompt">{command.prompt}</div>
              <div className="command-meta">
                {new Date(command.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {commands.length > maxVisible && (
        <div className="more-indicator">
          +{commands.length - maxVisible} more commands
        </div>
      )}
      
    </div>
  );
};

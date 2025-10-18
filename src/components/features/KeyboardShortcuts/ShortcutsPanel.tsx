import React from 'react';
import { KEYBOARD_SHORTCUTS, getShortcutString } from '../../../hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from '../../../hooks/useKeyboardShortcuts';
import './ShortcutsPanel.css';

interface ShortcutsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;
  
  // Group shortcuts by category
  const categories = {
    'Undo/Redo': ['undo', 'redo'],
    'Selection': ['selectAll', 'escape'],
    'Clipboard': ['copy', 'paste', 'cut', 'duplicate'],
    'Edit': ['delete', 'nudge'],
    'Help': ['help'],
  };
  
  const groupedShortcuts: Record<string, KeyboardShortcut[]> = {};
  
  Object.entries(categories).forEach(([category, actions]) => {
    groupedShortcuts[category] = KEYBOARD_SHORTCUTS.filter(shortcut => 
      actions.includes(shortcut.action)
    );
  });
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div className="shortcuts-panel-backdrop" onClick={handleBackdropClick}>
      <div className="shortcuts-panel">
        <div className="shortcuts-panel-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="shortcuts-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        
        <div className="shortcuts-panel-content">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="shortcuts-category">
              <h3 className="shortcuts-category-title">{category}</h3>
              <div className="shortcuts-list">
                {shortcuts.map((shortcut, index) => (
                  <div key={`${shortcut.action}-${index}`} className="shortcut-item">
                    <span className="shortcut-description">{shortcut.description}</span>
                    <kbd className="shortcut-keys">{getShortcutString(shortcut)}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="shortcuts-panel-footer">
          <p className="shortcuts-panel-tip">
            <strong>Tip:</strong> Press <kbd>?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
};


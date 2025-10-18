import { useEffect, useCallback, useState } from 'react';
import type { Shape } from '../types/shapes';

export interface KeyboardShortcutsConfig {
  // Selection
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  
  // Clipboard
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onDuplicate?: () => void;
  
  // Delete
  onDelete?: () => void;
  
  // Nudge (move with arrow keys)
  onNudge?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
  
  // Layer (Z-Index)
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
  
  // Alignment
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignMiddle?: () => void;
  onAlignBottom?: () => void;
  onDistributeHorizontally?: () => void;
  onDistributeVertically?: () => void;
  
  // Help
  onToggleHelp?: () => void;
  
  // Escape
  onEscape?: () => void;
  
  // Enabled/disabled
  enabled?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean; // Cmd on Mac
  };
  description: string;
  action: string;
}

/**
 * List of all available keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'z',
    modifiers: { meta: true, ctrl: true },
    description: 'Undo',
    action: 'undo',
  },
  {
    key: 'z',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Redo',
    action: 'redo',
  },
  {
    key: 'y',
    modifiers: { meta: true, ctrl: true },
    description: 'Redo',
    action: 'redo',
  },
  {
    key: 'a',
    modifiers: { meta: true, ctrl: true },
    description: 'Select all',
    action: 'selectAll',
  },
  {
    key: 'c',
    modifiers: { meta: true, ctrl: true },
    description: 'Copy',
    action: 'copy',
  },
  {
    key: 'v',
    modifiers: { meta: true, ctrl: true },
    description: 'Paste',
    action: 'paste',
  },
  {
    key: 'x',
    modifiers: { meta: true, ctrl: true },
    description: 'Cut',
    action: 'cut',
  },
  {
    key: 'd',
    modifiers: { meta: true, ctrl: true },
    description: 'Duplicate',
    action: 'duplicate',
  },
  {
    key: 'Delete',
    modifiers: {},
    description: 'Delete selected',
    action: 'delete',
  },
  {
    key: 'Backspace',
    modifiers: {},
    description: 'Delete selected',
    action: 'delete',
  },
  {
    key: 'ArrowUp',
    modifiers: {},
    description: 'Nudge up (1px)',
    action: 'nudge',
  },
  {
    key: 'ArrowDown',
    modifiers: {},
    description: 'Nudge down (1px)',
    action: 'nudge',
  },
  {
    key: 'ArrowLeft',
    modifiers: {},
    description: 'Nudge left (1px)',
    action: 'nudge',
  },
  {
    key: 'ArrowRight',
    modifiers: {},
    description: 'Nudge right (1px)',
    action: 'nudge',
  },
  {
    key: 'ArrowUp',
    modifiers: { shift: true },
    description: 'Nudge up (10px)',
    action: 'nudge',
  },
  {
    key: 'ArrowDown',
    modifiers: { shift: true },
    description: 'Nudge down (10px)',
    action: 'nudge',
  },
  {
    key: 'ArrowLeft',
    modifiers: { shift: true },
    description: 'Nudge left (10px)',
    action: 'nudge',
  },
  {
    key: 'ArrowRight',
    modifiers: { shift: true },
    description: 'Nudge right (10px)',
    action: 'nudge',
  },
  // Layer (Z-Index) shortcuts
  {
    key: ']',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Bring to front',
    action: 'bringToFront',
  },
  {
    key: ']',
    modifiers: { meta: true, ctrl: true },
    description: 'Bring forward',
    action: 'bringForward',
  },
  {
    key: '[',
    modifiers: { meta: true, ctrl: true },
    description: 'Send backward',
    action: 'sendBackward',
  },
  {
    key: '[',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Send to back',
    action: 'sendToBack',
  },
  // Alignment shortcuts
  {
    key: 'l',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Align left',
    action: 'alignLeft',
  },
  {
    key: 'e',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Align center',
    action: 'alignCenter',
  },
  {
    key: 'r',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Align right',
    action: 'alignRight',
  },
  {
    key: 't',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Align top',
    action: 'alignTop',
  },
  {
    key: 'm',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Align middle',
    action: 'alignMiddle',
  },
  {
    key: 'b',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Align bottom',
    action: 'alignBottom',
  },
  {
    key: 'h',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Distribute horizontally',
    action: 'distributeH',
  },
  {
    key: 'v',
    modifiers: { meta: true, ctrl: true, shift: true },
    description: 'Distribute vertically',
    action: 'distributeV',
  },
  {
    key: '?',
    modifiers: {},
    description: 'Show keyboard shortcuts',
    action: 'help',
  },
  {
    key: 'Escape',
    modifiers: {},
    description: 'Clear selection / Cancel',
    action: 'escape',
  },
];

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig = {}) => {
  const { enabled = true } = config;
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  
  /**
   * Toggle help panel
   */
  const toggleHelp = useCallback(() => {
    setIsHelpVisible(prev => !prev);
    if (config.onToggleHelp) {
      config.onToggleHelp();
    }
  }, [config]);
  
  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Check if user is typing in an input field
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;
    
    // Detect platform
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    // Help panel (? key)
    if (e.key === '?' && !isTyping) {
      e.preventDefault();
      toggleHelp();
      return;
    }
    
    // Escape key
    if (e.key === 'Escape') {
      if (isHelpVisible) {
        setIsHelpVisible(false);
      } else if (config.onEscape) {
        config.onEscape();
      }
      if (config.onClearSelection) {
        config.onClearSelection();
      }
      return;
    }
    
    // Don't handle other shortcuts when typing
    if (isTyping && !modifier) return;
    
    // Select All (Cmd/Ctrl + A)
    if (modifier && e.key === 'a' && config.onSelectAll) {
      e.preventDefault();
      config.onSelectAll();
      return;
    }
    
    // Copy (Cmd/Ctrl + C)
    if (modifier && e.key === 'c' && config.onCopy) {
      e.preventDefault();
      config.onCopy();
      return;
    }
    
    // Paste (Cmd/Ctrl + V)
    if (modifier && e.key === 'v' && config.onPaste) {
      e.preventDefault();
      config.onPaste();
      return;
    }
    
    // Cut (Cmd/Ctrl + X)
    if (modifier && e.key === 'x' && config.onCut) {
      e.preventDefault();
      config.onCut();
      return;
    }
    
    // Duplicate (Cmd/Ctrl + D)
    if (modifier && e.key === 'd' && config.onDuplicate) {
      e.preventDefault();
      config.onDuplicate();
      return;
    }
    
    // Delete (Delete or Backspace)
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && config.onDelete) {
      e.preventDefault();
      config.onDelete();
      return;
    }
    
    // Arrow key nudging (only when not typing)
    if (!isTyping && config.onNudge) {
      const distance = e.shiftKey ? 10 : 1; // 10px with Shift, 1px without
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        config.onNudge('up', distance);
        return;
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        config.onNudge('down', distance);
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        config.onNudge('left', distance);
        return;
      }
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        config.onNudge('right', distance);
        return;
      }
    }
    
    // Layer (Z-Index) operations
    // Bring to Front (Cmd/Ctrl + Shift + ])
    if (modifier && e.shiftKey && e.key === ']' && config.onBringToFront) {
      e.preventDefault();
      config.onBringToFront();
      return;
    }
    
    // Bring Forward (Cmd/Ctrl + ])
    if (modifier && !e.shiftKey && e.key === ']' && config.onBringForward) {
      e.preventDefault();
      config.onBringForward();
      return;
    }
    
    // Send Backward (Cmd/Ctrl + [)
    if (modifier && !e.shiftKey && e.key === '[' && config.onSendBackward) {
      e.preventDefault();
      config.onSendBackward();
      return;
    }
    
    // Send to Back (Cmd/Ctrl + Shift + [)
    if (modifier && e.shiftKey && e.key === '[' && config.onSendToBack) {
      e.preventDefault();
      config.onSendToBack();
      return;
    }
    
    // Alignment operations (all require Cmd/Ctrl + Shift)
    if (modifier && e.shiftKey) {
      // Align Left (Cmd/Ctrl + Shift + L)
      if (e.key === 'l' && config.onAlignLeft) {
        e.preventDefault();
        config.onAlignLeft();
        return;
      }
      
      // Align Center (Cmd/Ctrl + Shift + E)
      if (e.key === 'e' && config.onAlignCenter) {
        e.preventDefault();
        config.onAlignCenter();
        return;
      }
      
      // Align Right (Cmd/Ctrl + Shift + R)
      if (e.key === 'r' && config.onAlignRight) {
        e.preventDefault();
        config.onAlignRight();
        return;
      }
      
      // Align Top (Cmd/Ctrl + Shift + T)
      if (e.key === 't' && config.onAlignTop) {
        e.preventDefault();
        config.onAlignTop();
        return;
      }
      
      // Align Middle (Cmd/Ctrl + Shift + M)
      if (e.key === 'm' && config.onAlignMiddle) {
        e.preventDefault();
        config.onAlignMiddle();
        return;
      }
      
      // Align Bottom (Cmd/Ctrl + Shift + B)
      if (e.key === 'b' && config.onAlignBottom) {
        e.preventDefault();
        config.onAlignBottom();
        return;
      }
      
      // Distribute Horizontally (Cmd/Ctrl + Shift + H)
      if (e.key === 'h' && config.onDistributeHorizontally) {
        e.preventDefault();
        config.onDistributeHorizontally();
        return;
      }
      
      // Distribute Vertically (Cmd/Ctrl + Shift + V)
      if (e.key === 'v' && config.onDistributeVertically) {
        e.preventDefault();
        config.onDistributeVertically();
        return;
      }
    }
  }, [enabled, config, isHelpVisible, toggleHelp]);
  
  /**
   * Set up event listener
   */
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
  
  return {
    isHelpVisible,
    setIsHelpVisible,
    toggleHelp,
    shortcuts: KEYBOARD_SHORTCUTS,
  };
};

/**
 * Get the keyboard shortcut string for display
 * @param shortcut The keyboard shortcut
 * @returns Formatted string like "Cmd+Z" or "Ctrl+Z"
 */
export const getShortcutString = (shortcut: KeyboardShortcut): string => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];
  
  if (shortcut.modifiers.ctrl || shortcut.modifiers.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  
  if (shortcut.modifiers.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  
  if (shortcut.modifiers.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  
  // Format key
  let keyDisplay = shortcut.key;
  if (keyDisplay === 'ArrowUp') keyDisplay = '↑';
  else if (keyDisplay === 'ArrowDown') keyDisplay = '↓';
  else if (keyDisplay === 'ArrowLeft') keyDisplay = '←';
  else if (keyDisplay === 'ArrowRight') keyDisplay = '→';
  else if (keyDisplay.length === 1) keyDisplay = keyDisplay.toUpperCase();
  
  parts.push(keyDisplay);
  
  return parts.join('+');
};


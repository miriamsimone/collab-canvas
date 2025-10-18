import { useState, useEffect, useCallback } from 'react';
import { commandService } from '../services/commandService';
import type { Command, CommandHistoryEntry } from '../types/commands';
import { useAuth } from './useAuth';

interface UseUndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStack: readonly CommandHistoryEntry[];
  redoStack: readonly CommandHistoryEntry[];
}

interface UseUndoRedoActions {
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  executeCommand: (command: Command) => Promise<void>;
  clearHistory: () => void;
}

export const useUndoRedo = (): UseUndoRedoState & UseUndoRedoActions => {
  const { user } = useAuth();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoStack, setUndoStack] = useState<readonly CommandHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<readonly CommandHistoryEntry[]>([]);
  
  /**
   * Update state from command service
   */
  const updateState = useCallback(() => {
    setCanUndo(commandService.canUndo());
    setCanRedo(commandService.canRedo());
    setUndoStack(commandService.getUndoStack());
    setRedoStack(commandService.getRedoStack());
  }, []);
  
  /**
   * Undo the last command
   */
  const undo = useCallback(async () => {
    if (!commandService.canUndo()) {
      console.warn('Nothing to undo');
      return;
    }
    
    try {
      await commandService.undo();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  }, []);
  
  /**
   * Redo the last undone command
   */
  const redo = useCallback(async () => {
    if (!commandService.canRedo()) {
      console.warn('Nothing to redo');
      return;
    }
    
    try {
      await commandService.redo();
    } catch (error) {
      console.error('Redo failed:', error);
    }
  }, []);
  
  /**
   * Execute a new command
   */
  const executeCommand = useCallback(async (command: Command) => {
    if (!user) {
      console.warn('User must be authenticated to execute commands');
      return;
    }
    
    try {
      await commandService.executeCommand(command, user.uid);
    } catch (error) {
      console.error('Command execution failed:', error);
      throw error;
    }
  }, [user]);
  
  /**
   * Clear command history
   */
  const clearHistory = useCallback(() => {
    commandService.clear();
  }, []);
  
  /**
   * Set up keyboard shortcuts for undo/redo
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + Z = Undo
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Cmd/Ctrl + Shift + Z = Redo
      if (modifier && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      
      // Cmd/Ctrl + Y = Redo (alternative shortcut)
      if (modifier && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);
  
  /**
   * Subscribe to command service changes
   */
  useEffect(() => {
    updateState();
    const unsubscribe = commandService.subscribe(updateState);
    return unsubscribe;
  }, [updateState]);
  
  return {
    // State
    canUndo,
    canRedo,
    undoStack,
    redoStack,
    
    // Actions
    undo,
    redo,
    executeCommand,
    clearHistory,
  };
};


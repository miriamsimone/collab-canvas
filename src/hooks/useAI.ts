import { useState, useCallback } from 'react';
import { aiService } from '../services/aiService';
import { getCanvasState, generateCommandId } from '../utils/aiHelpers';
import { 
  type AICommand,
  type UseAIState,
  type UseAIActions
} from '../types/ai';
import { type CanvasObjectData } from '../components/CanvasObject';
import { useAuth } from './useAuth';

interface UseAIProps {
  rectangles: CanvasObjectData[];
  canvasSize: { width: number; height: number };
  onCreateRectangle: (x: number, y: number, width: number, height: number, color: string) => Promise<void>;
  // Selection functions
  onSelectAll: (objects: CanvasObjectData[]) => void;
  onSelectByColor: (objects: CanvasObjectData[], color: string) => void;
  onSelectByPosition: (objects: CanvasObjectData[], position: 'top-half' | 'bottom-half' | 'left-half' | 'right-half', canvasSize: { width: number; height: number }) => void;
  onSelectByIds: (ids: string[]) => void;
  onClearSelection: () => void;
  getSelectedObjects: (allObjects: CanvasObjectData[]) => CanvasObjectData[];
  // Bulk operation functions
  onBulkMove: (deltaX: number, deltaY: number) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkChangeColor: (newColor: string) => Promise<void>;
}

export const useAI = ({ 
  rectangles, 
  canvasSize,
  onCreateRectangle, 
  onSelectAll,
  onSelectByColor,
  onSelectByPosition,
  onSelectByIds,
  onClearSelection,
  getSelectedObjects,
  onBulkMove,
  onBulkDelete,
  onBulkChangeColor,
}: UseAIProps): UseAIState & UseAIActions => {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<AICommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<AICommand[]>([]);

  /**
   * Execute an AI command
   */
  const executeCommand = useCallback(async (prompt: string): Promise<void> => {
    if (!user) {
      setError('You must be logged in to use AI commands');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a command');
      return;
    }

    // Create command object
    const command: AICommand = {
      id: generateCommandId(),
      prompt: prompt.trim(),
      timestamp: Date.now(),
      userId: user.uid,
      status: 'processing',
    };

    setIsLoading(true);
    setError(null);
    setLastCommand(command);

    // Add to history with processing status
    setCommandHistory(prev => [command, ...prev]);

    try {
      // Get current canvas state for AI context
      const canvasState = getCanvasState(rectangles, canvasSize);
      
      // Process command with AI service
      const response = await aiService.processCommand(prompt, canvasState);
      
      if (!response.success) {
        // Update command status to error
        const errorCommand: AICommand = {
          ...command,
          status: 'error',
        };
        
        setLastCommand(errorCommand);
        setCommandHistory(prev => 
          prev.map(cmd => cmd.id === command.id ? errorCommand : cmd)
        );
        setError(response.error || response.message || 'Command failed');
        return;
      }

      // Execute the actions
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          if (action.type === 'createRectangle') {
            const params = action.parameters as any;
            const { x, y, width, height, color } = params;
            await onCreateRectangle(x, y, width, height, color);
          } else if (action.type === 'selectObjects') {
            const params = action.parameters as any;
            
            switch (params.method) {
              case 'all':
                onSelectAll(rectangles);
                break;
              case 'byColor':
                if (params.criteria?.color) {
                  onSelectByColor(rectangles, params.criteria.color);
                }
                break;
              case 'byPosition':
                if (params.criteria?.position) {
                  onSelectByPosition(rectangles, params.criteria.position, canvasSize);
                }
                break;
              case 'byIds':
                if (params.criteria?.objectIds) {
                  onSelectByIds(params.criteria.objectIds);
                }
                break;
            }
          } else if (action.type === 'bulkOperation') {
            const params = action.parameters as any;
            
            switch (params.operation) {
              case 'move':
                if (params.operationData?.deltaX !== undefined && params.operationData?.deltaY !== undefined) {
                  await onBulkMove(params.operationData.deltaX, params.operationData.deltaY);
                }
                break;
              case 'delete':
                await onBulkDelete();
                break;
              case 'changeColor':
                if (params.operationData?.newColor) {
                  await onBulkChangeColor(params.operationData.newColor);
                }
                break;
            }
          }
        }
      }

      // Update command status to completed
      const completedCommand: AICommand = {
        ...command,
        status: 'completed',
      };
      
      setLastCommand(completedCommand);
      setCommandHistory(prev => 
        prev.map(cmd => cmd.id === command.id ? completedCommand : cmd)
      );

    } catch (err: any) {
      console.error('Command execution failed:', err);
      
      // Update command status to error
      const errorCommand: AICommand = {
        ...command,
        status: 'error',
      };
      
      setLastCommand(errorCommand);
      setCommandHistory(prev => 
        prev.map(cmd => cmd.id === command.id ? errorCommand : cmd)
      );
      setError(`Failed to execute command: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, rectangles, onCreateRectangle]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear command history
   */
  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    setLastCommand(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    lastCommand,
    commandHistory,
    
    // Actions
    executeCommand,
    clearError,
    clearHistory,
  };
};

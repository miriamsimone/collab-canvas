import { useState, useCallback } from 'react';
import { aiService } from '../services/aiService';
import { getCanvasState, generateCommandId } from '../utils/aiHelpers';
import { 
  type AICommand,
  type UseAIState,
  type UseAIActions
} from '../types/ai';
import type { Shape } from '../types/shapes';
import { useAuth } from './useAuth';

interface UseAIProps {
  rectangles: Shape[]; // Keep rectangles name for backward compatibility
  canvasSize: { width: number; height: number };
  onCreateRectangle: (x: number, y: number, width: number, height: number, color: string) => Promise<void>;
  onCreateCircle?: (x: number, y: number, radius: number, color: string) => Promise<void>;
  onCreateLine?: (x1: number, y1: number, x2: number, y2: number, color: string) => Promise<void>;
  onCreateText?: (x: number, y: number, text: string, fontSize?: number) => Promise<void>;
  // Selection functions
  onSelectAll: (objects: Shape[]) => void;
  onSelectByColor: (objects: Shape[], color: string) => void;
  onSelectByPosition: (objects: Shape[], position: 'top-half' | 'bottom-half' | 'left-half' | 'right-half', canvasSize: { width: number; height: number }) => void;
  onSelectByIds: (ids: string[]) => void;
  onClearSelection: () => void;
  getSelectedObjects: (allObjects: Shape[]) => Shape[];
  // Bulk operation functions
  onBulkMove: (deltaX: number, deltaY: number) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkChangeColor: (newColor: string) => Promise<void>;
  // Transform operations
  onResize?: (shapeId: string | undefined, width?: number, height?: number, scale?: number) => Promise<void>;
  onRotate?: (shapeId: string | undefined, degrees: number) => Promise<void>;
  // Alignment operations
  onAlign?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => Promise<void>;
  onDistribute?: (direction: 'horizontal' | 'vertical') => Promise<void>;
  // Z-index operations
  onZIndex?: (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward', shapeId?: string) => Promise<void>;
}

export const useAI = ({ 
  rectangles, 
  canvasSize,
  onCreateRectangle,
  onCreateCircle,
  onCreateLine,
  onCreateText,
  onSelectAll,
  onSelectByColor,
  onSelectByPosition,
  onSelectByIds,
  onBulkMove,
  onBulkDelete,
  onBulkChangeColor,
  onResize,
  onRotate,
  onAlign,
  onDistribute,
  onZIndex,
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
          } else if (action.type === 'createCircle') {
            if (onCreateCircle) {
              const params = action.parameters as any;
              const { x, y, radius, color } = params;
              await onCreateCircle(x, y, radius, color);
            }
          } else if (action.type === 'createLine') {
            if (onCreateLine) {
              const params = action.parameters as any;
              const { x1, y1, x2, y2, color } = params;
              await onCreateLine(x1, y1, x2, y2, color);
            }
          } else if (action.type === 'createText') {
            if (onCreateText) {
              const params = action.parameters as any;
              const { x, y, text, fontSize } = params;
              await onCreateText(x, y, text, fontSize);
            }
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
          } else if (action.type === 'resizeShape') {
            if (onResize) {
              const params = action.parameters as any;
              const { shapeId, width, height, scale } = params;
              await onResize(shapeId, width, height, scale);
            }
          } else if (action.type === 'rotateShape') {
            if (onRotate) {
              const params = action.parameters as any;
              const { shapeId, degrees } = params;
              await onRotate(shapeId, degrees);
            }
          } else if (action.type === 'alignObjects') {
            if (onAlign) {
              const params = action.parameters as any;
              await onAlign(params.alignment);
            }
          } else if (action.type === 'distributeObjects') {
            if (onDistribute) {
              const params = action.parameters as any;
              await onDistribute(params.direction);
            }
          } else if (action.type === 'zIndex') {
            if (onZIndex) {
              const params = action.parameters as any;
              await onZIndex(params.operation, params.shapeId);
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

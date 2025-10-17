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
  onCreateRectangle: (x: number, y: number, width: number, height: number, color: string) => Promise<void>;
}

export const useAI = ({ rectangles, onCreateRectangle }: UseAIProps): UseAIState & UseAIActions => {
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
      const canvasState = getCanvasState(rectangles);
      
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
            const { x, y, width, height, color } = action.parameters;
            await onCreateRectangle(x, y, width, height, color);
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

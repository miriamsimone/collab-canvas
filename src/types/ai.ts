// AI Canvas Agent Types

export interface AICommand {
  id: string;
  prompt: string;
  timestamp: number;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface AIResponse {
  success: boolean;
  message?: string;
  actions?: AIAction[];
  error?: string;
}

export interface AIAction {
  type: 'createRectangle' | 'selectObjects' | 'bulkOperation';
  parameters: CreateRectangleParams | SelectObjectsParams | BulkOperationParams;
}

export interface CreateRectangleParams {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // hex color like "#ff0000"
}

export interface SelectObjectsParams {
  method: 'all' | 'byColor' | 'byPosition' | 'byIds';
  criteria?: {
    color?: string; // hex color for byColor method
    position?: 'top-half' | 'bottom-half' | 'left-half' | 'right-half'; // for byPosition method
    objectIds?: string[]; // for byIds method
  };
}

export interface BulkOperationParams {
  operation: 'move' | 'delete' | 'changeColor';
  operationData?: {
    deltaX?: number; // for move operation
    deltaY?: number; // for move operation
    newColor?: string; // for changeColor operation
  };
}

export interface CanvasState {
  rectangles: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
  }>;
  canvasSize: {
    width: number;
    height: number;
  };
}

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeout: number;
}

export interface UseAIState {
  isLoading: boolean;
  error: string | null;
  lastCommand: AICommand | null;
  commandHistory: AICommand[];
}

export interface UseAIActions {
  executeCommand: (prompt: string) => Promise<void>;
  clearError: () => void;
  clearHistory: () => void;
}

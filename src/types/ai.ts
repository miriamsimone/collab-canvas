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
  type: 'createRectangle' | 'createCircle' | 'createLine' | 'createText' | 'selectObjects' | 'bulkOperation';
  parameters: CreateRectangleParams | CreateCircleParams | CreateLineParams | CreateTextParams | SelectObjectsParams | BulkOperationParams;
}

export interface CreateCircleParams {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface CreateLineParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface CreateTextParams {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
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
  circles: Array<{
    id: string;
    x: number;
    y: number;
    radius: number;
    fill: string;
  }>;
  lines: Array<{
    id: string;
    x: number;
    y: number;
    x2: number;
    y2: number;
    stroke: string;
  }>;
  texts: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    fontSize: number;
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

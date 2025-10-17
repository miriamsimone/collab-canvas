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
  type: 'createRectangle';
  parameters: CreateRectangleParams;
}

export interface CreateRectangleParams {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // hex color like "#ff0000"
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

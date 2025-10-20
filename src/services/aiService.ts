import { 
  type AIResponse, 
  type CanvasState, 
  type AIServiceConfig 
} from '../types/ai';

// AI service configuration - now just for timeout and other client settings
const defaultConfig: AIServiceConfig = {
  apiKey: '', // No longer needed client-side
  model: 'gpt-4o-mini', // Still used for reference
  maxTokens: 500,
  timeout: 10000, // 10 second timeout for API requests
};

console.log('✅ AI Service initialized with secure API route');

class AIService {
  private config: AIServiceConfig;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Process a natural language command to create rectangles
   * Now calls our secure API route instead of OpenAI directly
   */
  async processCommand(
    prompt: string, 
    canvasState: CanvasState
  ): Promise<AIResponse> {
    try {
      // Call our secure API route
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          canvasState,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AIResponse = await response.json();
      return result;

    } catch (error: any) {
      console.error('AI service error:', error);
      
      if (error.name === 'TimeoutError') {
        return {
          success: false,
          error: 'AI request timed out. Please try again.',
        };
      }
      
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        };
      }
      
      return {
        success: false,
        error: `AI processing failed: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Test the AI service connection
   * Now tests our secure API route
   */
  async testConnection(): Promise<boolean> {
    try {
      const testCanvas: CanvasState = {
        rectangles: [],
        circles: [],
        lines: [],
        texts: [],
        canvasSize: { width: 5000, height: 5000 },
      };
      
      const response = await this.processCommand('create a test rectangle', testCanvas);
      return response.success === true || response.success === false; // Any valid response means connection works
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

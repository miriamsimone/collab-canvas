import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { 
  type AIResponse, 
  type CanvasState, 
  type AIServiceConfig 
} from '../types/ai';
import { validateCreateRectangleParams, parseColorName } from '../utils/aiHelpers';

// Zod schema for AI tool parameters
const createRectangleSchema = z.object({
  x: z.number().min(0).max(5000).describe('X position on the canvas (0-5000 pixels from left)'),
  y: z.number().min(0).max(5000).describe('Y position on the canvas (0-5000 pixels from top)'),
  width: z.number().min(10).max(1000).describe('Width of the rectangle in pixels (10-1000)'),
  height: z.number().min(10).max(1000).describe('Height of the rectangle in pixels (10-1000)'),
  color: z.string().describe('Color of the rectangle (hex format like #ff0000 or color name like "red")'),
});

// AI service configuration
const defaultConfig: AIServiceConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4o-mini', // Use the faster, cheaper model for simple tasks
  maxTokens: 500,
  timeout: 10000, // 10 second timeout
};

// Verify API key is loaded
if (defaultConfig.apiKey) {
  console.log('✅ OpenAI API key loaded successfully');
} else {
  console.warn('⚠️ OpenAI API key not found in environment variables');
}

class AIService {
  private config: AIServiceConfig;
  private openai: any;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required. Please set VITE_OPENAI_API_KEY in your .env.local file.');
    }

    // Create OpenAI provider with explicit API key
    this.openai = createOpenAI({
      apiKey: this.config.apiKey,
    });

    console.log('✅ AI Service initialized with OpenAI provider');
  }

  /**
   * Process a natural language command to create rectangles
   */
  async processCommand(
    prompt: string, 
    canvasState: CanvasState
  ): Promise<AIResponse> {
    try {
      // Create system prompt with canvas context
      const systemPrompt = `You are an AI assistant that helps users create rectangles on a canvas.

Current canvas state:
- Canvas size: ${canvasState.canvasSize.width}x${canvasState.canvasSize.height} pixels (large canvas, coordinates up to ${canvasState.canvasSize.width} are valid)
- Existing rectangles: ${canvasState.rectangles.length}
${canvasState.rectangles.length > 0 ? 
  canvasState.rectangles.map(r => 
    `  - Rectangle at (${r.x}, ${r.y}) with size ${r.width}x${r.height}, color ${r.fill}`
  ).join('\n') : '  - No existing rectangles'}

Parse the user's command and extract rectangle creation parameters. 
The canvas is large (${canvasState.canvasSize.width}x${canvasState.canvasSize.height}), so coordinates up to ${canvasState.canvasSize.width} are perfectly valid.
If the user doesn't specify exact coordinates, choose reasonable positions that don't overlap with existing rectangles.
Convert color names to hex format (e.g., "red" becomes "#ff0000").
Default to reasonable sizes if not specified (e.g., 100x80 pixels).

Examples:
- "create a red rectangle" -> place at available space, 100x80 size, #ff0000 color
- "add a blue square at 200, 150" -> place at (200,150), square size like 100x100, #0000ff color
- "make a green rectangle 150 wide and 100 tall" -> available position, 150x100 size, #00ff00 color
- "create a rectangle at 2000, 3000" -> place at (2000,3000), valid coordinates on this large canvas`;

      const result = await generateObject({
        model: this.openai(this.config.model),
        system: systemPrompt,
        prompt: `User command: "${prompt}"`,
        schema: z.object({
          shouldCreateRectangle: z.boolean().describe('Whether the command is asking to create a rectangle'),
          explanation: z.string().describe('Brief explanation of what you understood from the command'),
          rectangle: createRectangleSchema.optional().describe('Rectangle parameters if shouldCreateRectangle is true'),
        }),
      });

      const { shouldCreateRectangle, explanation, rectangle } = result.object;

      if (!shouldCreateRectangle) {
        return {
          success: false,
          message: explanation,
          error: 'Command not recognized as a rectangle creation request',
        };
      }

      if (!rectangle) {
        return {
          success: false,
          message: explanation,
          error: 'Could not extract rectangle parameters from command',
        };
      }

      // Validate and normalize the parameters
      const colorWithHex = parseColorName(rectangle.color);
      const paramsToValidate = { ...rectangle, color: colorWithHex };
      
      const validation = validateCreateRectangleParams(paramsToValidate);
      if (!validation.isValid) {
        return {
          success: false,
          message: explanation,
          error: `Invalid parameters: ${validation.error}`,
        };
      }

      return {
        success: true,
        message: explanation,
        actions: [{
          type: 'createRectangle',
          parameters: validation.validated!,
        }],
      };

    } catch (error: any) {
      console.error('AI service error:', error);
      
      if (error.message?.includes('API key')) {
        return {
          success: false,
          error: 'OpenAI API key is missing or invalid. Please check your .env.local file.',
        };
      }
      
      if (error.message?.includes('rate limit') || error.status === 429) {
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
   */
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await generateObject({
        model: this.openai(this.config.model),
        prompt: 'Just respond with success: true',
        schema: z.object({
          success: z.boolean(),
        }),
      });
      
      return testResponse.object.success === true;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

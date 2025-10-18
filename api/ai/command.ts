import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Zod schema for AI tool parameters - same as client-side but server-validated
const createRectangleSchema = z.object({
  x: z.number().min(0).max(5000).describe('X position on the canvas (0-5000 pixels from left)'),
  y: z.number().min(0).max(5000).describe('Y position on the canvas (0-5000 pixels from top)'),
  width: z.number().min(10).max(1000).describe('Width of the rectangle in pixels (10-1000)'),
  height: z.number().min(10).max(1000).describe('Height of the rectangle in pixels (10-1000)'),
  color: z.string().describe('Color of the rectangle (hex format like #ff0000 or color name like "red")'),
});

// Input validation schema
const requestSchema = z.object({
  prompt: z.string().min(1).max(500),
  canvasState: z.object({
    rectangles: z.array(z.object({
      id: z.string(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      fill: z.string(),
    })),
    canvasSize: z.object({
      width: z.number(),
      height: z.number(),
    }),
  }),
});

// Color name mapping - same as client-side
function parseColorName(colorName: string): string {
  const colorMap: Record<string, string> = {
    red: '#ff0000',
    blue: '#0000ff',
    green: '#00ff00',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    black: '#000000',
    white: '#ffffff',
    gray: '#808080',
    grey: '#808080',
  };

  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || colorName;
}

// Validate rectangle parameters
function validateCreateRectangleParams(params: any): {
  isValid: boolean;
  error?: string;
  validated?: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  };
} {
  // Check required fields
  if (typeof params.x !== 'number' || typeof params.y !== 'number') {
    return { isValid: false, error: 'x and y coordinates must be numbers' };
  }

  if (typeof params.width !== 'number' || typeof params.height !== 'number') {
    return { isValid: false, error: 'width and height must be numbers' };
  }

  if (typeof params.color !== 'string') {
    return { isValid: false, error: 'color must be a string' };
  }

  // Validate ranges
  if (params.width <= 0 || params.height <= 0) {
    return { isValid: false, error: 'width and height must be positive' };
  }

  if (params.x < 0 || params.y < 0) {
    return { isValid: false, error: 'coordinates must be non-negative' };
  }

  // Validate coordinates are within canvas bounds
  if (params.x > 5000 || params.y > 5000) {
    return { 
      isValid: false, 
      error: `coordinates must be within canvas bounds (0-5000, 0-5000)` 
    };
  }

  // Validate color format (basic hex check)
  if (!/^#[0-9a-fA-F]{6}$/.test(params.color)) {
    return { isValid: false, error: 'color must be a valid hex color (e.g., #ff0000)' };
  }

  return {
    isValid: true,
    validated: {
      x: Math.round(params.x),
      y: Math.round(params.y),
      width: Math.round(params.width),
      height: Math.round(params.height),
      color: params.color.toLowerCase(),
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for client-side requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Validate API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }

    // Validate request body
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: `Invalid request: ${validationResult.error.message}`,
      });
    }

    const { prompt, canvasState } = validationResult.data;

    // Create OpenAI provider with server-side API key
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

    // Call OpenAI API
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
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
      return res.status(200).json({
        success: false,
        message: explanation,
        error: 'Command not recognized as a rectangle creation request',
      });
    }

    if (!rectangle) {
      return res.status(200).json({
        success: false,
        message: explanation,
        error: 'Could not extract rectangle parameters from command',
      });
    }

    // Validate and normalize the parameters
    const colorWithHex = parseColorName(rectangle.color);
    const paramsToValidate = { ...rectangle, color: colorWithHex };
    
    const validation = validateCreateRectangleParams(paramsToValidate);
    if (!validation.isValid) {
      return res.status(200).json({
        success: false,
        message: explanation,
        error: `Invalid parameters: ${validation.error}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: explanation,
      actions: [{
        type: 'createRectangle',
        parameters: validation.validated!,
      }],
    });

  } catch (error: any) {
    console.error('AI API error:', error);
    
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key is missing or invalid',
      });
    }
    
    if (error.message?.includes('rate limit') || error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment and try again.',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `AI processing failed: ${error.message || 'Unknown error'}`,
    });
  }
}

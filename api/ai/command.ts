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

const selectObjectsSchema = z.object({
  method: z.enum(['all', 'byColor', 'byPosition', 'byIds']).describe('Selection method to use'),
  criteria: z.object({
    color: z.string().optional().describe('Hex color to select by (for byColor method)'),
    position: z.enum(['top-half', 'bottom-half', 'left-half', 'right-half']).optional().describe('Canvas position to select by'),
    objectIds: z.array(z.string()).optional().describe('Specific object IDs to select'),
  }).optional().describe('Selection criteria based on method'),
});

const createCircleSchema = z.object({
  x: z.number().min(0).max(5000).describe('X position on the canvas (0-5000 pixels from left)'),
  y: z.number().min(0).max(5000).describe('Y position on the canvas (0-5000 pixels from top)'),
  radius: z.number().min(5).max(500).describe('Radius of the circle in pixels (5-500)'),
  color: z.string().describe('Color of the circle (hex format like #ff0000 or color name like "red")'),
});

const createLineSchema = z.object({
  x1: z.number().min(0).max(5000).describe('X position of line start point'),
  y1: z.number().min(0).max(5000).describe('Y position of line start point'),
  x2: z.number().min(0).max(5000).describe('X position of line end point'),
  y2: z.number().min(0).max(5000).describe('Y position of line end point'),
  color: z.string().describe('Color of the line (hex format like #ff0000 or color name like "red")'),
});

const createTextSchema = z.object({
  x: z.number().min(0).max(5000).describe('X position on the canvas (0-5000 pixels from left)'),
  y: z.number().min(0).max(5000).describe('Y position on the canvas (0-5000 pixels from top)'),
  text: z.string().min(1).max(200).describe('Text content to display'),
  fontSize: z.number().min(8).max(72).optional().describe('Font size in pixels (8-72, defaults to 16)'),
});

const bulkOperationSchema = z.object({
  operation: z.enum(['move', 'delete', 'changeColor']).describe('Bulk operation to perform on selected objects'),
  operationData: z.object({
    deltaX: z.number().optional().describe('X offset for move operation'),
    deltaY: z.number().optional().describe('Y offset for move operation'),
    newColor: z.string().optional().describe('New color for changeColor operation'),
  }).optional().describe('Operation-specific data'),
});

const resizeShapeSchema = z.object({
  shapeId: z.string().optional().describe('ID of shape to resize (if not provided, resizes selected objects)'),
  width: z.number().min(10).max(1000).optional().describe('New width in pixels'),
  height: z.number().min(10).max(1000).optional().describe('New height in pixels'),
  scale: z.number().min(0.1).max(10).optional().describe('Scale factor (e.g., 2 = twice as big, 0.5 = half size)'),
});

const rotateShapeSchema = z.object({
  shapeId: z.string().optional().describe('ID of shape to rotate (if not provided, rotates selected objects)'),
  degrees: z.number().min(-360).max(360).describe('Rotation angle in degrees'),
});

const alignObjectsSchema = z.object({
  alignment: z.enum(['left', 'center', 'right', 'top', 'middle', 'bottom']).describe('Alignment type'),
});

const distributeObjectsSchema = z.object({
  direction: z.enum(['horizontal', 'vertical']).describe('Distribution direction'),
});

const zIndexSchema = z.object({
  operation: z.enum(['bringToFront', 'sendToBack', 'bringForward', 'sendBackward']).describe('Z-index operation'),
  shapeId: z.string().optional().describe('ID of shape (if not provided, applies to selected objects)'),
});

const bulkCreateSchema = z.object({
  shapeType: z.enum(['rectangle', 'circle', 'line', 'text']).describe('Type of shape to create in bulk'),
  count: z.number().min(1).max(1000).describe('Number of shapes to create (1-1000)'),
  pattern: z.enum(['grid', 'random', 'horizontal', 'vertical']).optional().describe('Layout pattern for shapes'),
  baseParams: z.object({
    color: z.string().optional().describe('Base color for all shapes'),
    width: z.number().optional().describe('Width for rectangles'),
    height: z.number().optional().describe('Height for rectangles'),
    radius: z.number().optional().describe('Radius for circles'),
    text: z.string().optional().describe('Text content for text shapes'),
    fontSize: z.number().optional().describe('Font size for text shapes'),
  }).optional().describe('Base parameters applied to all shapes'),
  area: z.object({
    startX: z.number().min(0).max(5000).optional().describe('Starting X position'),
    startY: z.number().min(0).max(5000).optional().describe('Starting Y position'),
    width: z.number().optional().describe('Width of area to fill'),
    height: z.number().optional().describe('Height of area to fill'),
  }).optional().describe('Area constraints for shape placement'),
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

// Color name mapping - matches the 8 colors in the style window
function parseColorName(colorName: string): string {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    orange: '#f97316',
    gray: '#6b7280',
    grey: '#6b7280',
    black: '#000000',
  };

  // Map common hex colors to our palette
  const hexColorMap: Record<string, string> = {
    '#ff0000': '#ef4444', // red
    '#0000ff': '#3b82f6', // blue
    '#00ff00': '#10b981', // green
    '#ffff00': '#f59e0b', // yellow
    '#800080': '#8b5cf6', // purple
    '#ffa500': '#f97316', // orange
    '#808080': '#6b7280', // gray
    '#ffffff': '#6b7280', // white -> gray
    '#ffc0cb': '#ef4444', // pink -> red
  };

  const normalized = colorName.toLowerCase().trim();
  
  // Check if it's a color name
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }
  
  // Check if it's a hex color that needs mapping
  if (hexColorMap[normalized]) {
    return hexColorMap[normalized];
  }
  
  // If it's a valid hex color from our palette, return it
  if (/^#[0-9a-fA-F]{6}$/.test(colorName)) {
    const lowerColor = colorName.toLowerCase();
    const paletteColors = Object.values(colorMap);
    if (paletteColors.includes(lowerColor)) {
      return lowerColor;
    }
  }
  
  // Default to blue if color is not recognized
  return '#3b82f6';
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
    const systemPrompt = `You are an AI assistant that helps users manage shapes on a canvas. You can create rectangles, circles, lines, and text, select objects, and perform bulk operations.

IMPORTANT: When creating shapes, use ONLY these 8 available colors:
- Blue: #3b82f6
- Red: #ef4444
- Green: #10b981
- Yellow: #f59e0b
- Purple: #8b5cf6
- Orange: #f97316
- Gray: #6b7280
- Black: #000000

Current canvas state:
- Canvas size: ${canvasState.canvasSize.width}x${canvasState.canvasSize.height} pixels (large canvas, coordinates up to ${canvasState.canvasSize.width} are valid)
- Existing shapes: ${canvasState.rectangles.length}
${canvasState.rectangles.length > 0 ? 
  canvasState.rectangles.map(shape => {
    if (shape.type === 'rectangle') {
      return `  - Rectangle "${shape.id}" at (${shape.x}, ${shape.y}) with size ${shape.width}x${shape.height}, color ${shape.fill}`;
    } else if (shape.type === 'circle') {
      return `  - Circle "${shape.id}" at (${shape.x}, ${shape.y}) with radius ${shape.radius}, color ${shape.fill}`;
    } else if (shape.type === 'line') {
      return `  - Line "${shape.id}" from (${shape.x}, ${shape.y}) to (${shape.x2}, ${shape.y2}), color ${shape.stroke}`;
    } else if (shape.type === 'text') {
      return `  - Text "${shape.id}" at (${shape.x}, ${shape.y}) saying "${shape.text}", font size ${shape.fontSize}`;
    }
    return `  - Shape "${shape.id}" at (${shape.x}, ${shape.y})`;
  }).join('\n') : '  - No existing shapes'}

You can perform these types of operations:

1. CREATE SHAPES:
   - CREATE RECTANGLES, CIRCLES, LINES, TEXT
   - Use ONLY the 8 available colors listed above
   - Convert color names to their exact hex format (e.g., "red" becomes "#ef4444")
   - Choose reasonable positions that don't overlap with existing shapes
   - When user specifies "NxM grid", "N by M grid", "N x M grid" of shapes:
     * This means create N*M shapes arranged in a grid pattern
     * Use bulkCreate with count = N*M and pattern = 'grid'
     * Example: "3x3 grid" = count: 9, pattern: 'grid'

2. SELECT OBJECTS:
   - Select all, by color, by position, or specific objects
   - IMPORTANT: Many operations require shapes to be selected first!
   - When user specifies shape characteristics (color, type, or both):
     * Use selectObjects with method: 'byIds'
     * Extract IDs from canvas state that match the criteria
     * Examples: "blue rectangle" → filter for type='rectangle' AND fill contains blue color
     * Examples: "all circles" → filter for type='circle'
     * Examples: "the text" → filter for type='text'

3. SELECT BEFORE OPERATING:
   - CRITICAL RULE: Before resize, rotate, or most operations on specific shapes, SELECT them first!
   - Pattern: selectObjects → then → operation
   - This ensures the operation targets exactly the right shapes

4. BULK OPERATIONS:
   - Move, delete, or change color of selected objects

5. BULK CREATE (PERFORMANCE TESTING):
   - Create many shapes at once efficiently (up to 1000)
   - Use for commands like "create 500 rectangles" or "fill the canvas with circles"
   - Supports patterns: grid, random, horizontal, vertical
   - IMPORTANT: When user says "NxM grid" or "N x M grid", calculate count as N*M and use pattern: 'grid'
   - Examples:
     * "create 500 rectangles" -> bulkCreate with shapeType: 'rectangle', count: 500, pattern: 'random'
     * "create 100 blue circles in a grid" -> bulkCreate with shapeType: 'circle', count: 100, pattern: 'grid', baseParams: {color: '#3b82f6'}
     * "create a 3x3 grid of squares" -> bulkCreate with shapeType: 'rectangle', count: 9, pattern: 'grid'
     * "create a 5 x 4 grid of red circles" -> bulkCreate with shapeType: 'circle', count: 20, pattern: 'grid', baseParams: {color: '#ef4444'}
     * "make a 10x10 grid of rectangles" -> bulkCreate with shapeType: 'rectangle', count: 100, pattern: 'grid'
   - IMPORTANT: Use bulkCreate instead of multiple individual create actions when count > 10

6. RESIZE SHAPES:
   - Resize by width/height or scale factor
   - IMPORTANT: When resizing specific shapes by type or color, you must FIRST select them using selectObjects
   - "make the circle twice as big" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of all circles from canvas state], THEN resizeShape with scale: 2
   - "resize the blue rectangle to 300x200" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of blue rectangles from canvas state], THEN resizeShape with width: 300, height: 200

7. ROTATE SHAPES:
   - Rotate shapes by degrees
   - IMPORTANT: When rotating specific shapes, you must EITHER:
     a) Provide the shapeId from canvas state, OR
     b) First selectObjects to select the shapes, THEN rotateShape
   - "rotate the text 45 degrees" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of all text shapes from canvas state], THEN rotateShape with degrees: 45
   - "rotate the blue rectangle 90 degrees" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of blue rectangles from canvas state], THEN rotateShape with degrees: 90

8. ALIGN OBJECTS:
   - Align selected objects (left, center, right, top, middle, bottom)
   - "align all objects to the left" -> alignObjects with alignment: 'left'

9. DISTRIBUTE OBJECTS:
   - Distribute selected objects evenly (horizontal or vertical)
   - "distribute horizontally" -> distributeObjects with direction: 'horizontal'

10. Z-INDEX (LAYER MANAGEMENT):
   - Bring to front, send to back, bring forward, send backward
   - "bring the red rectangle to front" -> zIndex with operation: 'bringToFront'

11. COMPLEX MULTI-STEP COMMANDS:
   - For complex requests like "create a login form", break it into multiple actions
   - Example: "create a login form" ->
     * createText for "Username" label
     * createRectangle for username input field
     * createText for "Password" label
     * createRectangle for password input field
     * createRectangle for "Login" button
   - Space elements vertically with consistent gaps (30-40px)
   - Align elements for a clean layout

Examples:
- "create a red rectangle at 100, 100" -> createRectangle with color: '#ef4444'
- "create 500 rectangles" -> bulkCreate with shapeType: 'rectangle', count: 500, pattern: 'random'
- "fill the canvas with 200 blue circles" -> bulkCreate with shapeType: 'circle', count: 200, pattern: 'random', baseParams: {color: '#3b82f6'}
- "create 100 rectangles in a grid" -> bulkCreate with shapeType: 'rectangle', count: 100, pattern: 'grid'
- "create a 3x3 grid of squares" -> bulkCreate with shapeType: 'rectangle', count: 9, pattern: 'grid'
- "make a 5 x 4 grid of red circles" -> bulkCreate with shapeType: 'circle', count: 20, pattern: 'grid', baseParams: {color: '#ef4444'}
- "make the blue rectangle twice as big" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of rectangles with blue color from canvas state], THEN resizeShape with scale: 2
- "make all circles twice as big" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of all circles from canvas state], THEN resizeShape with scale: 2
- "rotate the text 45 degrees" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of all text shapes from canvas state], THEN rotateShape with degrees: 45
- "rotate the blue rectangle 90 degrees" -> FIRST selectObjects with method: 'byIds' and objectIds: [IDs of blue rectangles from canvas state], THEN rotateShape with degrees: 90
- "align all selected objects to the left" -> alignObjects
- "bring the red rectangle to front" -> zIndex with operation: 'bringToFront'
- "create a login form" -> multiple createText + createRectangle actions arranged vertically

For complex commands, return multiple actions that will be executed in sequence.
Remember: Use bulkCreate for any request to create more than 10 shapes.`;

    // Call OpenAI API
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `User command: "${prompt}"`,
      schema: z.object({
        isValidCommand: z.boolean().describe('Whether the command is a valid canvas operation'),
        explanation: z.string().describe('Brief explanation of what you understood from the command'),
        actions: z.array(z.object({
          type: z.enum([
            'createRectangle', 
            'createCircle', 
            'createLine', 
            'createText', 
            'selectObjects', 
            'bulkOperation',
            'bulkCreate',
            'resizeShape',
            'rotateShape',
            'alignObjects',
            'distributeObjects',
            'zIndex'
          ]).describe('Type of action to perform'),
          parameters: z.union([
            createRectangleSchema,
            createCircleSchema,
            createLineSchema,
            createTextSchema,
            selectObjectsSchema,
            bulkOperationSchema,
            bulkCreateSchema,
            resizeShapeSchema,
            rotateShapeSchema,
            alignObjectsSchema,
            distributeObjectsSchema,
            zIndexSchema,
          ]).describe('Parameters for the action'),
        })).describe('List of actions to execute in order'),
      }),
    });

    const { isValidCommand, explanation, actions } = result.object;

    if (!isValidCommand || !actions || actions.length === 0) {
      return res.status(200).json({
        success: false,
        message: explanation,
        error: 'Command not recognized as a valid canvas operation',
      });
    }

    // Process and validate each action
    const validatedActions = [];
    
    for (const action of actions) {
      if (action.type === 'createRectangle') {
        const rectangle = action.parameters as any;
        const colorWithHex = parseColorName(rectangle.color);
        const paramsToValidate = { ...rectangle, color: colorWithHex };
        
        const validation = validateCreateRectangleParams(paramsToValidate);
        if (!validation.isValid) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: `Invalid rectangle parameters: ${validation.error}`,
          });
        }
        
        validatedActions.push({
          type: 'createRectangle',
          parameters: validation.validated!,
        });
      } else if (action.type === 'createCircle') {
        const circle = action.parameters as any;
        const colorWithHex = parseColorName(circle.color);
        
        // Basic validation for circle
        if (circle.radius <= 0 || circle.radius > 500) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Circle radius must be between 1 and 500',
          });
        }
        
        validatedActions.push({
          type: 'createCircle',
          parameters: {
            x: Math.round(circle.x),
            y: Math.round(circle.y),
            radius: Math.round(circle.radius),
            color: colorWithHex,
          },
        });
      } else if (action.type === 'createLine') {
        const line = action.parameters as any;
        const colorWithHex = parseColorName(line.color);
        
        validatedActions.push({
          type: 'createLine',
          parameters: {
            x1: Math.round(line.x1),
            y1: Math.round(line.y1),
            x2: Math.round(line.x2),
            y2: Math.round(line.y2),
            color: colorWithHex,
          },
        });
      } else if (action.type === 'createText') {
        const text = action.parameters as any;
        
        if (!text.text || text.text.trim().length === 0) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Text content cannot be empty',
          });
        }
        
        validatedActions.push({
          type: 'createText',
          parameters: {
            x: Math.round(text.x),
            y: Math.round(text.y),
            text: text.text.trim(),
            fontSize: text.fontSize || 16,
          },
        });
      } else if (action.type === 'selectObjects') {
        // Validate selection parameters
        const selectParams = action.parameters as any;
        if (!selectParams.method) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Selection method is required',
          });
        }
        
        // Convert color names to hex for selection
        if (selectParams.criteria?.color) {
          selectParams.criteria.color = parseColorName(selectParams.criteria.color);
        }
        
        validatedActions.push({
          type: 'selectObjects',
          parameters: selectParams,
        });
      } else if (action.type === 'bulkOperation') {
        // Validate bulk operation parameters
        const bulkParams = action.parameters as any;
        if (!bulkParams.operation) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Bulk operation type is required',
          });
        }
        
        // Convert color names to hex for color operations
        if (bulkParams.operationData?.newColor) {
          bulkParams.operationData.newColor = parseColorName(bulkParams.operationData.newColor);
        }
        
        validatedActions.push({
          type: 'bulkOperation',
          parameters: bulkParams,
        });
      } else if (action.type === 'bulkCreate') {
        // Validate bulk create parameters
        const bulkCreateParams = action.parameters as any;
        if (!bulkCreateParams.shapeType || !bulkCreateParams.count) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Bulk create requires shapeType and count parameters',
          });
        }
        
        // Validate count is within limits
        if (bulkCreateParams.count < 1 || bulkCreateParams.count > 1000) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Bulk create count must be between 1 and 1000',
          });
        }
        
        // Convert color names to hex if provided
        if (bulkCreateParams.baseParams?.color) {
          bulkCreateParams.baseParams.color = parseColorName(bulkCreateParams.baseParams.color);
        }
        
        // Set defaults
        if (!bulkCreateParams.pattern) {
          bulkCreateParams.pattern = 'random';
        }
        
        validatedActions.push({
          type: 'bulkCreate',
          parameters: bulkCreateParams,
        });
      } else if (action.type === 'resizeShape') {
        const resizeParams = action.parameters as any;
        
        // Validate that either width/height or scale is provided
        if (!resizeParams.width && !resizeParams.height && !resizeParams.scale) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Resize operation requires width, height, or scale parameter',
          });
        }
        
        validatedActions.push({
          type: 'resizeShape',
          parameters: resizeParams,
        });
      } else if (action.type === 'rotateShape') {
        const rotateParams = action.parameters as any;
        
        if (typeof rotateParams.degrees !== 'number') {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Rotation requires degrees parameter',
          });
        }
        
        validatedActions.push({
          type: 'rotateShape',
          parameters: rotateParams,
        });
      } else if (action.type === 'alignObjects') {
        const alignParams = action.parameters as any;
        
        if (!alignParams.alignment) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Alignment operation requires alignment parameter',
          });
        }
        
        validatedActions.push({
          type: 'alignObjects',
          parameters: alignParams,
        });
      } else if (action.type === 'distributeObjects') {
        const distributeParams = action.parameters as any;
        
        if (!distributeParams.direction) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Distribute operation requires direction parameter',
          });
        }
        
        validatedActions.push({
          type: 'distributeObjects',
          parameters: distributeParams,
        });
      } else if (action.type === 'zIndex') {
        const zIndexParams = action.parameters as any;
        
        if (!zIndexParams.operation) {
          return res.status(200).json({
            success: false,
            message: explanation,
            error: 'Z-index operation requires operation parameter',
          });
        }
        
        validatedActions.push({
          type: 'zIndex',
          parameters: zIndexParams,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: explanation,
      actions: validatedActions,
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

import express from 'express';
import cors from 'cors';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Enable CORS for all origins (development only)
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Development API server running' });
});

// AI command endpoint implementation
app.post('/api/ai/command', async (req, res) => {
  console.log('🤖 AI Command Request:', req.body?.prompt || 'No prompt provided');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error - API key missing',
      });
    }

    const { prompt, canvasState } = req.body;

    if (!prompt || !canvasState) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt or canvasState in request',
      });
    }

    // Create OpenAI client
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Schemas for different action types
    const createRectangleSchema = z.object({
      x: z.number().min(0).max(5000),
      y: z.number().min(0).max(5000),
      width: z.number().min(10).max(1000),
      height: z.number().min(10).max(1000),
      color: z.string(),
    });

    const selectObjectsSchema = z.object({
      method: z.enum(['all', 'byColor', 'byPosition', 'byIds']),
      criteria: z.object({
        color: z.string().optional(),
        position: z.enum(['top-half', 'bottom-half', 'left-half', 'right-half']).optional(),
        objectIds: z.array(z.string()).optional(),
      }).optional(),
    });

    const createCircleSchema = z.object({
      x: z.number().min(0).max(5000),
      y: z.number().min(0).max(5000),
      radius: z.number().min(5).max(500),
      color: z.string(),
    });

    const createLineSchema = z.object({
      x1: z.number().min(0).max(5000),
      y1: z.number().min(0).max(5000),
      x2: z.number().min(0).max(5000),
      y2: z.number().min(0).max(5000),
      color: z.string(),
    });

    const createTextSchema = z.object({
      x: z.number().min(0).max(5000),
      y: z.number().min(0).max(5000),
      text: z.string().min(1).max(200),
      fontSize: z.number().min(8).max(72).optional(),
    });

    const bulkOperationSchema = z.object({
      operation: z.enum(['move', 'delete', 'changeColor']),
      operationData: z.object({
        deltaX: z.number().optional(),
        deltaY: z.number().optional(),
        newColor: z.string().optional(),
      }).optional(),
    });

    const resizeShapeSchema = z.object({
      shapeId: z.string().optional(),
      width: z.number().min(10).max(1000).optional(),
      height: z.number().min(10).max(1000).optional(),
      scale: z.number().min(0.1).max(10).optional(),
    });

    const rotateShapeSchema = z.object({
      shapeId: z.string().optional(),
      degrees: z.number().min(-360).max(360),
    });

    const alignObjectsSchema = z.object({
      alignment: z.enum(['left', 'center', 'right', 'top', 'middle', 'bottom']),
    });

    const distributeObjectsSchema = z.object({
      direction: z.enum(['horizontal', 'vertical']),
    });

    const zIndexSchema = z.object({
      operation: z.enum(['bringToFront', 'sendToBack', 'bringForward', 'sendBackward']),
      shapeId: z.string().optional(),
    });

    const bulkCreateSchema = z.object({
      shapeType: z.enum(['rectangle', 'circle', 'line', 'text']),
      count: z.number().min(1).max(1000),
      pattern: z.enum(['grid', 'random', 'horizontal', 'vertical']).optional(),
      baseParams: z.object({
        color: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        radius: z.number().optional(),
        text: z.string().optional(),
        fontSize: z.number().optional(),
      }).optional(),
      area: z.object({
        startX: z.number().min(0).max(5000).optional(),
        startY: z.number().min(0).max(5000).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      }).optional(),
    });

    // System prompt
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

    // Generate AI response
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `User command: "${prompt}"`,
      schema: z.object({
        isValidCommand: z.boolean(),
        explanation: z.string(),
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
          ]),
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
          ]),
        })),
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

    // Process actions (basic validation)
    const validatedActions = actions.map(action => {
      if (action.type === 'createRectangle') {
        // Ensure color is in hex format and semi-transparent
        const params = action.parameters;
        let color = params.color;
        
        // Convert common color names to hex - matches the 8-color palette
        if (color && !color.startsWith('#')) {
          const colorMap = {
            'blue': '#3b82f6', 'red': '#ef4444', 'green': '#10b981',
            'yellow': '#f59e0b', 'purple': '#8b5cf6', 'orange': '#f97316',
            'gray': '#6b7280', 'grey': '#6b7280', 'black': '#000000'
          };
          color = colorMap[color.toLowerCase()] || '#3b82f6'; // Default to blue
        }
        
        // Map common hex colors to palette colors
        if (color && color.startsWith('#')) {
          const hexColorMap = {
            '#ff0000': '#ef4444', '#0000ff': '#3b82f6', '#00ff00': '#10b981',
            '#ffff00': '#f59e0b', '#800080': '#8b5cf6', '#ffa500': '#f97316',
            '#808080': '#6b7280', '#ffffff': '#6b7280', '#ffc0cb': '#ef4444'
          };
          const lowerColor = color.toLowerCase();
          color = hexColorMap[lowerColor] || color;
        }
        
        params.color = color;
      } else if (action.type === 'createCircle') {
        // Handle circle color
        const params = action.parameters;
        let color = params.color;
        
        // Convert common color names to hex - matches the 8-color palette
        if (color && !color.startsWith('#')) {
          const colorMap = {
            'blue': '#3b82f6', 'red': '#ef4444', 'green': '#10b981',
            'yellow': '#f59e0b', 'purple': '#8b5cf6', 'orange': '#f97316',
            'gray': '#6b7280', 'grey': '#6b7280', 'black': '#000000'
          };
          color = colorMap[color.toLowerCase()] || '#3b82f6'; // Default to blue
        }
        
        // Map common hex colors to palette colors
        if (color && color.startsWith('#')) {
          const hexColorMap = {
            '#ff0000': '#ef4444', '#0000ff': '#3b82f6', '#00ff00': '#10b981',
            '#ffff00': '#f59e0b', '#800080': '#8b5cf6', '#ffa500': '#f97316',
            '#808080': '#6b7280', '#ffffff': '#6b7280', '#ffc0cb': '#ef4444'
          };
          const lowerColor = color.toLowerCase();
          color = hexColorMap[lowerColor] || color;
        }
        
        params.color = color;
      } else if (action.type === 'createLine') {
        // Handle line color
        const params = action.parameters;
        let color = params.color;
        
        // Convert common color names to hex - matches the 8-color palette
        if (color && !color.startsWith('#')) {
          const colorMap = {
            'blue': '#3b82f6', 'red': '#ef4444', 'green': '#10b981',
            'yellow': '#f59e0b', 'purple': '#8b5cf6', 'orange': '#f97316',
            'gray': '#6b7280', 'grey': '#6b7280', 'black': '#000000'
          };
          color = colorMap[color.toLowerCase()] || '#3b82f6'; // Default to blue
        }
        
        // Map common hex colors to palette colors
        if (color && color.startsWith('#')) {
          const hexColorMap = {
            '#ff0000': '#ef4444', '#0000ff': '#3b82f6', '#00ff00': '#10b981',
            '#ffff00': '#f59e0b', '#800080': '#8b5cf6', '#ffa500': '#f97316',
            '#808080': '#6b7280', '#ffffff': '#6b7280', '#ffc0cb': '#ef4444'
          };
          const lowerColor = color.toLowerCase();
          color = hexColorMap[lowerColor] || color;
        }
        
        params.color = color;
      } else if (action.type === 'createText') {
        // Handle text - no color processing needed as text uses default colors
        // but we can set a default fontSize if not provided
        const params = action.parameters;
        if (!params.fontSize) {
          params.fontSize = 16; // Default font size
        }
      } else if (action.type === 'bulkOperation' && action.parameters.operation === 'changeColor') {
        // Handle bulk color change operations
        const params = action.parameters;
        if (params.operationData?.newColor) {
          let color = params.operationData.newColor;
          
          // Convert common color names to hex for bulk operations - matches the 8-color palette
          if (!color.startsWith('#')) {
            const colorMap = {
              'blue': '#3b82f6', 'red': '#ef4444', 'green': '#10b981',
              'yellow': '#f59e0b', 'purple': '#8b5cf6', 'orange': '#f97316',
              'gray': '#6b7280', 'grey': '#6b7280', 'black': '#000000'
            };
            color = colorMap[color.toLowerCase()] || '#3b82f6'; // Default to blue
          }
          
          params.operationData.newColor = color;
        }
      }
      return action;
    });

    console.log(`✅ AI generated ${validatedActions.length} action(s):`, 
                validatedActions.map(a => a.type).join(', '));

    return res.status(200).json({
      success: true,
      message: explanation,
      actions: validatedActions,
    });

  } catch (error) {
    console.error('❌ AI API Error:', error);
    return res.status(500).json({
      success: false,
      error: `AI processing failed: ${error.message}`,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log(`📝 AI endpoint: http://localhost:${PORT}/api/ai/command`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development API server...');
  process.exit(0);
});

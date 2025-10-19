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
    const systemPrompt = `You are an AI assistant that helps users manage shapes on a canvas. You can create rectangles, circles, lines, and text, select objects, and perform bulk operations, resize, rotate, align, distribute, and manage layers.

Current canvas state:
- Canvas size: ${canvasState.canvasSize.width}x${canvasState.canvasSize.height} pixels
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
   - Convert color names to hex format (e.g., "red" becomes "#ff0000")
   - Choose reasonable positions that don't overlap with existing shapes

2. SELECT OBJECTS:
   - Select all, by color, by position, or specific objects

3. BULK OPERATIONS:
   - Move, delete, or change color of selected objects

4. BULK CREATE (PERFORMANCE TESTING):
   - Create many shapes at once efficiently (up to 1000)
   - Use for commands like "create 500 rectangles" or "fill the canvas with circles"
   - Supports patterns: grid, random, horizontal, vertical
   - Example: "create 500 rectangles" -> bulkCreate with shapeType: 'rectangle', count: 500, pattern: 'random'
   - Example: "create 100 blue circles in a grid" -> bulkCreate with shapeType: 'circle', count: 100, pattern: 'grid', baseParams: {color: '#0000ff'}
   - IMPORTANT: Use bulkCreate instead of multiple individual create actions when count > 10

5. RESIZE SHAPES:
   - Resize by width/height or scale factor
   - "make the circle twice as big" -> resizeShape with scale: 2
   - "resize the rectangle to 300x200" -> resizeShape with width: 300, height: 200

6. ROTATE SHAPES:
   - Rotate shapes by degrees
   - "rotate the text 45 degrees" -> rotateShape with degrees: 45

7. ALIGN OBJECTS:
   - Align selected objects (left, center, right, top, middle, bottom)
   - "align all objects to the left" -> alignObjects with alignment: 'left'

8. DISTRIBUTE OBJECTS:
   - Distribute selected objects evenly (horizontal or vertical)
   - "distribute horizontally" -> distributeObjects with direction: 'horizontal'

9. Z-INDEX (LAYER MANAGEMENT):
   - Bring to front, send to back, bring forward, send backward
   - "bring the red rectangle to front" -> zIndex with operation: 'bringToFront'

10. COMPLEX MULTI-STEP COMMANDS:
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
- "create a red rectangle at 100, 100" -> createRectangle
- "create 500 rectangles" -> bulkCreate with shapeType: 'rectangle', count: 500, pattern: 'random'
- "fill the canvas with 200 blue circles" -> bulkCreate with shapeType: 'circle', count: 200, pattern: 'random', baseParams: {color: '#0000ff'}
- "create 100 rectangles in a grid" -> bulkCreate with shapeType: 'rectangle', count: 100, pattern: 'grid'
- "make the circle twice as big" -> resizeShape with scale: 2
- "rotate the text 45 degrees" -> rotateShape with degrees: 45
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
        
        // Convert common color names to hex
        if (color && !color.startsWith('#')) {
          const colorMap = {
            'red': '#ff0000', 'blue': '#0000ff', 'green': '#00ff00',
            'yellow': '#ffff00', 'orange': '#ffa500', 'purple': '#800080',
            'pink': '#ffc0cb', 'black': '#000000', 'white': '#ffffff',
            'gray': '#808080', 'grey': '#808080'
          };
          color = colorMap[color.toLowerCase()] || '#' + color;
        }
        
        // Ensure semi-transparency (this will be applied in the frontend)
        // Just make sure we have a valid hex color here
        if (color && !color.startsWith('#')) {
          color = '#' + color;
        }
        
        params.color = color;
      } else if (action.type === 'createCircle') {
        // Handle circle color
        const params = action.parameters;
        let color = params.color;
        
        // Convert common color names to hex
        if (color && !color.startsWith('#')) {
          const colorMap = {
            'red': '#ff0000', 'blue': '#0000ff', 'green': '#00ff00',
            'yellow': '#ffff00', 'orange': '#ffa500', 'purple': '#800080',
            'pink': '#ffc0cb', 'black': '#000000', 'white': '#ffffff',
            'gray': '#808080', 'grey': '#808080'
          };
          color = colorMap[color.toLowerCase()] || '#' + color;
        }
        
        if (color && !color.startsWith('#')) {
          color = '#' + color;
        }
        
        params.color = color;
      } else if (action.type === 'createLine') {
        // Handle line color
        const params = action.parameters;
        let color = params.color;
        
        // Convert common color names to hex
        if (color && !color.startsWith('#')) {
          const colorMap = {
            'red': '#ff0000', 'blue': '#0000ff', 'green': '#00ff00',
            'yellow': '#ffff00', 'orange': '#ffa500', 'purple': '#800080',
            'pink': '#ffc0cb', 'black': '#000000', 'white': '#ffffff',
            'gray': '#808080', 'grey': '#808080'
          };
          color = colorMap[color.toLowerCase()] || '#' + color;
        }
        
        if (color && !color.startsWith('#')) {
          color = '#' + color;
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
          
          // Convert common color names to hex for bulk operations
          if (!color.startsWith('#')) {
            const colorMap = {
              'red': '#ff0000', 'blue': '#0000ff', 'green': '#00ff00',
              'yellow': '#ffff00', 'orange': '#ffa500', 'purple': '#800080',
              'pink': '#ffc0cb', 'black': '#000000', 'white': '#ffffff',
              'gray': '#808080', 'grey': '#808080'
            };
            color = colorMap[color.toLowerCase()] || '#' + color;
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

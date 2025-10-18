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

    // System prompt
    const systemPrompt = `You are an AI assistant that helps users manage shapes on a canvas. You can create rectangles, circles, lines, and text, select objects, and perform bulk operations.

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

You can perform these operations:
1. CREATE SHAPES: Generate createRectangle, createCircle, createLine, or createText actions
2. SELECT OBJECTS: Generate selectObjects actions for various selection methods
3. BULK OPERATIONS: Generate bulkOperation actions for selected objects

Shape Creation Examples:
- "create a red rectangle" -> createRectangle action
- "add a blue circle" -> createCircle action
- "draw a line from top left to bottom right" -> createLine action
- "add text that says hello" -> createText action

Selection Examples:
- "select all shapes" -> selectObjects with method "all"
- "select red shapes" -> selectObjects with method "byColor" 
- "select objects in top half" -> selectObjects with method "byPosition"

Bulk Operation Examples:
- "move selected objects right" -> bulkOperation with operation "move"
- "delete all red shapes" -> selectObjects + bulkOperation
- "change selected to blue" -> bulkOperation with operation "changeColor"`;

    // Generate AI response
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `User command: "${prompt}"`,
      schema: z.object({
        isValidCommand: z.boolean(),
        explanation: z.string(),
        actions: z.array(z.object({
          type: z.enum(['createRectangle', 'createCircle', 'createLine', 'createText', 'selectObjects', 'bulkOperation']),
          parameters: z.union([
            createRectangleSchema,
            createCircleSchema,
            createLineSchema,
            createTextSchema,
            selectObjectsSchema,
            bulkOperationSchema,
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

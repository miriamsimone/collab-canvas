import type { Shape } from '../types/shapes';
import { type CanvasState } from '../types/ai';
import { CANVAS_CONFIG } from '../hooks/useCanvas';

/**
 * Get current canvas state for AI context
 * Returns basic rectangle positions and types for AI decision making
 */
export function getCanvasState(
  shapes: Shape[], 
  canvasSize?: { width: number; height: number }
): CanvasState {
  return {
    rectangles: shapes.map(shape => {
      const baseShape: any = {
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
      };
      
      // Add type-specific properties
      if (shape.type === 'rectangle') {
        baseShape.width = (shape as any).width || 100;
        baseShape.height = (shape as any).height || 100;
        baseShape.fill = (shape as any).fill || (shape as any).stroke || '#000000';
      } else if (shape.type === 'circle') {
        baseShape.radius = (shape as any).radius || 50;
        baseShape.fill = (shape as any).fill || (shape as any).stroke || '#000000';
      } else if (shape.type === 'line') {
        baseShape.x2 = (shape as any).x2 || shape.x + 100;
        baseShape.y2 = (shape as any).y2 || shape.y;
        baseShape.stroke = (shape as any).stroke || '#000000';
      } else if (shape.type === 'text') {
        baseShape.text = (shape as any).text || '';
        baseShape.fontSize = (shape as any).fontSize || 16;
        baseShape.fill = (shape as any).fill || '#000000';
      }
      
      return baseShape;
    }),
    canvasSize: canvasSize || {
      width: CANVAS_CONFIG.WIDTH,
      height: CANVAS_CONFIG.HEIGHT,
    },
  };
}

/**
 * Validate AI command parameters
 */
export function validateCreateRectangleParams(params: any): {
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
  if (params.x > CANVAS_CONFIG.WIDTH || params.y > CANVAS_CONFIG.HEIGHT) {
    return { 
      isValid: false, 
      error: `coordinates must be within canvas bounds (0-${CANVAS_CONFIG.WIDTH}, 0-${CANVAS_CONFIG.HEIGHT})` 
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

/**
 * Generate a unique ID for AI commands
 */
export function generateCommandId(): string {
  return `ai-cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse color names to hex values - matches the 8 colors in the style window
 */
export function parseColorName(colorName: string): string {
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

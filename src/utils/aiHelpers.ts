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
    rectangles: shapes.map(shape => ({
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: (shape as any).width || 100,
      height: (shape as any).height || 100,
      fill: (shape as any).fill || '#000000',
    })),
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
 * Parse color names to hex values for common colors
 */
export function parseColorName(colorName: string): string {
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

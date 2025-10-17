import { type CanvasObjectData } from '../components/CanvasObject';
import { type CanvasState } from '../types/ai';

/**
 * Get current canvas state for AI context
 * Returns basic rectangle positions and types for AI decision making
 */
export function getCanvasState(rectangles: CanvasObjectData[]): CanvasState {
  return {
    rectangles: rectangles.map(rectangle => ({
      id: rectangle.id,
      x: rectangle.x,
      y: rectangle.y,
      width: rectangle.width,
      height: rectangle.height,
      fill: rectangle.fill,
    })),
    canvasSize: {
      width: 1200, // Default canvas size - could be made dynamic
      height: 800,
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

import type { Shape } from '../types/shapes';
import { type CanvasState } from '../types/ai';
import { CANVAS_CONFIG } from '../hooks/useCanvas';

/**
 * Get current canvas state for AI context
 * Returns shapes categorized by type for AI decision making
 */
export function getCanvasState(
  shapes: Shape[], 
  canvasSize?: { width: number; height: number }
): CanvasState {
  // Separate shapes by type and filter out invalid data
  const rectangles = shapes
    .filter(shape => {
      if (shape.type !== 'rectangle') return false;
      // Only include rectangles with valid width and height
      const width = (shape as any).width;
      const height = (shape as any).height;
      return typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0;
    })
    .map(shape => ({
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: (shape as any).width,
      height: (shape as any).height,
      fill: (shape as any).fill || (shape as any).stroke || '#000000',
    }));

  const circles = shapes
    .filter(shape => {
      if (shape.type !== 'circle') return false;
      // Only include circles with valid radius
      const radius = (shape as any).radius;
      return typeof radius === 'number' && radius > 0;
    })
    .map(shape => ({
      id: shape.id,
      x: shape.x,
      y: shape.y,
      radius: (shape as any).radius,
      fill: (shape as any).fill || (shape as any).stroke || '#000000',
    }));

  const lines = shapes
    .filter(shape => {
      if (shape.type !== 'line') return false;
      // Only include lines with valid endpoints
      const x2 = (shape as any).x2;
      const y2 = (shape as any).y2;
      return typeof x2 === 'number' && typeof y2 === 'number';
    })
    .map(shape => ({
      id: shape.id,
      x: shape.x,
      y: shape.y,
      x2: (shape as any).x2,
      y2: (shape as any).y2,
      stroke: (shape as any).stroke || '#000000',
    }));

  const texts = shapes
    .filter(shape => {
      if (shape.type !== 'text') return false;
      // Only include texts with valid text content
      const text = (shape as any).text;
      return typeof text === 'string';
    })
    .map(shape => ({
      id: shape.id,
      x: shape.x,
      y: shape.y,
      text: (shape as any).text,
      fontSize: typeof (shape as any).fontSize === 'number' ? (shape as any).fontSize : 16,
      fill: (shape as any).fill || '#000000',
    }));

  return {
    rectangles,
    circles,
    lines,
    texts,
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

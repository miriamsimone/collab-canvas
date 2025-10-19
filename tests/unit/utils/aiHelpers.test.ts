import { describe, it, expect } from 'vitest';
import { 
  getCanvasState, 
  validateCreateRectangleParams, 
  generateCommandId, 
  parseColorName 
} from '../../../src/utils/aiHelpers';
import type { Shape } from '../../../src/types/shapes';

describe('AI Helpers', () => {
  describe('getCanvasState', () => {
    it('should return canvas state with rectangles and canvas size', () => {
      const shapes: Shape[] = [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 150,
          width: 120,
          height: 80,
          fill: '#ff0000',
          stroke: '#ff0000',
          strokeWidth: 2,
          zIndex: 1,
          createdBy: 'user-1',
          createdAt: Date.now(),
        },
        {
          id: 'rect-2',
          type: 'rectangle',
          x: 300,
          y: 200,
          width: 100,
          height: 100,
          fill: '#0000ff',
          stroke: '#0000ff',
          strokeWidth: 2,
          zIndex: 2,
          createdBy: 'user-1',
          createdAt: Date.now(),
        },
      ];

      const canvasState = getCanvasState(shapes);

      expect(canvasState.rectangles).toHaveLength(2);
      expect(canvasState.rectangles[0]).toEqual({
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 150,
        width: 120,
        height: 80,
        fill: '#ff0000',
      });
      expect(canvasState.canvasSize).toEqual({
        width: 5000,
        height: 5000,
      });
    });

    it('should handle empty rectangles array', () => {
      const canvasState = getCanvasState([]);

      expect(canvasState.rectangles).toHaveLength(0);
      expect(canvasState.canvasSize).toEqual({
        width: 5000,
        height: 5000,
      });
    });

    it('should handle circles with radius', () => {
      const shapes: Shape[] = [
        {
          id: 'circle-1',
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          fill: '#3b82f6',
          stroke: '#3b82f6',
          strokeWidth: 2,
          zIndex: 1,
          createdBy: 'user-1',
          createdAt: Date.now(),
        },
      ];

      const canvasState = getCanvasState(shapes);

      expect(canvasState.rectangles).toHaveLength(1);
      expect(canvasState.rectangles[0]).toEqual({
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        fill: '#3b82f6',
      });
    });
  });

  describe('validateCreateRectangleParams', () => {
    it('should validate correct rectangle parameters', () => {
      const params = {
        x: 100,
        y: 150,
        width: 120,
        height: 80,
        color: '#ff0000',
      };

      const result = validateCreateRectangleParams(params);

      expect(result.isValid).toBe(true);
      expect(result.validated).toEqual({
        x: 100,
        y: 150,
        width: 120,
        height: 80,
        color: '#ff0000',
      });
    });

    it('should reject negative coordinates', () => {
      const params = {
        x: -10,
        y: 150,
        width: 120,
        height: 80,
        color: '#ff0000',
      };

      const result = validateCreateRectangleParams(params);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('coordinates must be non-negative');
    });

    it('should reject non-positive dimensions', () => {
      const params = {
        x: 100,
        y: 150,
        width: 0,
        height: 80,
        color: '#ff0000',
      };

      const result = validateCreateRectangleParams(params);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('width and height must be positive');
    });

    it('should reject invalid color format', () => {
      const params = {
        x: 100,
        y: 150,
        width: 120,
        height: 80,
        color: 'invalid-color',
      };

      const result = validateCreateRectangleParams(params);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('color must be a valid hex color');
    });

    it('should reject missing required fields', () => {
      const params = {
        x: 100,
        y: 150,
        // missing width, height, color
      };

      const result = validateCreateRectangleParams(params);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('width and height must be numbers');
    });

    it('should round decimal coordinates', () => {
      const params = {
        x: 100.7,
        y: 150.3,
        width: 120.9,
        height: 80.1,
        color: '#FF0000',
      };

      const result = validateCreateRectangleParams(params);

      expect(result.isValid).toBe(true);
      expect(result.validated).toEqual({
        x: 101,
        y: 150,
        width: 121,
        height: 80,
        color: '#ff0000',
      });
    });
  });

  describe('generateCommandId', () => {
    it('should generate unique command IDs', () => {
      const id1 = generateCommandId();
      const id2 = generateCommandId();

      expect(id1).toMatch(/^ai-cmd-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^ai-cmd-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('parseColorName', () => {
    it('should convert common color names to hex (8 colors)', () => {
      expect(parseColorName('red')).toBe('#ef4444');
      expect(parseColorName('blue')).toBe('#3b82f6');
      expect(parseColorName('green')).toBe('#10b981');
      expect(parseColorName('yellow')).toBe('#f59e0b');
      expect(parseColorName('purple')).toBe('#8b5cf6');
      expect(parseColorName('orange')).toBe('#f97316');
      expect(parseColorName('black')).toBe('#000000');
    });

    it('should handle case insensitive color names', () => {
      expect(parseColorName('RED')).toBe('#ef4444');
      expect(parseColorName('Blue')).toBe('#3b82f6');
      expect(parseColorName('GREEN')).toBe('#10b981');
    });

    it('should handle color names with extra whitespace', () => {
      expect(parseColorName('  red  ')).toBe('#ef4444');
      expect(parseColorName(' blue ')).toBe('#3b82f6');
    });

    it('should return palette colors if they are provided as hex', () => {
      expect(parseColorName('#3b82f6')).toBe('#3b82f6'); // blue
      expect(parseColorName('#ef4444')).toBe('#ef4444'); // red
    });

    it('should default to blue for non-palette hex colors', () => {
      expect(parseColorName('#aabbcc')).toBe('#3b82f6');
      expect(parseColorName('#AABBCC')).toBe('#3b82f6');
    });

    it('should default to blue for unknown colors', () => {
      expect(parseColorName('unknown-color')).toBe('#3b82f6');
      expect(parseColorName('cyan')).toBe('#3b82f6');
    });

    it('should map common hex colors to palette colors', () => {
      expect(parseColorName('#ff0000')).toBe('#ef4444'); // red
      expect(parseColorName('#0000ff')).toBe('#3b82f6'); // blue
      expect(parseColorName('#00ff00')).toBe('#10b981'); // green
      expect(parseColorName('#ffc0cb')).toBe('#ef4444'); // pink -> red
    });

    it('should handle both gray and grey spelling', () => {
      expect(parseColorName('gray')).toBe('#6b7280');
      expect(parseColorName('grey')).toBe('#6b7280');
    });
  });
});

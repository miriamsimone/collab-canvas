import { describe, it, expect } from 'vitest';
import { 
  getCanvasState, 
  validateCreateRectangleParams, 
  generateCommandId, 
  parseColorName 
} from '../../../src/utils/aiHelpers';
import { type CanvasObjectData } from '../../../src/components/CanvasObject';

describe('AI Helpers', () => {
  describe('getCanvasState', () => {
    it('should return canvas state with rectangles and canvas size', () => {
      const rectangles: CanvasObjectData[] = [
        {
          id: 'rect-1',
          x: 100,
          y: 150,
          width: 120,
          height: 80,
          fill: '#ff0000',
          stroke: '#ff0000',
          strokeWidth: 2,
        },
        {
          id: 'rect-2',
          x: 300,
          y: 200,
          width: 100,
          height: 100,
          fill: '#0000ff',
          stroke: '#0000ff',
          strokeWidth: 2,
        },
      ];

      const canvasState = getCanvasState(rectangles);

      expect(canvasState.rectangles).toHaveLength(2);
      expect(canvasState.rectangles[0]).toEqual({
        id: 'rect-1',
        x: 100,
        y: 150,
        width: 120,
        height: 80,
        fill: '#ff0000',
      });
      expect(canvasState.canvasSize).toEqual({
        width: 1200,
        height: 800,
      });
    });

    it('should handle empty rectangles array', () => {
      const canvasState = getCanvasState([]);

      expect(canvasState.rectangles).toHaveLength(0);
      expect(canvasState.canvasSize).toEqual({
        width: 1200,
        height: 800,
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
    it('should convert common color names to hex', () => {
      expect(parseColorName('red')).toBe('#ff0000');
      expect(parseColorName('blue')).toBe('#0000ff');
      expect(parseColorName('green')).toBe('#00ff00');
      expect(parseColorName('yellow')).toBe('#ffff00');
      expect(parseColorName('white')).toBe('#ffffff');
      expect(parseColorName('black')).toBe('#000000');
    });

    it('should handle case insensitive color names', () => {
      expect(parseColorName('RED')).toBe('#ff0000');
      expect(parseColorName('Blue')).toBe('#0000ff');
      expect(parseColorName('GREEN')).toBe('#00ff00');
    });

    it('should handle color names with extra whitespace', () => {
      expect(parseColorName('  red  ')).toBe('#ff0000');
      expect(parseColorName(' blue ')).toBe('#0000ff');
    });

    it('should return original value for unknown colors', () => {
      expect(parseColorName('#custom')).toBe('#custom');
      expect(parseColorName('unknown-color')).toBe('unknown-color');
    });

    it('should handle both gray and grey spelling', () => {
      expect(parseColorName('gray')).toBe('#808080');
      expect(parseColorName('grey')).toBe('#808080');
    });
  });
});

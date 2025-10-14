import { describe, it, expect } from 'vitest';
import {
  screenToCanvas,
  canvasToScreen,
  isPointInCanvas,
  clampToCanvas,
  distance,
  getRectCenter,
  generateGridLines,
  snapToGrid,
  snapPointToGrid,
  type Point,
  type CanvasTransform,
} from '../../../src/utils/canvasHelpers';

describe('canvasHelpers', () => {
  describe('screenToCanvas', () => {
    it('should convert screen coordinates to canvas coordinates', () => {
      const screenPoint: Point = { x: 100, y: 100 };
      const transform: CanvasTransform = { x: 50, y: 50, scaleX: 2, scaleY: 2 };
      
      const result = screenToCanvas(screenPoint, transform);
      
      expect(result).toEqual({ x: 25, y: 25 });
    });

    it('should handle negative positions', () => {
      const screenPoint: Point = { x: 0, y: 0 };
      const transform: CanvasTransform = { x: -100, y: -100, scaleX: 1, scaleY: 1 };
      
      const result = screenToCanvas(screenPoint, transform);
      
      expect(result).toEqual({ x: 100, y: 100 });
    });
  });

  describe('canvasToScreen', () => {
    it('should convert canvas coordinates to screen coordinates', () => {
      const canvasPoint: Point = { x: 25, y: 25 };
      const transform: CanvasTransform = { x: 50, y: 50, scaleX: 2, scaleY: 2 };
      
      const result = canvasToScreen(canvasPoint, transform);
      
      expect(result).toEqual({ x: 100, y: 100 });
    });
  });

  describe('screenToCanvas and canvasToScreen', () => {
    it('should be inverse operations', () => {
      const originalPoint: Point = { x: 150, y: 200 };
      const transform: CanvasTransform = { x: 30, y: 40, scaleX: 1.5, scaleY: 1.8 };
      
      const canvasPoint = screenToCanvas(originalPoint, transform);
      const backToScreen = canvasToScreen(canvasPoint, transform);
      
      expect(backToScreen.x).toBeCloseTo(originalPoint.x, 10);
      expect(backToScreen.y).toBeCloseTo(originalPoint.y, 10);
    });
  });

  describe('isPointInCanvas', () => {
    it('should return true for points inside canvas bounds', () => {
      const point: Point = { x: 100, y: 200 };
      expect(isPointInCanvas(point)).toBe(true);
    });

    it('should return true for points on canvas edges', () => {
      expect(isPointInCanvas({ x: 0, y: 0 })).toBe(true);
      expect(isPointInCanvas({ x: 5000, y: 5000 })).toBe(true);
    });

    it('should return false for points outside canvas bounds', () => {
      expect(isPointInCanvas({ x: -1, y: 100 })).toBe(false);
      expect(isPointInCanvas({ x: 100, y: -1 })).toBe(false);
      expect(isPointInCanvas({ x: 5001, y: 100 })).toBe(false);
      expect(isPointInCanvas({ x: 100, y: 5001 })).toBe(false);
    });
  });

  describe('clampToCanvas', () => {
    it('should not change points already within bounds', () => {
      const point: Point = { x: 100, y: 200 };
      const result = clampToCanvas(point);
      expect(result).toEqual(point);
    });

    it('should clamp negative coordinates to 0', () => {
      const point: Point = { x: -50, y: -30 };
      const result = clampToCanvas(point);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should clamp coordinates exceeding canvas size', () => {
      const point: Point = { x: 6000, y: 7000 };
      const result = clampToCanvas(point);
      expect(result).toEqual({ x: 5000, y: 5000 });
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const point1: Point = { x: 0, y: 0 };
      const point2: Point = { x: 3, y: 4 };
      
      const result = distance(point1, point2);
      expect(result).toBe(5); // 3-4-5 triangle
    });

    it('should handle identical points', () => {
      const point: Point = { x: 100, y: 200 };
      const result = distance(point, point);
      expect(result).toBe(0);
    });
  });

  describe('getRectCenter', () => {
    it('should calculate the center of a rectangle', () => {
      const result = getRectCenter(10, 20, 100, 80);
      expect(result).toEqual({ x: 60, y: 60 });
    });

    it('should handle zero-sized rectangle', () => {
      const result = getRectCenter(50, 50, 0, 0);
      expect(result).toEqual({ x: 50, y: 50 });
    });
  });

  describe('generateGridLines', () => {
    it('should generate grid lines for given size', () => {
      const result = generateGridLines(100, 500, 400);
      
      expect(result.vertical).toEqual([0, 100, 200, 300, 400, 500]);
      expect(result.horizontal).toEqual([0, 100, 200, 300, 400]);
    });

    it('should generate lines for default canvas size', () => {
      const result = generateGridLines(1000);
      
      expect(result.vertical.length).toBe(6); // 0, 1000, 2000, 3000, 4000, 5000
      expect(result.horizontal.length).toBe(6);
      expect(result.vertical[0]).toBe(0);
      expect(result.vertical[result.vertical.length - 1]).toBe(5000);
    });
  });

  describe('snapToGrid', () => {
    it('should snap coordinates to grid', () => {
      expect(snapToGrid(25, 20)).toBe(20);
      expect(snapToGrid(35, 20)).toBe(40);
      expect(snapToGrid(30, 20)).toBe(40);
    });

    it('should handle exact grid positions', () => {
      expect(snapToGrid(40, 20)).toBe(40);
      expect(snapToGrid(0, 20)).toBe(0);
    });

    it('should use default grid size', () => {
      expect(snapToGrid(25)).toBe(20); // Default grid size is 20
      expect(snapToGrid(35)).toBe(40);
    });
  });

  describe('snapPointToGrid', () => {
    it('should snap both coordinates to grid', () => {
      const point: Point = { x: 25, y: 35 };
      const result = snapPointToGrid(point, 20);
      
      expect(result).toEqual({ x: 20, y: 40 });
    });

    it('should use default grid size', () => {
      const point: Point = { x: 25, y: 35 };
      const result = snapPointToGrid(point);
      
      expect(result).toEqual({ x: 20, y: 40 });
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  isRectangleIntersecting,
  isPointInRectangle,
  calculateBoundingBox,
  findObjectsInSelection,
  findObjectsByColor,
  findObjectsByPosition,
  calculateSelectionCenter,
  moveObjectsByDelta,
  validateSelection,
  calculateDuplicateOffset,
  canPerformBulkOperation,
} from '../../../src/utils/selectionHelpers';
import { CanvasObjectData } from '../../../src/components/CanvasObject';

// Mock test data
const mockRectangles: CanvasObjectData[] = [
  {
    id: 'rect1',
    x: 100,
    y: 100,
    width: 150,
    height: 100,
    fill: '#ff000020', // Red with transparency
    stroke: '#ff0000',
    strokeWidth: 2,
  },
  {
    id: 'rect2',
    x: 300,
    y: 200,
    width: 120,
    height: 80,
    fill: '#00ff0020', // Green with transparency
    stroke: '#00ff00',
    strokeWidth: 2,
  },
  {
    id: 'rect3',
    x: 500,
    y: 150,
    width: 100,
    height: 150,
    fill: '#0000ff20', // Blue with transparency
    stroke: '#0000ff',
    strokeWidth: 2,
  },
];

describe('selectionHelpers', () => {
  describe('isRectangleIntersecting', () => {
    it('should detect intersecting rectangles', () => {
      const rect1 = { x: 100, y: 100, width: 100, height: 100 };
      const rect2 = { x: 150, y: 150, width: 100, height: 100 };
      
      expect(isRectangleIntersecting(rect1, rect2)).toBe(true);
    });

    it('should detect non-intersecting rectangles', () => {
      const rect1 = { x: 100, y: 100, width: 50, height: 50 };
      const rect2 = { x: 200, y: 200, width: 50, height: 50 };
      
      expect(isRectangleIntersecting(rect1, rect2)).toBe(false);
    });

    it('should detect touching rectangles as intersecting', () => {
      const rect1 = { x: 100, y: 100, width: 100, height: 100 };
      const rect2 = { x: 200, y: 100, width: 100, height: 100 };
      
      expect(isRectangleIntersecting(rect1, rect2)).toBe(true);
    });
  });

  describe('isPointInRectangle', () => {
    it('should detect point inside rectangle', () => {
      const point = { x: 150, y: 150 };
      const rect = { x: 100, y: 100, width: 100, height: 100 };
      
      expect(isPointInRectangle(point, rect)).toBe(true);
    });

    it('should detect point outside rectangle', () => {
      const point = { x: 50, y: 50 };
      const rect = { x: 100, y: 100, width: 100, height: 100 };
      
      expect(isPointInRectangle(point, rect)).toBe(false);
    });

    it('should detect point on rectangle border', () => {
      const point = { x: 100, y: 100 };
      const rect = { x: 100, y: 100, width: 100, height: 100 };
      
      expect(isPointInRectangle(point, rect)).toBe(true);
    });
  });

  describe('calculateBoundingBox', () => {
    it('should return null for empty array', () => {
      expect(calculateBoundingBox([])).toBeNull();
    });

    it('should return object bounds for single object', () => {
      const bounds = calculateBoundingBox([mockRectangles[0]]);
      
      expect(bounds).toEqual({
        x: 100,
        y: 100,
        width: 150,
        height: 100,
      });
    });

    it('should calculate correct bounds for multiple objects', () => {
      const bounds = calculateBoundingBox(mockRectangles);
      
      expect(bounds).toEqual({
        x: 100, // leftmost
        y: 100, // topmost
        width: 500, // rightmost (600) - leftmost (100)
        height: 200, // bottommost (300) - topmost (100)
      });
    });
  });

  describe('findObjectsInSelection', () => {
    it('should find objects intersecting with selection rectangle', () => {
      const selectionRect = { x: 90, y: 90, width: 200, height: 200 };
      const foundObjects = findObjectsInSelection(mockRectangles, selectionRect);
      
      expect(foundObjects).toHaveLength(2);
      expect(foundObjects.map(obj => obj.id)).toContain('rect1');
      expect(foundObjects.map(obj => obj.id)).toContain('rect2');
    });

    it('should return empty array when no objects intersect', () => {
      const selectionRect = { x: 0, y: 0, width: 50, height: 50 };
      const foundObjects = findObjectsInSelection(mockRectangles, selectionRect);
      
      expect(foundObjects).toHaveLength(0);
    });
  });

  describe('findObjectsByColor', () => {
    it('should find objects by fill color', () => {
      const redObjects = findObjectsByColor(mockRectangles, 'ff0000');
      
      expect(redObjects).toHaveLength(1);
      expect(redObjects[0].id).toBe('rect1');
    });

    it('should find objects by stroke color', () => {
      const greenObjects = findObjectsByColor(mockRectangles, '00ff00');
      
      expect(greenObjects).toHaveLength(1);
      expect(greenObjects[0].id).toBe('rect2');
    });

    it('should handle color format variations', () => {
      const redObjects1 = findObjectsByColor(mockRectangles, '#ff0000');
      const redObjects2 = findObjectsByColor(mockRectangles, 'FF0000');
      
      expect(redObjects1).toHaveLength(1);
      expect(redObjects2).toHaveLength(1);
      expect(redObjects1[0].id).toBe(redObjects2[0].id);
    });
  });

  describe('findObjectsByPosition', () => {
    const canvasSize = { width: 800, height: 600 };

    it('should find objects in top half', () => {
      const topObjects = findObjectsByPosition(mockRectangles, 'top-half', canvasSize);
      
      // rect1: center y = 150, rect3: center y = 225, both < 300 (half of 600)
      expect(topObjects).toHaveLength(2);
      expect(topObjects.map(obj => obj.id)).toContain('rect1');
      expect(topObjects.map(obj => obj.id)).toContain('rect3');
    });

    it('should find objects in left half', () => {
      const leftObjects = findObjectsByPosition(mockRectangles, 'left-half', canvasSize);
      
      // rect1: center x = 175, rect2: center x = 360, both < 400 (half of 800)
      expect(leftObjects).toHaveLength(2);
      expect(leftObjects.map(obj => obj.id)).toContain('rect1');
      expect(leftObjects.map(obj => obj.id)).toContain('rect2');
    });

    it('should find objects in right half', () => {
      const rightObjects = findObjectsByPosition(mockRectangles, 'right-half', canvasSize);
      
      // rect3: center x = 550, > 400 (half of 800)
      expect(rightObjects).toHaveLength(1);
      expect(rightObjects[0].id).toBe('rect3');
    });
  });

  describe('calculateSelectionCenter', () => {
    it('should return null for empty array', () => {
      expect(calculateSelectionCenter([])).toBeNull();
    });

    it('should calculate center for single object', () => {
      const center = calculateSelectionCenter([mockRectangles[0]]);
      
      expect(center).toEqual({
        x: 175, // 100 + 150/2
        y: 150, // 100 + 100/2
      });
    });

    it('should calculate center for multiple objects', () => {
      const center = calculateSelectionCenter(mockRectangles);
      
      expect(center).toEqual({
        x: 350, // bounds center: 100 + 500/2
        y: 200, // bounds center: 100 + 200/2
      });
    });
  });

  describe('moveObjectsByDelta', () => {
    it('should move objects by specified delta', () => {
      const movedObjects = moveObjectsByDelta([mockRectangles[0]], 50, -25);
      
      expect(movedObjects[0]).toEqual({
        ...mockRectangles[0],
        x: 150, // 100 + 50
        y: 75,  // 100 - 25
      });
    });

    it('should handle empty array', () => {
      const movedObjects = moveObjectsByDelta([], 10, 10);
      expect(movedObjects).toHaveLength(0);
    });
  });

  describe('validateSelection', () => {
    it('should validate existing object IDs', () => {
      const isValid = validateSelection(mockRectangles, ['rect1', 'rect2']);
      expect(isValid).toBe(true);
    });

    it('should invalidate non-existing object IDs', () => {
      const isValid = validateSelection(mockRectangles, ['rect1', 'nonexistent']);
      expect(isValid).toBe(false);
    });

    it('should handle empty selection', () => {
      const isValid = validateSelection(mockRectangles, []);
      expect(isValid).toBe(true);
    });
  });

  describe('calculateDuplicateOffset', () => {
    it('should calculate base offset', () => {
      const offset = calculateDuplicateOffset();
      expect(offset).toEqual({ x: 20, y: 20 });
    });

    it('should calculate progressive offset', () => {
      const offset1 = calculateDuplicateOffset(1);
      const offset2 = calculateDuplicateOffset(2);
      
      expect(offset1).toEqual({ x: 30, y: 30 }); // 20 + 10*1
      expect(offset2).toEqual({ x: 40, y: 40 }); // 20 + 10*2
    });
  });

  describe('canPerformBulkOperation', () => {
    it('should allow bulk operations with selected objects', () => {
      expect(canPerformBulkOperation([mockRectangles[0]])).toBe(true);
      expect(canPerformBulkOperation(mockRectangles)).toBe(true);
    });

    it('should not allow bulk operations with no objects', () => {
      expect(canPerformBulkOperation([])).toBe(false);
    });
  });
});

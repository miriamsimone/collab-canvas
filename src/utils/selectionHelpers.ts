import { CanvasObjectData } from '../components/CanvasObject';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if a rectangle intersects with another rectangle
 */
export const isRectangleIntersecting = (rect1: Rectangle, rect2: Rectangle): boolean => {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
};

/**
 * Check if a point is inside a rectangle
 */
export const isPointInRectangle = (point: { x: number; y: number }, rect: Rectangle): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * Calculate the bounding box that contains all given objects
 */
export const calculateBoundingBox = (objects: CanvasObjectData[]): SelectionBounds | null => {
  if (objects.length === 0) {
    return null;
  }

  if (objects.length === 1) {
    const obj = objects[0];
    return {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach(obj => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Find objects within a selection rectangle
 */
export const findObjectsInSelection = (
  objects: CanvasObjectData[], 
  selectionRect: Rectangle
): CanvasObjectData[] => {
  return objects.filter(obj => isRectangleIntersecting(obj, selectionRect));
};

/**
 * Find objects by color (checks both fill and stroke)
 */
export const findObjectsByColor = (objects: CanvasObjectData[], color: string): CanvasObjectData[] => {
  const normalizeColor = (c: string) => c.toLowerCase().replace(/[^a-f0-9]/g, '');
  const targetColor = normalizeColor(color);

  return objects.filter(obj => {
    const objFill = normalizeColor(obj.fill);
    const objStroke = normalizeColor(obj.stroke);
    return objFill.includes(targetColor) || objStroke.includes(targetColor);
  });
};

/**
 * Find objects by position criteria
 */
export const findObjectsByPosition = (
  objects: CanvasObjectData[],
  criteria: 'top-half' | 'bottom-half' | 'left-half' | 'right-half',
  canvasSize: { width: number; height: number }
): CanvasObjectData[] => {
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;

  return objects.filter(obj => {
    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;

    switch (criteria) {
      case 'top-half':
        return objCenterY < centerY;
      case 'bottom-half':
        return objCenterY > centerY;
      case 'left-half':
        return objCenterX < centerX;
      case 'right-half':
        return objCenterX > centerX;
      default:
        return false;
    }
  });
};

/**
 * Calculate center point of multiple objects
 */
export const calculateSelectionCenter = (objects: CanvasObjectData[]): { x: number; y: number } | null => {
  if (objects.length === 0) {
    return null;
  }

  const bounds = calculateBoundingBox(objects);
  if (!bounds) {
    return null;
  }

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
};

/**
 * Move multiple objects by a delta
 */
export const moveObjectsByDelta = (
  objects: CanvasObjectData[], 
  deltaX: number, 
  deltaY: number
): CanvasObjectData[] => {
  return objects.map(obj => ({
    ...obj,
    x: obj.x + deltaX,
    y: obj.y + deltaY,
  }));
};

/**
 * Validate if objects can be selected (basic validation)
 */
export const validateSelection = (objects: CanvasObjectData[], objectIds: string[]): boolean => {
  const existingIds = new Set(objects.map(obj => obj.id));
  return objectIds.every(id => existingIds.has(id));
};

/**
 * Get objects sorted by z-index or creation order
 */
export const sortObjectsByLayer = (objects: CanvasObjectData[]): CanvasObjectData[] => {
  // For now, maintain original order (first created = bottom layer)
  // This can be extended when z-index is implemented
  return [...objects];
};

/**
 * Calculate offset for duplicate operation to avoid exact overlap
 */
export const calculateDuplicateOffset = (index: number = 0): { x: number; y: number } => {
  const baseOffset = 20;
  return {
    x: baseOffset + (index * 10),
    y: baseOffset + (index * 10),
  };
};

/**
 * Check if selection is valid for bulk operations
 */
export const canPerformBulkOperation = (selectedObjects: CanvasObjectData[]): boolean => {
  return selectedObjects.length > 0;
};

/**
 * Group objects by type (useful for type-specific operations)
 */
export const groupObjectsByType = (objects: CanvasObjectData[]): Record<string, CanvasObjectData[]> => {
  // For now, all objects are rectangles, but this will be useful when we add more shapes
  return {
    rectangle: objects, // All current objects are rectangles
  };
};

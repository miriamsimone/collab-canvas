import { Shape, getShapeBounds, getShapeCenter } from '../types/shapes';

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
export const calculateBoundingBox = (objects: Shape[]): SelectionBounds | null => {
  if (objects.length === 0) {
    return null;
  }

  if (objects.length === 1) {
    const obj = objects[0];
    const bounds = getShapeBounds(obj);
    return bounds;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach(obj => {
    const bounds = getShapeBounds(obj);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
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
  objects: Shape[], 
  selectionRect: Rectangle
): Shape[] => {
  return objects.filter(obj => {
    const bounds = getShapeBounds(obj);
    return isRectangleIntersecting(bounds, selectionRect);
  });
};

/**
 * Find objects by color (checks both fill and stroke)
 */
export const findObjectsByColor = (objects: Shape[], color: string): Shape[] => {
  const normalizeColor = (c: string) => c.toLowerCase().replace(/[^a-f0-9]/g, '');
  const targetColor = normalizeColor(color);

  return objects.filter(obj => {
    // Handle different shape types and their color properties
    let objFill = '';
    let objStroke = '';
    
    if (obj.type === 'rectangle' || obj.type === 'circle') {
      objFill = normalizeColor(obj.fill);
      objStroke = normalizeColor(obj.stroke);
    } else if (obj.type === 'line') {
      objStroke = normalizeColor(obj.stroke);
    } else if (obj.type === 'text') {
      objFill = normalizeColor(obj.fill);
      if (obj.stroke) {
        objStroke = normalizeColor(obj.stroke);
      }
    }
    
    return objFill.includes(targetColor) || objStroke.includes(targetColor);
  });
};

/**
 * Find objects by position criteria
 */
export const findObjectsByPosition = (
  objects: Shape[],
  criteria: 'top-half' | 'bottom-half' | 'left-half' | 'right-half',
  canvasSize: { width: number; height: number }
): Shape[] => {
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;

  return objects.filter(obj => {
    const center = getShapeCenter(obj);

    switch (criteria) {
      case 'top-half':
        return center.y < centerY;
      case 'bottom-half':
        return center.y > centerY;
      case 'left-half':
        return center.x < centerX;
      case 'right-half':
        return center.x > centerX;
      default:
        return false;
    }
  });
};

/**
 * Calculate center point of multiple objects
 */
export const calculateSelectionCenter = (objects: Shape[]): { x: number; y: number } | null => {
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
  objects: Shape[], 
  deltaX: number, 
  deltaY: number
): Shape[] => {
  return objects.map(obj => ({
    ...obj,
    x: obj.x + deltaX,
    y: obj.y + deltaY,
    // Handle line endpoints
    ...(obj.type === 'line' && {
      x2: obj.x2 + deltaX,
      y2: obj.y2 + deltaY,
    }),
  }));
};

/**
 * Validate if objects can be selected (basic validation)
 */
export const validateSelection = (objects: Shape[], objectIds: string[]): boolean => {
  const existingIds = new Set(objects.map(obj => obj.id));
  return objectIds.every(id => existingIds.has(id));
};

/**
 * Get objects sorted by z-index or creation order
 */
export const sortObjectsByLayer = (objects: Shape[]): Shape[] => {
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
export const canPerformBulkOperation = (selectedObjects: Shape[]): boolean => {
  return selectedObjects.length > 0;
};

/**
 * Group objects by type (useful for type-specific operations)
 */
export const groupObjectsByType = (objects: Shape[]): Record<string, Shape[]> => {
  const groups: Record<string, Shape[]> = {
    rectangle: [],
    circle: [],
    line: [],
    text: [],
  };

  objects.forEach(obj => {
    if (groups[obj.type]) {
      groups[obj.type].push(obj);
    }
  });

  return groups;
};

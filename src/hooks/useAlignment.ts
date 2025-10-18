import { useCallback } from 'react';
import type { Shape } from '../types/shapes';

export interface AlignmentUpdate {
  shapeId: string;
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
}

export interface AlignmentOperations {
  alignLeft: (shapes: Shape[]) => AlignmentUpdate[];
  alignCenter: (shapes: Shape[]) => AlignmentUpdate[];
  alignRight: (shapes: Shape[]) => AlignmentUpdate[];
  alignTop: (shapes: Shape[]) => AlignmentUpdate[];
  alignMiddle: (shapes: Shape[]) => AlignmentUpdate[];
  alignBottom: (shapes: Shape[]) => AlignmentUpdate[];
  distributeHorizontally: (shapes: Shape[]) => AlignmentUpdate[];
  distributeVertically: (shapes: Shape[]) => AlignmentUpdate[];
}

/**
 * Get the bounding box for a shape (accounting for different shape types)
 */
const getShapeBounds = (shape: Shape) => {
  switch (shape.type) {
    case 'rectangle':
      return {
        left: shape.x,
        right: shape.x + shape.width,
        top: shape.y,
        bottom: shape.y + shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2,
        width: shape.width,
        height: shape.height,
      };
    case 'circle':
      return {
        left: shape.x - shape.radius,
        right: shape.x + shape.radius,
        top: shape.y - shape.radius,
        bottom: shape.y + shape.radius,
        centerX: shape.x,
        centerY: shape.y,
        width: shape.radius * 2,
        height: shape.radius * 2,
      };
    case 'line':
      const left = Math.min(shape.x, shape.x2);
      const right = Math.max(shape.x, shape.x2);
      const top = Math.min(shape.y, shape.y2);
      const bottom = Math.max(shape.y, shape.y2);
      return {
        left,
        right,
        top,
        bottom,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
        width: right - left,
        height: bottom - top,
      };
    case 'text':
      const width = shape.width || 100;
      const height = shape.height || 24;
      return {
        left: shape.x,
        right: shape.x + width,
        top: shape.y,
        bottom: shape.y + height,
        centerX: shape.x + width / 2,
        centerY: shape.y + height / 2,
        width,
        height,
      };
  }
};

/**
 * Hook for managing shape alignment and distribution
 */
export const useAlignment = (): AlignmentOperations => {
  /**
   * Align shapes to the left edge
   */
  const alignLeft = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 2) return [];

    // Find the leftmost edge
    const bounds = shapes.map(getShapeBounds);
    const leftmost = Math.min(...bounds.map(b => b.left));

    // Calculate updates for each shape
    return shapes.map((shape, index) => {
      const shapeBounds = bounds[index];
      const deltaX = leftmost - shapeBounds.left;
      
      return {
        shapeId: shape.id,
        oldX: shape.x,
        oldY: shape.y,
        newX: shape.x + deltaX,
        newY: shape.y,
      };
    });
  }, []);

  /**
   * Align shapes to horizontal center
   */
  const alignCenter = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 2) return [];

    // Find the collective horizontal center
    const bounds = shapes.map(getShapeBounds);
    const leftmost = Math.min(...bounds.map(b => b.left));
    const rightmost = Math.max(...bounds.map(b => b.right));
    const center = (leftmost + rightmost) / 2;

    // Calculate updates for each shape
    return shapes.map((shape, index) => {
      const shapeBounds = bounds[index];
      const deltaX = center - shapeBounds.centerX;
      
      return {
        shapeId: shape.id,
        oldX: shape.x,
        oldY: shape.y,
        newX: shape.x + deltaX,
        newY: shape.y,
      };
    });
  }, []);

  /**
   * Align shapes to the right edge
   */
  const alignRight = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 2) return [];

    // Find the rightmost edge
    const bounds = shapes.map(getShapeBounds);
    const rightmost = Math.max(...bounds.map(b => b.right));

    // Calculate updates for each shape
    return shapes.map((shape, index) => {
      const shapeBounds = bounds[index];
      const deltaX = rightmost - shapeBounds.right;
      
      return {
        shapeId: shape.id,
        oldX: shape.x,
        oldY: shape.y,
        newX: shape.x + deltaX,
        newY: shape.y,
      };
    });
  }, []);

  /**
   * Align shapes to the top edge
   */
  const alignTop = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 2) return [];

    // Find the topmost edge
    const bounds = shapes.map(getShapeBounds);
    const topmost = Math.min(...bounds.map(b => b.top));

    // Calculate updates for each shape
    return shapes.map((shape, index) => {
      const shapeBounds = bounds[index];
      const deltaY = topmost - shapeBounds.top;
      
      return {
        shapeId: shape.id,
        oldX: shape.x,
        oldY: shape.y,
        newX: shape.x,
        newY: shape.y + deltaY,
      };
    });
  }, []);

  /**
   * Align shapes to vertical middle
   */
  const alignMiddle = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 2) return [];

    // Find the collective vertical center
    const bounds = shapes.map(getShapeBounds);
    const topmost = Math.min(...bounds.map(b => b.top));
    const bottommost = Math.max(...bounds.map(b => b.bottom));
    const middle = (topmost + bottommost) / 2;

    // Calculate updates for each shape
    return shapes.map((shape, index) => {
      const shapeBounds = bounds[index];
      const deltaY = middle - shapeBounds.centerY;
      
      return {
        shapeId: shape.id,
        oldX: shape.x,
        oldY: shape.y,
        newX: shape.x,
        newY: shape.y + deltaY,
      };
    });
  }, []);

  /**
   * Align shapes to the bottom edge
   */
  const alignBottom = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 2) return [];

    // Find the bottommost edge
    const bounds = shapes.map(getShapeBounds);
    const bottommost = Math.max(...bounds.map(b => b.bottom));

    // Calculate updates for each shape
    return shapes.map((shape, index) => {
      const shapeBounds = bounds[index];
      const deltaY = bottommost - shapeBounds.bottom;
      
      return {
        shapeId: shape.id,
        oldX: shape.x,
        oldY: shape.y,
        newX: shape.x,
        newY: shape.y + deltaY,
      };
    });
  }, []);

  /**
   * Distribute shapes evenly along the horizontal axis
   */
  const distributeHorizontally = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 3) return [];

    const bounds = shapes.map((shape, index) => ({
      shape,
      index,
      bounds: getShapeBounds(shape),
    }));

    // Sort by horizontal position
    bounds.sort((a, b) => a.bounds.left - b.bounds.left);

    // Calculate the total space and gaps
    const leftmost = bounds[0].bounds.left;
    const rightmost = bounds[bounds.length - 1].bounds.right;
    const totalWidth = bounds.reduce((sum, item) => sum + item.bounds.width, 0);
    const totalGapSpace = rightmost - leftmost - totalWidth;
    const gapSize = totalGapSpace / (bounds.length - 1);

    // Calculate new positions
    let currentX = leftmost;
    const updates: AlignmentUpdate[] = [];

    for (let i = 0; i < bounds.length; i++) {
      const item = bounds[i];
      
      // Skip first and last (they stay in place)
      if (i === 0 || i === bounds.length - 1) {
        currentX += item.bounds.width + gapSize;
        continue;
      }

      const deltaX = currentX - item.bounds.left;
      updates.push({
        shapeId: item.shape.id,
        oldX: item.shape.x,
        oldY: item.shape.y,
        newX: item.shape.x + deltaX,
        newY: item.shape.y,
      });

      currentX += item.bounds.width + gapSize;
    }

    return updates;
  }, []);

  /**
   * Distribute shapes evenly along the vertical axis
   */
  const distributeVertically = useCallback((shapes: Shape[]): AlignmentUpdate[] => {
    if (shapes.length < 3) return [];

    const bounds = shapes.map((shape, index) => ({
      shape,
      index,
      bounds: getShapeBounds(shape),
    }));

    // Sort by vertical position
    bounds.sort((a, b) => a.bounds.top - b.bounds.top);

    // Calculate the total space and gaps
    const topmost = bounds[0].bounds.top;
    const bottommost = bounds[bounds.length - 1].bounds.bottom;
    const totalHeight = bounds.reduce((sum, item) => sum + item.bounds.height, 0);
    const totalGapSpace = bottommost - topmost - totalHeight;
    const gapSize = totalGapSpace / (bounds.length - 1);

    // Calculate new positions
    let currentY = topmost;
    const updates: AlignmentUpdate[] = [];

    for (let i = 0; i < bounds.length; i++) {
      const item = bounds[i];
      
      // Skip first and last (they stay in place)
      if (i === 0 || i === bounds.length - 1) {
        currentY += item.bounds.height + gapSize;
        continue;
      }

      const deltaY = currentY - item.bounds.top;
      updates.push({
        shapeId: item.shape.id,
        oldX: item.shape.x,
        oldY: item.shape.y,
        newX: item.shape.x,
        newY: item.shape.y + deltaY,
      });

      currentY += item.bounds.height + gapSize;
    }

    return updates;
  }, []);

  return {
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
  };
};


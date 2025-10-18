import { useCallback } from 'react';
import type { Shape } from '../types/shapes';

export interface ZIndexOperations {
  bringToFront: (shapeIds: string[], shapes: Shape[]) => { updates: Array<{ shapeId: string; oldZIndex: number; newZIndex: number }> };
  sendToBack: (shapeIds: string[], shapes: Shape[]) => { updates: Array<{ shapeId: string; oldZIndex: number; newZIndex: number }> };
  bringForward: (shapeIds: string[], shapes: Shape[]) => { updates: Array<{ shapeId: string; oldZIndex: number; newZIndex: number }> };
  sendBackward: (shapeIds: string[], shapes: Shape[]) => { updates: Array<{ shapeId: string; oldZIndex: number; newZIndex: number }> };
  sortShapesByZIndex: (shapes: Shape[]) => Shape[];
}

/**
 * Hook for managing shape z-index (layer order)
 * Provides functions to reorder shapes and sort them for rendering
 */
export const useZIndex = (): ZIndexOperations => {
  /**
   * Sort shapes by z-index for proper rendering order
   * Shapes without z-index are treated as 0
   */
  const sortShapesByZIndex = useCallback((shapes: Shape[]): Shape[] => {
    return [...shapes].sort((a, b) => {
      const zIndexA = a.zIndex ?? 0;
      const zIndexB = b.zIndex ?? 0;
      return zIndexA - zIndexB;
    });
  }, []);

  /**
   * Bring selected shapes to the front (highest z-index)
   */
  const bringToFront = useCallback((shapeIds: string[], shapes: Shape[]) => {
    if (shapeIds.length === 0) {
      return { updates: [] };
    }

    // Find the current maximum z-index
    const maxZIndex = Math.max(...shapes.map(s => s.zIndex ?? 0), 0);
    
    // Create updates for all selected shapes
    const updates = shapeIds.map((id, index) => {
      const shape = shapes.find(s => s.id === id);
      const oldZIndex = shape?.zIndex ?? 0;
      const newZIndex = maxZIndex + index + 1;
      
      return {
        shapeId: id,
        oldZIndex,
        newZIndex,
      };
    });

    return { updates };
  }, []);

  /**
   * Send selected shapes to the back (lowest z-index)
   */
  const sendToBack = useCallback((shapeIds: string[], shapes: Shape[]) => {
    if (shapeIds.length === 0) {
      return { updates: [] };
    }

    // Find the current minimum z-index
    const minZIndex = Math.min(...shapes.map(s => s.zIndex ?? 0), 0);
    
    // Create updates for all selected shapes
    const updates = shapeIds.map((id, index) => {
      const shape = shapes.find(s => s.id === id);
      const oldZIndex = shape?.zIndex ?? 0;
      const newZIndex = minZIndex - shapeIds.length + index;
      
      return {
        shapeId: id,
        oldZIndex,
        newZIndex,
      };
    });

    return { updates };
  }, []);

  /**
   * Bring selected shapes forward by one level
   */
  const bringForward = useCallback((shapeIds: string[], shapes: Shape[]) => {
    if (shapeIds.length === 0) {
      return { updates: [] };
    }

    const updates = shapeIds.map((id) => {
      const shape = shapes.find(s => s.id === id);
      const oldZIndex = shape?.zIndex ?? 0;
      const newZIndex = oldZIndex + 1;
      
      return {
        shapeId: id,
        oldZIndex,
        newZIndex,
      };
    });

    return { updates };
  }, []);

  /**
   * Send selected shapes backward by one level
   */
  const sendBackward = useCallback((shapeIds: string[], shapes: Shape[]) => {
    if (shapeIds.length === 0) {
      return { updates: [] };
    }

    const updates = shapeIds.map((id) => {
      const shape = shapes.find(s => s.id === id);
      const oldZIndex = shape?.zIndex ?? 0;
      const newZIndex = oldZIndex - 1;
      
      return {
        shapeId: id,
        oldZIndex,
        newZIndex,
      };
    });

    return { updates };
  }, []);

  return {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    sortShapesByZIndex,
  };
};


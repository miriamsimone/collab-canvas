import { useState, useCallback } from 'react';

export interface GridConfig {
  enabled: boolean;
  size: number; // Grid spacing in pixels
  snapThreshold: number; // Distance in pixels to trigger snapping
  showGrid: boolean; // Whether to display the grid visually
}

export interface SmartGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  matchedShapeIds: string[];
}

/**
 * Hook for managing grid and snap-to-grid functionality
 */
export const useGrid = () => {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    enabled: false,
    size: 20, // Default 20px grid
    snapThreshold: 8, // Snap within 8px
    showGrid: true, // Show grid when enabled
  });

  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);

  /**
   * Toggle snap-to-grid on/off
   */
  const toggleSnapToGrid = useCallback(() => {
    setGridConfig((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, []);

  /**
   * Toggle grid visibility
   */
  const toggleGridVisibility = useCallback(() => {
    setGridConfig((prev) => ({
      ...prev,
      showGrid: !prev.showGrid,
    }));
  }, []);

  /**
   * Update grid size
   */
  const setGridSize = useCallback((size: number) => {
    setGridConfig((prev) => ({
      ...prev,
      size: Math.max(5, Math.min(100, size)), // Clamp between 5-100px
    }));
  }, []);

  /**
   * Snap a single coordinate to the grid
   */
  const snapToGrid = useCallback(
    (value: number): number => {
      if (!gridConfig.enabled) return value;

      const gridSize = gridConfig.size;
      const snappedValue = Math.round(value / gridSize) * gridSize;
      
      // Only snap if within threshold
      const distance = Math.abs(value - snappedValue);
      if (distance <= gridConfig.snapThreshold) {
        return snappedValue;
      }
      
      return value;
    },
    [gridConfig.enabled, gridConfig.size, gridConfig.snapThreshold]
  );

  /**
   * Snap a point (x, y) to the grid
   */
  const snapPointToGrid = useCallback(
    (x: number, y: number): { x: number; y: number; snapped: boolean } => {
      if (!gridConfig.enabled) {
        return { x, y, snapped: false };
      }

      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);
      const snapped = snappedX !== x || snappedY !== y;

      return { x: snappedX, y: snappedY, snapped };
    },
    [gridConfig.enabled, snapToGrid]
  );

  /**
   * Snap a rectangle to the grid (top-left corner)
   */
  const snapRectToGrid = useCallback(
    (
      x: number,
      y: number,
      _width: number,
      _height: number
    ): { x: number; y: number; snapped: boolean } => {
      if (!gridConfig.enabled) {
        return { x, y, snapped: false };
      }

      const result = snapPointToGrid(x, y);
      return result;
    },
    [gridConfig.enabled, snapPointToGrid]
  );

  /**
   * Calculate smart guides based on shape alignment
   * Detects when a shape aligns with other shapes on the canvas
   */
  const calculateSmartGuides = useCallback(
    (
      currentShape: { x: number; y: number; width?: number; height?: number; radius?: number },
      otherShapes: Array<{ 
        id: string; 
        x: number; 
        y: number; 
        width?: number; 
        height?: number; 
        radius?: number;
      }>,
      threshold: number = 5
    ): SmartGuide[] => {
      if (!gridConfig.enabled) return [];

      const guides: SmartGuide[] = [];
      const currentWidth = currentShape.width || currentShape.radius ? currentShape.radius! * 2 : 0;
      const currentHeight = currentShape.height || currentShape.radius ? currentShape.radius! * 2 : 0;
      
      // Calculate key positions for current shape
      const currentLeft = currentShape.x;
      const currentRight = currentShape.x + currentWidth;
      const currentCenterX = currentShape.x + currentWidth / 2;
      const currentTop = currentShape.y;
      const currentBottom = currentShape.y + currentHeight;
      const currentCenterY = currentShape.y + currentHeight / 2;

      otherShapes.forEach((shape) => {
        const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 0);
        const shapeHeight = shape.height || (shape.radius ? shape.radius * 2 : 0);
        
        const shapeLeft = shape.x;
        const shapeRight = shape.x + shapeWidth;
        const shapeCenterX = shape.x + shapeWidth / 2;
        const shapeTop = shape.y;
        const shapeBottom = shape.y + shapeHeight;
        const shapeCenterY = shape.y + shapeHeight / 2;

        // Check vertical alignment (X-axis)
        if (Math.abs(currentLeft - shapeLeft) <= threshold) {
          guides.push({ type: 'vertical', position: shapeLeft, matchedShapeIds: [shape.id] });
        }
        if (Math.abs(currentRight - shapeRight) <= threshold) {
          guides.push({ type: 'vertical', position: shapeRight, matchedShapeIds: [shape.id] });
        }
        if (Math.abs(currentCenterX - shapeCenterX) <= threshold) {
          guides.push({ type: 'vertical', position: shapeCenterX, matchedShapeIds: [shape.id] });
        }

        // Check horizontal alignment (Y-axis)
        if (Math.abs(currentTop - shapeTop) <= threshold) {
          guides.push({ type: 'horizontal', position: shapeTop, matchedShapeIds: [shape.id] });
        }
        if (Math.abs(currentBottom - shapeBottom) <= threshold) {
          guides.push({ type: 'horizontal', position: shapeBottom, matchedShapeIds: [shape.id] });
        }
        if (Math.abs(currentCenterY - shapeCenterY) <= threshold) {
          guides.push({ type: 'horizontal', position: shapeCenterY, matchedShapeIds: [shape.id] });
        }
      });

      // Remove duplicate guides at same position
      const uniqueGuides = guides.reduce((acc, guide) => {
        const existing = acc.find(
          (g) => g.type === guide.type && Math.abs(g.position - guide.position) < 1
        );
        if (!existing) {
          acc.push(guide);
        } else {
          existing.matchedShapeIds.push(...guide.matchedShapeIds);
        }
        return acc;
      }, [] as SmartGuide[]);

      return uniqueGuides;
    },
    [gridConfig.enabled]
  );

  /**
   * Update smart guides state
   */
  const updateSmartGuides = useCallback((guides: SmartGuide[]) => {
    setSmartGuides(guides);
  }, []);

  /**
   * Clear smart guides
   */
  const clearSmartGuides = useCallback(() => {
    setSmartGuides([]);
  }, []);

  /**
   * Snap to smart guides if within threshold
   */
  const snapToSmartGuides = useCallback(
    (
      x: number,
      y: number,
      guides: SmartGuide[]
    ): { x: number; y: number; snapped: boolean } => {
      if (!gridConfig.enabled || guides.length === 0) {
        return { x, y, snapped: false };
      }

      let snappedX = x;
      let snappedY = y;
      let snapped = false;

      guides.forEach((guide) => {
        if (guide.type === 'vertical' && Math.abs(x - guide.position) <= gridConfig.snapThreshold) {
          snappedX = guide.position;
          snapped = true;
        }
        if (guide.type === 'horizontal' && Math.abs(y - guide.position) <= gridConfig.snapThreshold) {
          snappedY = guide.position;
          snapped = true;
        }
      });

      return { x: snappedX, y: snappedY, snapped };
    },
    [gridConfig.enabled, gridConfig.snapThreshold]
  );

  return {
    gridConfig,
    smartGuides,
    toggleSnapToGrid,
    toggleGridVisibility,
    setGridSize,
    snapToGrid,
    snapPointToGrid,
    snapRectToGrid,
    calculateSmartGuides,
    updateSmartGuides,
    clearSmartGuides,
    snapToSmartGuides,
  };
};


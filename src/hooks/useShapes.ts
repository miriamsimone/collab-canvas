import { useState, useEffect, useCallback } from 'react';
import type { 
  Shape, 
  ShapeType
} from '../types/shapes';
import { 
  isRectangle, 
  isCircle, 
  isLine, 
  isText,
  generateShapeId
} from '../types/shapes';
import {
  shapesService,
  createRectangleShape,
  createCircleShape,
  createLineShape,
  createTextShape,
} from '../services/shapesService';
import { realtimeObjectService, type RealtimeObjectData } from '../services/realtimeObjectService';
import { useAuth } from './useAuth';

interface UseShapesState {
  shapes: Shape[];
  rectangles: Shape[]; // Legacy compatibility - filtered shapes
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface UseShapesActions {
  // Generic shape operations
  createShape: (type: ShapeType, position: { x: number; y: number }, options?: CreateShapeOptions) => Promise<Shape>;
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  deleteShapes: (ids: string[]) => Promise<void>;
  
  // Shape-specific creation methods
  createRectangle: (x: number, y: number, width?: number, height?: number, fillColor?: string) => Promise<Shape>;
  createCircle: (x: number, y: number, radius?: number, fillColor?: string) => Promise<Shape>;
  createLine: (x1: number, y1: number, x2: number, y2: number, strokeColor?: string) => Promise<Shape>;
  createText: (x: number, y: number, text?: string, fontSize?: number) => Promise<Shape>;
  
  // Legacy rectangle operations (for backward compatibility)
  updateRectangle: (id: string, updates: Partial<Shape>) => Promise<void>;
  updateRectangleTransform: (id: string, x: number, y: number, width: number, height: number) => Promise<void>;
  deleteRectangle: (id: string) => Promise<void>;
  
  // Transform operations
  updateShapeTransform: (id: string, x: number, y: number, additionalProps?: Record<string, any>) => Promise<void>;
  
  // Text operations
  updateTextContent: (id: string, text: string) => Promise<void>;
  
  // Utility methods
  getShapesByType: (type: ShapeType) => Shape[];
  clearError: () => void;
}

interface CreateShapeOptions {
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  x2?: number; // For lines
  y2?: number; // For lines
  [key: string]: any; // Allow additional properties
}

export const useShapes = (): UseShapesState & UseShapesActions => {
  const { user, userProfile } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [realtimeMovements, setRealtimeMovements] = useState<Record<string, RealtimeObjectData>>({});

  // Default colors for shape creation
  const colors = ['#007ACC', '#28A745', '#DC3545', '#FFC107', '#6F42C1', '#FD7E14'];

  /**
   * Generic shape creation method
   */
  const createShape = useCallback(async (
    type: ShapeType,
    position: { x: number; y: number },
    options: CreateShapeOptions = {}
  ): Promise<Shape> => {
    if (!user || !userProfile) {
      throw new Error('User must be authenticated to create shapes');
    }

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    let newShape: Shape;
    const id = generateShapeId(type);
    
    switch (type) {
      case 'rectangle':
        newShape = createRectangleShape(position, user.uid, {
          id,
          width: options.width || 120,
          height: options.height || 80,
          fill: options.fill || `${randomColor}40`, // Semi-transparent
          stroke: options.stroke || randomColor,
          strokeWidth: options.strokeWidth || 2,
          ...options,
        });
        break;
        
      case 'circle':
        newShape = createCircleShape(position, user.uid, {
          id,
          radius: options.radius || 50,
          fill: options.fill || `${randomColor}40`, // Semi-transparent
          stroke: options.stroke || randomColor,
          strokeWidth: options.strokeWidth || 2,
          ...options,
        });
        break;
        
      case 'line':
        newShape = createLineShape(
          position,
          { x: options.x2 || position.x + 100, y: options.y2 || position.y },
          user.uid,
          {
            id,
            stroke: options.stroke || randomColor,
            strokeWidth: options.strokeWidth || 3,
            ...options,
          }
        );
        break;
        
      case 'text':
        newShape = createTextShape(
          position,
          options.text || 'New Text',
          user.uid,
          {
            id,
            fontSize: options.fontSize || 16,
            fontFamily: options.fontFamily || 'Arial, sans-serif',
            fill: options.fill || '#000000',
            ...options,
          }
        );
        break;
        
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }

    try {
      // Optimistic update - add shape locally first
      setShapes(prev => [...prev, newShape]);
      
      // Sync to Firestore
      await shapesService.createShape(newShape, user.uid);
      
      return newShape;
    } catch (err: any) {
      // Rollback optimistic update on error
      setShapes(prev => prev.filter(shape => shape.id !== newShape.id));
      setError(`Failed to create ${type}: ${err.message}`);
      throw err;
    }
  }, [user, userProfile]);

  /**
   * Shape-specific creation methods
   */
  const createRectangle = useCallback(async (
    x: number, 
    y: number, 
    width: number = 120, 
    height: number = 80, 
    fillColor?: string
  ): Promise<Shape> => {
    const baseColor = fillColor || colors[Math.floor(Math.random() * colors.length)];
    const transparentFill = fillColor ? 
      `${fillColor.replace('#', '').substring(0, 6)}40` : 
      `${baseColor.replace('#', '')}40`;
      
    return createShape('rectangle', { x, y }, {
      width,
      height,
      fill: `#${transparentFill}`,
      stroke: baseColor,
    });
  }, [createShape]);

  const createCircle = useCallback(async (
    x: number, 
    y: number, 
    radius: number = 50, 
    fillColor?: string
  ): Promise<Shape> => {
    const baseColor = fillColor || colors[Math.floor(Math.random() * colors.length)];
    const transparentFill = fillColor ? 
      `${fillColor.replace('#', '').substring(0, 6)}40` : 
      `${baseColor.replace('#', '')}40`;
      
    return createShape('circle', { x, y }, {
      radius,
      fill: `#${transparentFill}`,
      stroke: baseColor,
    });
  }, [createShape]);

  const createLine = useCallback(async (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    strokeColor?: string
  ): Promise<Shape> => {
    const color = strokeColor || colors[Math.floor(Math.random() * colors.length)];
    
    return createShape('line', { x: x1, y: y1 }, {
      x2,
      y2,
      stroke: color,
      strokeWidth: 3,
    });
  }, [createShape]);

  const createText = useCallback(async (
    x: number, 
    y: number, 
    text: string = 'New Text', 
    fontSize: number = 16
  ): Promise<Shape> => {
    return createShape('text', { x, y }, {
      text,
      fontSize,
      fill: '#000000',
    });
  }, [createShape]);

  /**
   * Update an existing shape
   */
  const updateShape = useCallback(async (
    id: string, 
    updates: Partial<Shape>
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update shapes');
    }

    try {
      // Optimistic update - update shape locally first
      setShapes(prev => prev.map(shape => 
        shape.id === id ? { ...shape, ...updates } as Shape : shape
      ));
      
      // Sync to Firestore
      await shapesService.updateShape(id, updates, user.uid);
    } catch (err: any) {
      setError(`Failed to update shape: ${err.message}`);
      throw err;
    }
  }, [user]);

  /**
   * Update shape transform (position and type-specific dimensions)
   */
  const updateShapeTransform = useCallback(async (
    id: string,
    x: number,
    y: number,
    additionalProps: Record<string, any> = {}
  ): Promise<void> => {
    const updates = { x, y, ...additionalProps };
    await updateShape(id, updates);
  }, [updateShape]);

  /**
   * Update text content specifically
   */
  const updateTextContent = useCallback(async (
    id: string,
    text: string
  ): Promise<void> => {
    await updateShape(id, { text });
  }, [updateShape]);

  /**
   * Delete a single shape
   */
  const deleteShape = useCallback(async (id: string): Promise<void> => {
    const shapeToDelete = shapes.find(shape => shape.id === id);
    
    try {
      // Optimistic update - remove shape locally first
      setShapes(prev => prev.filter(shape => shape.id !== id));
      
      // Sync to Firestore
      await shapesService.deleteShape(id);
    } catch (err: any) {
      // Rollback optimistic update on error
      if (shapeToDelete) {
        setShapes(prev => [...prev, shapeToDelete]);
      }
      setError(`Failed to delete shape: ${err.message}`);
      throw err;
    }
  }, [shapes]);

  /**
   * Delete multiple shapes
   */
  const deleteShapes = useCallback(async (ids: string[]): Promise<void> => {
    const shapesToDelete = shapes.filter(shape => ids.includes(shape.id));
    
    try {
      // Optimistic update - remove shapes locally first
      setShapes(prev => prev.filter(shape => !ids.includes(shape.id)));
      
      // Sync to Firestore
      await shapesService.deleteShapes(ids);
    } catch (err: any) {
      // Rollback optimistic update on error
      if (shapesToDelete.length > 0) {
        setShapes(prev => [...prev, ...shapesToDelete]);
      }
      setError(`Failed to delete shapes: ${err.message}`);
      throw err;
    }
  }, [shapes]);

  /**
   * Legacy methods for backward compatibility
   */
  const updateRectangle = updateShape;
  const deleteRectangle = deleteShape;
  
  const updateRectangleTransform = useCallback(async (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> => {
    await updateShapeTransform(id, x, y, { width, height });
  }, [updateShapeTransform]);

  /**
   * Get shapes by type
   */
  const getShapesByType = useCallback((type: ShapeType): Shape[] => {
    return shapes.filter(shape => shape.type === type);
  }, [shapes]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set up real-time subscription when user is authenticated
  useEffect(() => {
    if (!user) {
      setShapes([]);
      setLoading(false);
      setIsConnected(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to Firestore for persistent shape data
    const unsubscribeShapes = shapesService.subscribeToShapes(
      (updatedShapes) => {
        setShapes(updatedShapes);
        setLoading(false);
        setIsConnected(true);
      },
      (error) => {
        console.error('Real-time subscription error:', error);
        setError(`Connection error: ${error.message}`);
        setLoading(false);
        setIsConnected(false);
      }
    );

    // Subscribe to RTDB for real-time object movements during dragging
    const unsubscribeMovements = realtimeObjectService.subscribeToObjectMovements(
      (movements) => {
        setRealtimeMovements(movements);
      }
    );

    // Cleanup subscriptions on component unmount or user change
    return () => {
      unsubscribeShapes();
      unsubscribeMovements();
      setIsConnected(false);
    };
  }, [user]);

  // Merge Firestore shapes with RTDB real-time movements
  const mergedShapes = shapes.map(shape => {
    const realtimeMovement = realtimeMovements[shape.id];
    
    // If this shape is being dragged in real-time by someone else, use RTDB position
    if (realtimeMovement && realtimeMovement.isDragging && realtimeMovement.draggedBy !== user?.uid) {
      const updates: any = {
        x: realtimeMovement.x,
        y: realtimeMovement.y,
      };
      
      // Add type-specific properties
      if (isRectangle(shape)) {
        updates.width = realtimeMovement.width;
        updates.height = realtimeMovement.height;
      } else if (isCircle(shape)) {
        // For circles, width/height in RTDB represents diameter
        updates.radius = realtimeMovement.width / 2;
      } else if (isLine(shape)) {
        // For lines, calculate x2, y2 based on width/height
        updates.x2 = realtimeMovement.x + realtimeMovement.width;
        updates.y2 = realtimeMovement.y + realtimeMovement.height;
      } else if (isText(shape)) {
        updates.width = realtimeMovement.width;
        updates.height = realtimeMovement.height;
      }
      
      return { ...shape, ...updates };
    }
    
    // If this shape WAS being dragged recently (grace period), prefer RTDB position
    if (realtimeMovement && !realtimeMovement.isDragging) {
      const timeSinceUpdate = Date.now() - realtimeMovement.timestamp;
      if (timeSinceUpdate < 2000) { // 2 second grace period
        const updates: any = {
          x: realtimeMovement.x,
          y: realtimeMovement.y,
        };
        
        // Add type-specific properties (same logic as above)
        if (isRectangle(shape)) {
          updates.width = realtimeMovement.width;
          updates.height = realtimeMovement.height;
        } else if (isCircle(shape)) {
          updates.radius = realtimeMovement.width / 2;
        } else if (isLine(shape)) {
          updates.x2 = realtimeMovement.x + realtimeMovement.width;
          updates.y2 = realtimeMovement.y + realtimeMovement.height;
        } else if (isText(shape)) {
          updates.width = realtimeMovement.width;
          updates.height = realtimeMovement.height;
        }
        
        return { ...shape, ...updates };
      }
    }
    
    // Otherwise, use the Firestore position
    return shape;
  });

  // Legacy compatibility - filter rectangles for backward compatibility
  const rectangles = mergedShapes.filter(isRectangle) as any;

  return {
    // State
    shapes: mergedShapes as Shape[],
    rectangles, // Legacy compatibility
    loading,
    error,
    isConnected,
    
    // Generic actions
    createShape,
    updateShape,
    deleteShape,
    deleteShapes,
    
    // Shape-specific creation
    createRectangle,
    createCircle,
    createLine,
    createText,
    
    // Legacy rectangle actions
    updateRectangle,
    updateRectangleTransform,
    deleteRectangle,
    
    // Transform and text actions
    updateShapeTransform,
    updateTextContent,
    
    // Utility actions
    getShapesByType,
    clearError,
  };
};

// Legacy export for backward compatibility
export const useRectangles = useShapes;

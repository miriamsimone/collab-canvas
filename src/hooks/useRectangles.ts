import { useState, useEffect, useCallback } from 'react';
import { type CanvasObjectData } from '../components/CanvasObject';
import {
  rectanglesService,
  prepareRectangleForFirestore,
  generateRectangleId,
} from '../services/rectanglesService';
import { realtimeObjectService, type RealtimeObjectData } from '../services/realtimeObjectService';
import { useAuth } from './useAuth';

interface UseRectanglesState {
  rectangles: CanvasObjectData[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface UseRectanglesActions {
  createRectangle: (x: number, y: number) => Promise<CanvasObjectData>;
  updateRectangle: (id: string, updates: Partial<CanvasObjectData>) => Promise<void>;
  updateRectangleTransform: (id: string, x: number, y: number, width: number, height: number) => Promise<void>;
  deleteRectangle: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useRectangles = (): UseRectanglesState & UseRectanglesActions => {
  const { user, userProfile } = useAuth();
  const [rectangles, setRectangles] = useState<CanvasObjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [realtimeMovements, setRealtimeMovements] = useState<Record<string, RealtimeObjectData>>({});

  // Colors for random rectangle creation
  const colors = ['#007ACC', '#28A745', '#DC3545', '#FFC107', '#6F42C1', '#FD7E14'];

  /**
   * Create a new rectangle locally and sync to Firestore
   */
  const createRectangle = useCallback(async (x: number, y: number): Promise<CanvasObjectData> => {
    if (!user || !userProfile) {
      throw new Error('User must be authenticated to create rectangles');
    }

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newRectangle: CanvasObjectData = {
      id: generateRectangleId(),
      x,
      y,
      width: 120,
      height: 80,
      fill: randomColor + '20', // Add transparency
      stroke: randomColor,
      strokeWidth: 2,
    };

    try {
      // Optimistic update - add rectangle locally first
      setRectangles(prev => [...prev, newRectangle]);
      
      // Sync to Firestore
      const firestoreData = prepareRectangleForFirestore(newRectangle, user.uid);
      await rectanglesService.createRectangle(firestoreData);
      
      return newRectangle;
    } catch (err: any) {
      // Rollback optimistic update on error
      setRectangles(prev => prev.filter(rect => rect.id !== newRectangle.id));
      setError(`Failed to create rectangle: ${err.message}`);
      throw err;
    }
  }, [user, userProfile]);

  /**
   * Update an existing rectangle locally and sync to Firestore
   */
  const updateRectangle = useCallback(async (
    id: string, 
    updates: Partial<CanvasObjectData>
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update rectangles');
    }

    try {
      // Optimistic update - update rectangle locally first
      setRectangles(prev => prev.map(rect => 
        rect.id === id ? { ...rect, ...updates } : rect
      ));
      
      // Sync to Firestore
      await rectanglesService.updateRectangle(id, updates, user.uid);
    } catch (err: any) {
      setError(`Failed to update rectangle: ${err.message}`);
      // Note: In a production app, you might want to revert the optimistic update
      throw err;
    }
  }, [user]);

  /**
   * Update rectangle transform (position and size) - specifically for resize operations
   */
  const updateRectangleTransform = useCallback(async (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update rectangles');
    }

    const updates: Partial<CanvasObjectData> = { x, y, width, height };

    try {
      // Optimistic update - update rectangle locally first
      setRectangles(prev => prev.map(rect => 
        rect.id === id ? { ...rect, ...updates } : rect
      ));
      
      // Sync to Firestore
      await rectanglesService.updateRectangle(id, updates, user.uid);
    } catch (err: any) {
      setError(`Failed to update rectangle transform: ${err.message}`);
      // Note: In a production app, you might want to revert the optimistic update
      throw err;
    }
  }, [user]);

  /**
   * Delete a rectangle locally and sync to Firestore
   */
  const deleteRectangle = useCallback(async (id: string): Promise<void> => {
    // Find rectangle before deletion for potential rollback
    const rectangleToDelete = rectangles.find(rect => rect.id === id);
    
    try {
      // Optimistic update - remove rectangle locally first
      setRectangles(prev => prev.filter(rect => rect.id !== id));
      
      // Sync to Firestore
      await rectanglesService.deleteRectangle(id);
    } catch (err: any) {
      // Rollback optimistic update on error
      if (rectangleToDelete) {
        setRectangles(prev => [...prev, rectangleToDelete]);
      }
      setError(`Failed to delete rectangle: ${err.message}`);
      throw err;
    }
  }, [rectangles]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set up real-time subscription when user is authenticated
  useEffect(() => {
    if (!user) {
      setRectangles([]);
      setLoading(false);
      setIsConnected(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to Firestore for persistent rectangle data
    const unsubscribeRectangles = rectanglesService.subscribeToRectangles(
      (updatedRectangles) => {
        setRectangles(updatedRectangles);
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
      unsubscribeRectangles();
      unsubscribeMovements();
      setIsConnected(false);
    };
  }, [user]);

  // Merge Firestore rectangles with RTDB real-time movements
  const mergedRectangles = rectangles.map(rectangle => {
    const realtimeMovement = realtimeMovements[rectangle.id];
    
    // If this rectangle is being dragged in real-time by someone else, use RTDB position
    if (realtimeMovement && realtimeMovement.isDragging && realtimeMovement.draggedBy !== user?.uid) {
      return {
        ...rectangle,
        x: realtimeMovement.x,
        y: realtimeMovement.y,
        width: realtimeMovement.width,
        height: realtimeMovement.height,
      };
    }
    
    // If this rectangle WAS being dragged recently (grace period), prefer RTDB position
    // This prevents snap-back during the Firestore update delay
    if (realtimeMovement && !realtimeMovement.isDragging) {
      const timeSinceUpdate = Date.now() - realtimeMovement.timestamp;
      if (timeSinceUpdate < 2000) { // 2 second grace period for recently finished drags
        return {
          ...rectangle,
          x: realtimeMovement.x,
          y: realtimeMovement.y,
          width: realtimeMovement.width,
          height: realtimeMovement.height,
        };
      }
    }
    
    // Otherwise, use the Firestore position
    return rectangle;
  });

  return {
    // State - return merged rectangles that combine Firestore + RTDB data
    rectangles: mergedRectangles,
    loading,
    error,
    isConnected,
    
    // Actions
    createRectangle,
    updateRectangle,
    updateRectangleTransform,
    deleteRectangle,
    clearError,
  };
};

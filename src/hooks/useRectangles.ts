import { useState, useEffect, useCallback } from 'react';
import { type CanvasObjectData } from '../components/CanvasObject';
import {
  rectanglesService,
  prepareRectangleForFirestore,
  generateRectangleId,
} from '../services/rectanglesService';
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
  deleteRectangle: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useRectangles = (): UseRectanglesState & UseRectanglesActions => {
  const { user, userProfile } = useAuth();
  const [rectangles, setRectangles] = useState<CanvasObjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

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

    const unsubscribe = rectanglesService.subscribeToRectangles(
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

    // Cleanup subscription on component unmount or user change
    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [user]);

  return {
    // State
    rectangles,
    loading,
    error,
    isConnected,
    
    // Actions
    createRectangle,
    updateRectangle,
    deleteRectangle,
    clearError,
  };
};

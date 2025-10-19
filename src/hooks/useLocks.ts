import { useState, useEffect, useCallback } from 'react';
import { lockService, type ShapeLock } from '../services/lockService';
import { useAuth } from './useAuth';
import { generateUserColor } from '../services/presenceService';
import type { Shape } from '../types/shapes';

interface UseLocks {
  locks: Record<string, ShapeLock>;
  acquireLock: (shapeId: string) => Promise<boolean>;
  releaseLock: (shapeId: string) => Promise<void>;
  releaseAllLocks: () => Promise<void>;
  isShapeLockedByOther: (shapeId: string) => boolean;
  getShapeLockInfo: (shapeId: string) => ShapeLock | null;
  mergeLocksWithShapes: (shapes: Shape[]) => Shape[];
}

/**
 * Hook to manage collaborative object locking
 */
export const useLocks = (): UseLocks => {
  const { user, userProfile } = useAuth();
  const [locks, setLocks] = useState<Record<string, ShapeLock>>({});

  // Subscribe to all locks
  useEffect(() => {
    if (!user) {
      setLocks({});
      return;
    }

    const unsubscribe = lockService.subscribeToLocks((newLocks) => {
      setLocks(newLocks);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Release all locks when unmounting or user changes
  useEffect(() => {
    return () => {
      if (user) {
        lockService.releaseAllLocks(user.uid).catch(console.error);
      }
    };
  }, [user]);

  // Handle browser close/refresh - release locks
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      lockService.releaseAllLocks(user.uid).catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  /**
   * Acquire a lock on a shape
   */
  const acquireLock = useCallback(async (shapeId: string): Promise<boolean> => {
    if (!user || !userProfile) {
      console.warn('Cannot acquire lock: user not authenticated');
      return false;
    }

    const userColor = generateUserColor(user.uid);
    return await lockService.acquireLock(
      shapeId,
      user.uid,
      userProfile.displayName,
      userColor
    );
  }, [user, userProfile]);

  /**
   * Release a lock on a shape
   */
  const releaseLock = useCallback(async (shapeId: string): Promise<void> => {
    if (!user) return;
    await lockService.releaseLock(shapeId, user.uid);
  }, [user]);

  /**
   * Release all locks held by current user
   */
  const releaseAllLocks = useCallback(async (): Promise<void> => {
    if (!user) return;
    await lockService.releaseAllLocks(user.uid);
  }, [user]);

  /**
   * Check if a shape is locked by another user
   */
  const isShapeLockedByOther = useCallback((shapeId: string): boolean => {
    if (!user) return false;
    const lock = locks[shapeId];
    return lock ? lock.userId !== user.uid : false;
  }, [locks, user]);

  /**
   * Get lock info for a specific shape
   */
  const getShapeLockInfo = useCallback((shapeId: string): ShapeLock | null => {
    return locks[shapeId] || null;
  }, [locks]);

  /**
   * Merge lock information with shapes
   */
  const mergeLocksWithShapes = useCallback((shapes: Shape[]): Shape[] => {
    if (!user) return shapes;

    const mergedShapes = shapes.map(shape => {
      const lock = locks[shape.id];
      if (!lock) {
        return shape;
      }

      const isLockedByOther = lock.userId !== user.uid;

      return {
        ...shape,
        isLockedByOther,
        lockedBy: lock.userId,
        lockedByName: lock.userName,
        lockedByColor: lock.userColor, // Add the user's color
      };
    });

    return mergedShapes;
  }, [locks, user]);

  return {
    locks,
    acquireLock,
    releaseLock,
    releaseAllLocks,
    isShapeLockedByOther,
    getShapeLockInfo,
    mergeLocksWithShapes,
  };
};


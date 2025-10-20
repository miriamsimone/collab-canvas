import { ref, set, remove, onValue, off, type Unsubscribe } from 'firebase/database';
import { rtdb } from './firebase';

/**
 * Lock data structure stored in RTDB
 */
export interface ShapeLock {
  userId: string;
  userName: string;
  userColor: string;
  timestamp: number;
}

/**
 * LockService manages real-time collaborative object locking
 * Uses Firebase Realtime Database for instant lock acquisition/release
 */
export class LockService {
  private canvasId: string = 'shared';
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Set the canvas ID for this service
   */
  setCanvasId(canvasId: string): void {
    this.canvasId = canvasId;
  }

  /**
   * Get the current locks path
   */
  private getLocksPath(): string {
    return `canvas/${this.canvasId}/locks`;
  }

  /**
   * Acquire a lock on a shape
   */
  async acquireLock(
    shapeId: string,
    userId: string,
    userName: string,
    userColor: string
  ): Promise<boolean> {
    const lockRef = ref(rtdb, `${this.getLocksPath()}/${shapeId}`);
    
    try {
      const lockData: ShapeLock = {
        userId,
        userName,
        userColor,
        timestamp: Date.now(),
      };

      await set(lockRef, lockData);
      console.log(`🔒 Lock acquired for shape ${shapeId} by ${userName}`);
      return true;
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      return false;
    }
  }

  /**
   * Release a lock on a shape
   */
  async releaseLock(shapeId: string, userId: string): Promise<void> {
    const lockRef = ref(rtdb, `${this.getLocksPath()}/${shapeId}`);
    
    try {
      // Verify the lock belongs to this user before releasing
      // In production, you might want to use a transaction here
      await remove(lockRef);
      console.log(`🔓 Lock released for shape ${shapeId} by user ${userId}`);
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  }

  /**
   * Release all locks held by a user (call on disconnect/unmount)
   */
  async releaseAllLocks(userId: string): Promise<void> {
    const locksRef = ref(rtdb, this.getLocksPath());
    
    try {
      // Get all locks and remove those belonging to this user
      const snapshot = await new Promise((resolve) => {
        onValue(locksRef, resolve, { onlyOnce: true });
      });
      
      const data = (snapshot as any).val();
      if (!data) return;

      const releasePromises: Promise<void>[] = [];
      Object.entries(data).forEach(([shapeId, lock]) => {
        if ((lock as ShapeLock).userId === userId) {
          releasePromises.push(this.releaseLock(shapeId, userId));
        }
      });

      await Promise.all(releasePromises);
      console.log(`🔓 All locks released for user ${userId}`);
    } catch (error) {
      console.error('Failed to release all locks:', error);
    }
  }

  /**
   * Subscribe to all locks and get notified of changes
   * Returns lock data for all shapes
   */
  subscribeToLocks(
    callback: (locks: Record<string, ShapeLock>) => void
  ): Unsubscribe {
    const locksRef = ref(rtdb, this.getLocksPath());
    
    const unsubscribe = onValue(locksRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    });

    return () => {
      off(locksRef);
      unsubscribe();
    };
  }

  /**
   * Subscribe to a specific shape's lock status
   */
  subscribeToShapeLock(
    shapeId: string,
    callback: (lock: ShapeLock | null) => void
  ): Unsubscribe {
    const lockRef = ref(rtdb, `${this.getLocksPath()}/${shapeId}`);
    const subscriptionId = `shape-${shapeId}`;
    
    const unsubscribe = onValue(lockRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    this.activeSubscriptions.set(subscriptionId, unsubscribe);

    return () => {
      off(lockRef);
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionId);
    };
  }

  /**
   * Check if a shape is locked by another user
   */
  async isLockedByOther(shapeId: string, currentUserId: string): Promise<boolean> {
    const lockRef = ref(rtdb, `${this.getLocksPath()}/${shapeId}`);
    
    try {
      const snapshot = await new Promise((resolve) => {
        onValue(lockRef, resolve, { onlyOnce: true });
      });
      
      const data = (snapshot as any).val();
      if (!data) return false;

      return data.userId !== currentUserId;
    } catch (error) {
      console.error('Failed to check lock status:', error);
      return false;
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }
}

// Export singleton instance
export const lockService = new LockService();


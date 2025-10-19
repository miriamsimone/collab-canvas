import {
  ref,
  set,
  onValue,
  off,
  remove,
} from 'firebase/database';
import { rtdb } from './firebase';

// Real-time object movement data structure
export interface RealtimeObjectData {
  x: number;
  y: number;
  width: number;
  height: number;
  isDragging: boolean;
  draggedBy: string;
  timestamp: number;
  lockedBy?: string; // User ID of who has the lock
  lockedAt?: number; // When the lock was acquired
  lockUserName?: string; // Display name of user with lock
}

// Input data for updating object position
export interface ObjectPositionUpdate {
  x: number;
  y: number;
  width?: number;
  height?: number;
  isDragging: boolean;
  draggedBy: string;
  draggedByName?: string; // Display name for lock indicator
}

// Real-time object service for smooth dragging operations
export class RealtimeObjectService {
  private readonly objectMovementsPath = 'objectMovements';
  private activeListeners: Map<string, () => void> = new Map();

  /**
   * Update object position in real-time during dragging
   * Automatically sets lock info when dragging starts
   */
  async updateObjectPosition(
    objectId: string,
    update: ObjectPositionUpdate
  ): Promise<void> {
    const objectData: RealtimeObjectData = {
      x: update.x,
      y: update.y,
      width: update.width || 100, // Default width if not provided
      height: update.height || 100, // Default height if not provided
      isDragging: update.isDragging,
      draggedBy: update.draggedBy,
      timestamp: Date.now(),
      // Set lock info when dragging
      lockedBy: update.isDragging ? update.draggedBy : undefined,
      lockedAt: update.isDragging ? Date.now() : undefined,
      lockUserName: update.isDragging ? update.draggedByName : undefined,
    };

    const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
    await set(objectRef, objectData);
  }

  /**
   * Subscribe to real-time object movement updates
   * Returns an unsubscribe function
   */
  subscribeToObjectMovements(
    callback: (movements: Record<string, RealtimeObjectData>) => void
  ): () => void {
    const movementsRef = ref(rtdb, this.objectMovementsPath);
    
    onValue(movementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter out stale movement data (older than 5 seconds)
        const now = Date.now();
        const activeMovements: Record<string, RealtimeObjectData> = {};
        
        Object.entries(data as Record<string, RealtimeObjectData>).forEach(([objectId, movementData]) => {
          if (
            movementData.isDragging && 
            (now - movementData.timestamp) < 10000 // 10 seconds timeout (increased for grace period)
          ) {
            activeMovements[objectId] = movementData;
          }
        });
        
        callback(activeMovements);
      } else {
        callback({});
      }
    });

    // Store the unsubscribe function
    const unsubscribeKey = `movements-${Date.now()}`;
    this.activeListeners.set(unsubscribeKey, () => {
      off(movementsRef);
      this.activeListeners.delete(unsubscribeKey);
    });

    return () => {
      const cleanup = this.activeListeners.get(unsubscribeKey);
      if (cleanup) {
        cleanup();
      }
    };
  }

  /**
   * Subscribe to a specific object's movement updates
   */
  subscribeToObjectMovement(
    objectId: string,
    callback: (movement: RealtimeObjectData | null) => void
  ): () => void {
    const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
    
    onValue(objectRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Check if movement data is still fresh
        const now = Date.now();
        if (data.isDragging && (now - data.timestamp) < 5000) {
          callback(data);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });

    // Store the unsubscribe function
    const unsubscribeKey = `object-${objectId}-${Date.now()}`;
    this.activeListeners.set(unsubscribeKey, () => {
      off(objectRef);
      this.activeListeners.delete(unsubscribeKey);
    });

    return () => {
      const cleanup = this.activeListeners.get(unsubscribeKey);
      if (cleanup) {
        cleanup();
      }
    };
  }

  /**
   * Mark object as no longer being dragged
   */
  async stopObjectDragging(objectId: string): Promise<void> {
    const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
    await remove(objectRef);
  }

  /**
   * Clean up all movement data for objects that are no longer being dragged
   */
  async cleanupStaleMovements(): Promise<void> {
    const movementsRef = ref(rtdb, this.objectMovementsPath);
    
    // Get current data and remove stale entries
    onValue(movementsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const updates: Record<string, null> = {};
        
        Object.entries(data as Record<string, RealtimeObjectData>).forEach(([objectId, movementData]) => {
          // Remove entries older than 30 seconds or not being dragged
          if (!movementData.isDragging || (now - movementData.timestamp) > 30000) {
            updates[objectId] = null;
          }
        });
        
        // Apply cleanup updates if any
        if (Object.keys(updates).length > 0) {
          for (const [objectId] of Object.entries(updates)) {
            await this.stopObjectDragging(objectId);
          }
        }
      }
    }, { onlyOnce: true }); // Only run once per cleanup call
  }

  /**
   * Acquire a lock on an object for editing
   */
  async lockObject(objectId: string, userId: string, userName: string): Promise<boolean> {
    try {
      const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
      
      // Check if object is already locked
      const currentData = await new Promise<RealtimeObjectData | null>((resolve) => {
        onValue(objectRef, (snapshot) => {
          resolve(snapshot.val());
        }, { onlyOnce: true });
      });
      
      // If locked by someone else and lock is recent (< 10 seconds), deny
      if (currentData?.lockedBy && currentData.lockedBy !== userId) {
        const lockAge = Date.now() - (currentData.lockedAt || 0);
        if (lockAge < 10000) {
          console.log(`🔒 Object ${objectId} is locked by ${currentData.lockUserName}`);
          return false;
        }
      }
      
      // Acquire lock
      const lockData: RealtimeObjectData = {
        x: currentData?.x || 0,
        y: currentData?.y || 0,
        width: currentData?.width || 100,
        height: currentData?.height || 100,
        isDragging: currentData?.isDragging || false,
        draggedBy: currentData?.draggedBy || userId,
        timestamp: Date.now(),
        lockedBy: userId,
        lockedAt: Date.now(),
        lockUserName: userName,
      };
      
      await set(objectRef, lockData);
      console.log(`✅ Locked object ${objectId} for ${userName}`);
      return true;
    } catch (error) {
      console.error('Failed to lock object:', error);
      return false;
    }
  }

  /**
   * Release lock on an object
   */
  async unlockObject(objectId: string, userId: string): Promise<void> {
    try {
      const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
      
      // Get current data
      const currentData = await new Promise<RealtimeObjectData | null>((resolve) => {
        onValue(objectRef, (snapshot) => {
          resolve(snapshot.val());
        }, { onlyOnce: true });
      });
      
      // Only unlock if we own the lock
      if (currentData?.lockedBy === userId) {
        // If also dragging, keep the data but remove lock
        if (currentData.isDragging) {
          const updatedData: RealtimeObjectData = {
            ...currentData,
            lockedBy: undefined,
            lockedAt: undefined,
            lockUserName: undefined,
          };
          await set(objectRef, updatedData);
        } else {
          // Remove entirely if not dragging
          await remove(objectRef);
        }
        console.log(`🔓 Unlocked object ${objectId}`);
      }
    } catch (error) {
      console.error('Failed to unlock object:', error);
    }
  }

  /**
   * Check if object is locked by another user
   */
  async isObjectLocked(objectId: string, currentUserId: string): Promise<{ locked: boolean; lockedBy?: string; userName?: string }> {
    try {
      const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
      
      const data = await new Promise<RealtimeObjectData | null>((resolve) => {
        onValue(objectRef, (snapshot) => {
          resolve(snapshot.val());
        }, { onlyOnce: true });
      });
      
      if (data?.lockedBy && data.lockedBy !== currentUserId) {
        const lockAge = Date.now() - (data.lockedAt || 0);
        // Lock is valid for 10 seconds
        if (lockAge < 10000) {
          return {
            locked: true,
            lockedBy: data.lockedBy,
            userName: data.lockUserName,
          };
        }
      }
      
      return { locked: false };
    } catch (error) {
      console.error('Failed to check lock status:', error);
      return { locked: false };
    }
  }

  /**
   * Clean up all active listeners
   */
  cleanup(): void {
    // Clean up all active listeners
    this.activeListeners.forEach((cleanup) => {
      cleanup();
    });
    this.activeListeners.clear();
  }

  /**
   * Get current object position from RTDB (for conflict resolution)
   */
  async getObjectPosition(objectId: string): Promise<RealtimeObjectData | null> {
    return new Promise((resolve) => {
      const objectRef = ref(rtdb, `${this.objectMovementsPath}/${objectId}`);
      
      onValue(objectRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.isDragging) {
          resolve(data);
        } else {
          resolve(null);
        }
      }, { onlyOnce: true });
    });
  }
}

// Create and export a singleton instance
export const realtimeObjectService = new RealtimeObjectService();

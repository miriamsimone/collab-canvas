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
}

// Input data for updating object position
export interface ObjectPositionUpdate {
  x: number;
  y: number;
  width?: number;
  height?: number;
  isDragging: boolean;
  draggedBy: string;
}

// Real-time object service for smooth dragging operations
export class RealtimeObjectService {
  private readonly objectMovementsPath = 'objectMovements';
  private activeListeners: Map<string, () => void> = new Map();

  /**
   * Update object position in real-time during dragging
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

import {
  ref,
  set,
  onValue,
  off,
} from 'firebase/database';
import { rtdb } from './firebase';

// Realtime Database presence data structure (compatible with PresenceData)
export interface RealtimePresenceData {
  userId: string; // Add userId for compatibility
  displayName: string;
  cursorX: number;
  cursorY: number;
  cursorColor: string; // Match original interface naming
  color: string; // Keep both for compatibility
  lastSeen: number;
  isActive: boolean;
}

// Input data for updating cursor position
export interface RealtimeCursorUpdate {
  x: number;
  y: number;
  displayName: string;
  color: string;
}

// Realtime cursor service class for RTDB operations
export class RealtimeCursorService {
  private readonly presencePath = 'presence';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private activeListeners: Map<string, () => void> = new Map();

  /**
   * Update cursor position for a user in real-time
   */
  async updateCursorPosition(
    userId: string,
    update: RealtimeCursorUpdate
  ): Promise<void> {
    const presenceData: RealtimePresenceData = {
      userId,
      displayName: update.displayName,
      cursorX: update.x,
      cursorY: update.y,
      cursorColor: update.color, // Match original interface
      color: update.color, // Keep both for compatibility
      lastSeen: Date.now(),
      isActive: true,
    };

    const userPresenceRef = ref(rtdb, `${this.presencePath}/${userId}`);
    await set(userPresenceRef, presenceData);
  }

  /**
   * Subscribe to all active cursors/presence data in real-time
   * Returns an unsubscribe function
   */
  subscribeToPresence(
    callback: (cursors: Record<string, RealtimePresenceData>) => void
  ): () => void {
    const presenceRef = ref(rtdb, this.presencePath);
    
    onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter out inactive or stale presence data
        const now = Date.now();
        const activeCursors: Record<string, RealtimePresenceData> = {};
        
        Object.entries(data as Record<string, Omit<RealtimePresenceData, 'userId'>>).forEach(([userId, presenceDataWithoutId]) => {
          const presenceData = { ...presenceDataWithoutId, userId }; // Add userId from key
          if (
            presenceData.isActive && 
            (now - presenceData.lastSeen) < 120000 // 2 minutes timeout
          ) {
            activeCursors[userId] = presenceData;
          }
        });
        
        callback(activeCursors);
      } else {
        callback({});
      }
    });

    // Store the unsubscribe function
    const unsubscribeKey = `presence-${Date.now()}`;
    this.activeListeners.set(unsubscribeKey, () => {
      off(presenceRef);
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
   * Start heartbeat to keep presence active
   */
  startHeartbeat(userId: string, _displayName: string, _color: string): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        // Update only the heartbeat fields, preserve cursor position
        await set(ref(rtdb, `${this.presencePath}/${userId}/lastSeen`), Date.now());
        await set(ref(rtdb, `${this.presencePath}/${userId}/isActive`), true);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat when component unmounts
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Remove user presence when disconnecting
   */
  async removePresence(userId: string): Promise<void> {
    const userPresenceRef = ref(rtdb, `${this.presencePath}/${userId}`);
    await set(userPresenceRef, null);
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
    
    // Stop heartbeat
    this.stopHeartbeat();
  }

  /**
   * Mark user as inactive (but keep presence data)
   */
  async markInactive(userId: string): Promise<void> {
    const userActiveRef = ref(rtdb, `${this.presencePath}/${userId}/isActive`);
    await set(userActiveRef, false);
  }
}

// Create and export a singleton instance
export const realtimeCursorService = new RealtimeCursorService();

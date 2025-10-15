import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

// Presence/Cursor data structure for Firestore
export interface PresenceData {
  userId: string;
  displayName: string;
  cursorColor: string;
  cursorX: number;
  cursorY: number;
  lastSeen: Timestamp;
  isActive: boolean;
}

// Input data for updating cursor position
export interface CursorUpdate {
  x: number;
  y: number;
  displayName: string;
  color: string;
}

// Presence service class for managing cursor/presence operations
export class PresenceService {
  private readonly collectionPath = 'presence';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly INACTIVE_THRESHOLD = 60000; // 1 minute

  /**
   * Update cursor position for a user
   */
  async updateCursorPosition(
    userId: string,
    update: CursorUpdate
  ): Promise<void> {
    const presenceData: PresenceData = {
      userId,
      displayName: update.displayName,
      cursorColor: update.color,
      cursorX: update.x,
      cursorY: update.y,
      lastSeen: Timestamp.now(),
      isActive: true,
    };

    const presenceRef = doc(db, this.collectionPath, userId);
    await setDoc(presenceRef, presenceData);
  }

  /**
   * Subscribe to all active cursors/presence data
   * Returns an unsubscribe function
   */
  subscribeToPresence(
    onUpdate: (presenceData: PresenceData[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const presenceQuery = query(
      collection(db, this.collectionPath),
      where('isActive', '==', true)
    );

    return onSnapshot(
      presenceQuery,
      (snapshot) => {
        const presenceList: PresenceData[] = [];
        const now = Date.now();
        
        snapshot.forEach((doc) => {
          if (doc.exists()) {
            const data = doc.data() as PresenceData;
            
            // Filter out inactive users based on lastSeen timestamp
            const lastSeenTime = data.lastSeen.toMillis();
            if (now - lastSeenTime < this.INACTIVE_THRESHOLD) {
              presenceList.push(data);
            } else {
              // Cleanup inactive presence document
              this.removePresence(data.userId).catch(console.error);
            }
          }
        });

        onUpdate(presenceList);
      },
      (error) => {
        console.error('Error subscribing to presence:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Remove presence/cursor for a user
   */
  async removePresence(userId: string): Promise<void> {
    const presenceRef = doc(db, this.collectionPath, userId);
    await deleteDoc(presenceRef);
  }

  /**
   * Mark user as inactive (but keep presence data)
   */
  async markInactive(userId: string): Promise<void> {
    const presenceRef = doc(db, this.collectionPath, userId);
    await setDoc(presenceRef, { 
      isActive: false, 
      lastSeen: Timestamp.now() 
    }, { merge: true });
  }

  /**
   * Start heartbeat to keep user presence active
   */
  startHeartbeat(userId: string, displayName: string, color: string): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(async () => {
      try {
        const presenceRef = doc(db, this.collectionPath, userId);
        await setDoc(presenceRef, {
          lastSeen: Timestamp.now(),
          isActive: true,
          displayName,
          cursorColor: color,
        }, { merge: true });
      } catch (error) {
        console.error('Heartbeat failed:', error);
        this.stopHeartbeat();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat interval
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get the collection path (useful for security rules testing)
   */
  getCollectionPath(): string {
    return this.collectionPath;
  }
}

// Export a singleton instance
export const presenceService = new PresenceService();

// Utility function to generate consistent user colors
export const generateUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Light Yellow
    '#BB8FCE', // Purple
    '#85C1E9', // Light Blue
  ];
  
  // Generate consistent color based on userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }
  
  return colors[Math.abs(hash) % colors.length];
};
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Canvas document structure
export interface CanvasDocument {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

// Canvas metadata for Firestore
interface FirestoreCanvasDocument {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}

export class CanvasService {
  private readonly canvasPath = 'canvas';
  private readonly sharedCanvasId = 'shared';

  /**
   * Initialize shared canvas document if it doesn't exist
   */
  async initializeSharedCanvas(userId: string): Promise<CanvasDocument> {
    const canvasRef = doc(db, this.canvasPath, this.sharedCanvasId);
    const canvasDoc = await getDoc(canvasRef);

    if (canvasDoc.exists()) {
      // Canvas already exists, return it
      const data = canvasDoc.data() as FirestoreCanvasDocument;
      return {
        id: data.id,
        name: data.name,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        createdBy: data.createdBy,
        isActive: data.isActive,
      };
    } else {
      // Create new shared canvas
      const now = new Date();
      const canvasData: CanvasDocument = {
        id: this.sharedCanvasId,
        name: 'Shared Canvas',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        isActive: true,
      };

      const firestoreData: FirestoreCanvasDocument = {
        ...canvasData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      await setDoc(canvasRef, firestoreData);
      return canvasData;
    }
  }

  /**
   * Get shared canvas document
   */
  async getSharedCanvas(): Promise<CanvasDocument | null> {
    try {
      const canvasRef = doc(db, this.canvasPath, this.sharedCanvasId);
      const canvasDoc = await getDoc(canvasRef);

      if (canvasDoc.exists()) {
        const data = canvasDoc.data() as FirestoreCanvasDocument;
        return {
          id: data.id,
          name: data.name,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          createdBy: data.createdBy,
          isActive: data.isActive,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting shared canvas:', error);
      return null;
    }
  }

  /**
   * Update canvas last modified timestamp
   */
  async updateCanvasTimestamp(userId: string): Promise<void> {
    try {
      const canvasRef = doc(db, this.canvasPath, this.sharedCanvasId);
      await setDoc(canvasRef, {
        updatedAt: Timestamp.now(),
        lastModifiedBy: userId,
      }, { merge: true });
    } catch (error) {
      console.error('Error updating canvas timestamp:', error);
    }
  }

  /**
   * Mark canvas as active/inactive
   */
  async setCanvasActive(isActive: boolean): Promise<void> {
    try {
      const canvasRef = doc(db, this.canvasPath, this.sharedCanvasId);
      await setDoc(canvasRef, {
        isActive,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error setting canvas active status:', error);
    }
  }

  /**
   * Get the shared canvas ID
   */
  getSharedCanvasId(): string {
    return this.sharedCanvasId;
  }
}

// Export singleton instance
export const canvasService = new CanvasService();

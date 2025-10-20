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
   * Generate a unique canvas ID
   */
  generateCanvasId(): string {
    return `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize canvas document if it doesn't exist
   */
  async initializeCanvas(canvasId: string, userId: string): Promise<CanvasDocument> {
    const canvasRef = doc(db, this.canvasPath, canvasId);
    const canvasDoc = await getDoc(canvasRef);

    if (canvasDoc.exists()) {
      // Canvas already exists, return it
      const data = canvasDoc.data() as FirestoreCanvasDocument;
      
      // Handle potential missing timestamp fields with fallbacks
      const now = new Date();
      let createdAt: Date;
      let updatedAt: Date;
      
      try {
        createdAt = data.createdAt?.toDate() || now;
      } catch (error) {
        console.error('createdAt conversion failed:', error);
        createdAt = now;
      }
      
      try {
        updatedAt = data.updatedAt?.toDate() || now;
      } catch (error) {
        console.error('updatedAt conversion failed:', error);
        updatedAt = now;
      }
      
      return {
        id: data.id || canvasId,
        name: data.name || 'Canvas',
        createdAt,
        updatedAt,
        createdBy: data.createdBy,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };
    } else {
      // Create new canvas
      const now = new Date();
      const canvasData: CanvasDocument = {
        id: canvasId,
        name: canvasId === this.sharedCanvasId ? 'Shared Canvas' : 'Canvas',
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
   * Initialize shared canvas document if it doesn't exist (backward compatibility)
   */
  async initializeSharedCanvas(userId: string): Promise<CanvasDocument> {
    return this.initializeCanvas(this.sharedCanvasId, userId);
  }

  /**
   * Get canvas document
   */
  async getCanvas(canvasId: string): Promise<CanvasDocument | null> {
    try {
      const canvasRef = doc(db, this.canvasPath, canvasId);
      const canvasDoc = await getDoc(canvasRef);

      if (canvasDoc.exists()) {
        const data = canvasDoc.data() as FirestoreCanvasDocument;
        
        // Handle potential missing timestamp fields with fallbacks
        const now = new Date();
        const createdAt = data.createdAt?.toDate() || now;
        const updatedAt = data.updatedAt?.toDate() || now;
        
        return {
          id: data.id || canvasId,
          name: data.name || 'Canvas',
          createdAt,
          updatedAt,
          createdBy: data.createdBy,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting canvas:', error);
      return null;
    }
  }

  /**
   * Get shared canvas document (backward compatibility)
   */
  async getSharedCanvas(): Promise<CanvasDocument | null> {
    return this.getCanvas(this.sharedCanvasId);
  }

  /**
   * Update canvas last modified timestamp
   */
  async updateCanvasTimestamp(canvasId: string, userId: string): Promise<void> {
    try {
      const canvasRef = doc(db, this.canvasPath, canvasId);
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
  async setCanvasActive(canvasId: string, isActive: boolean): Promise<void> {
    try {
      const canvasRef = doc(db, this.canvasPath, canvasId);
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

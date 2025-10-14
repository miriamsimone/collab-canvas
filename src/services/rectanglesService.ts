import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { type CanvasObjectData } from '../components/CanvasObject';

// Extended rectangle data for Firestore
export interface FirestoreRectangle extends CanvasObjectData {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // User ID who created the rectangle
  lastModifiedBy: string; // User ID who last modified the rectangle
}

// Rectangle data for creation (without Firestore metadata)
export interface CreateRectangleData extends CanvasObjectData {
  createdBy: string;
}

// Rectangle service class for managing Firestore operations
export class RectanglesService {
  private readonly collectionPath = `canvas/shapes`;

  /**
   * Create a new rectangle in Firestore
   */
  async createRectangle(rectangleData: CreateRectangleData): Promise<void> {
    const now = Timestamp.now();
    const firestoreData: FirestoreRectangle = {
      ...rectangleData,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: rectangleData.createdBy,
    };

    const rectangleRef = doc(db, this.collectionPath, rectangleData.id);
    await setDoc(rectangleRef, firestoreData);
  }

  /**
   * Update an existing rectangle in Firestore
   */
  async updateRectangle(
    rectangleId: string,
    updates: Partial<CanvasObjectData>,
    userId: string
  ): Promise<void> {
    const rectangleRef = doc(db, this.collectionPath, rectangleId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    };

    await setDoc(rectangleRef, updateData, { merge: true });
  }

  /**
   * Delete a rectangle from Firestore
   */
  async deleteRectangle(rectangleId: string): Promise<void> {
    const rectangleRef = doc(db, this.collectionPath, rectangleId);
    await deleteDoc(rectangleRef);
  }

  /**
   * Subscribe to real-time updates for all rectangles
   * Returns an unsubscribe function
   */
  subscribeToRectangles(
    onUpdate: (rectangles: CanvasObjectData[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const rectanglesQuery = query(
      collection(db, this.collectionPath),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      rectanglesQuery,
      (snapshot) => {
        const rectangles: CanvasObjectData[] = [];
        
        snapshot.forEach((doc) => {
          if (doc.exists()) {
            const data = doc.data() as FirestoreRectangle;
            // Convert Firestore data back to CanvasObjectData
            const rectangle: CanvasObjectData = {
              id: data.id,
              x: data.x,
              y: data.y,
              width: data.width,
              height: data.height,
              fill: data.fill,
              stroke: data.stroke,
              strokeWidth: data.strokeWidth,
            };
            rectangles.push(rectangle);
          }
        });

        onUpdate(rectangles);
      },
      (error) => {
        console.error('Error subscribing to rectangles:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Batch update multiple rectangles (for conflict resolution)
   */
  async batchUpdateRectangles(
    updates: Array<{ id: string; data: Partial<CanvasObjectData> }>,
    userId: string
  ): Promise<void> {
    // Note: For simplicity, we'll do sequential updates
    // In a production app, you might want to use Firestore batch writes
    const updatePromises = updates.map(({ id, data }) =>
      this.updateRectangle(id, data, userId)
    );
    
    await Promise.all(updatePromises);
  }

  /**
   * Get the collection path (useful for security rules testing)
   */
  getCollectionPath(): string {
    return this.collectionPath;
  }
}

// Export a singleton instance
export const rectanglesService = new RectanglesService();

// Utility function to convert local rectangle to Firestore format
export const prepareRectangleForFirestore = (
  rectangle: CanvasObjectData,
  userId: string
): CreateRectangleData => ({
  ...rectangle,
  createdBy: userId,
});

// Utility function to generate rectangle IDs
export const generateRectangleId = (): string => {
  return `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

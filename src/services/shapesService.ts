import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Shape, 
  ShapeType,
  RectangleShape,
  CircleShape,
  LineShape,
  TextShape
} from '../types/shapes';
import {
  generateShapeId,
  DEFAULT_RECTANGLE,
  DEFAULT_CIRCLE,
  DEFAULT_LINE,
  DEFAULT_TEXT,
  prepareShapeForFirestore,
} from '../types/shapes';

// Extended shape data for Firestore
export type FirestoreShape = Shape & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastModifiedBy: string; // User ID who last modified the shape
};

// Shape data for creation (without Firestore metadata)
export type CreateShapeData = Shape & {
  createdBy: string;
};

// Shape service class for managing Firestore operations
export class ShapesService {
  private readonly collectionPath = `canvas/shared/shapes`;

  /**
   * Create a new shape in Firestore
   */
  async createShape(shapeData: CreateShapeData | Shape, userId?: string): Promise<void> {
    const now = Timestamp.now();
    
    // Handle both legacy CanvasObjectData format and new Shape format
    let preparedShape: CreateShapeData;
    
    if ('createdBy' in shapeData) {
      preparedShape = shapeData as CreateShapeData; 
    } else {
      preparedShape = {
        ...shapeData,
        createdBy: userId || 'unknown',
      } as CreateShapeData;
    }

    const firestoreData = {
      ...preparedShape,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: preparedShape.createdBy,
    } as any;

    const shapeRef = doc(db, this.collectionPath, preparedShape.id);
    await setDoc(shapeRef, firestoreData);
  }

  /**
   * Update an existing shape in Firestore
   */
  async updateShape(
    shapeId: string,
    updates: Partial<Shape>,
    userId: string
  ): Promise<void> {
    const shapeRef = doc(db, this.collectionPath, shapeId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    };

    await setDoc(shapeRef, updateData, { merge: true });
  }

  /**
   * Delete a shape from Firestore
   */
  async deleteShape(shapeId: string): Promise<void> {
    const shapeRef = doc(db, this.collectionPath, shapeId);
    await deleteDoc(shapeRef);
  }

  /**
   * Delete multiple shapes from Firestore
   */
  async deleteShapes(shapeIds: string[]): Promise<void> {
    const deletePromises = shapeIds.map(id => this.deleteShape(id));
    await Promise.all(deletePromises);
  }

  /**
   * Subscribe to real-time updates for all shapes
   * Returns an unsubscribe function
   */
  subscribeToShapes(
    onUpdate: (shapes: Shape[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const shapesQuery = query(
      collection(db, this.collectionPath),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      shapesQuery,
      (snapshot) => {
        const shapes: Shape[] = [];
        
        snapshot.forEach((docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as any;
            
            // Convert Firestore data back to Shape format
            const shape: Shape = {
              id: data.id,
              type: data.type,
              x: data.x,
              y: data.y,
              rotation: data.rotation || 0,
              opacity: data.opacity || 1,
              visible: data.visible !== false,
              locked: data.locked || false,
              zIndex: data.zIndex || 0,
              createdBy: data.createdBy,
              createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now(),
              updatedAt: data.updatedAt ? data.updatedAt.toMillis() : Date.now(),
              
              // Type-specific properties
              ...(data.type === 'rectangle' && {
                width: data.width,
                height: data.height,
                fill: data.fill,
                stroke: data.stroke,
                strokeWidth: data.strokeWidth,
                cornerRadius: data.cornerRadius,
              }),
              
              ...(data.type === 'circle' && {
                radius: data.radius,
                fill: data.fill,
                stroke: data.stroke,
                strokeWidth: data.strokeWidth,
              }),
              
              ...(data.type === 'line' && {
                x2: data.x2,
                y2: data.y2,
                stroke: data.stroke,
                strokeWidth: data.strokeWidth,
                lineCap: data.lineCap,
                dashArray: data.dashArray,
              }),
              
              ...(data.type === 'text' && {
                text: data.text,
                fontSize: data.fontSize,
                fontFamily: data.fontFamily,
                fontWeight: data.fontWeight,
                fontStyle: data.fontStyle,
                fill: data.fill,
                stroke: data.stroke,
                strokeWidth: data.strokeWidth,
                align: data.align,
                verticalAlign: data.verticalAlign,
                width: data.width,
                height: data.height,
              }),
            } as Shape;
            
            shapes.push(shape);
          }
        });

        onUpdate(shapes);
      },
      (error) => {
        console.error('Error subscribing to shapes:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Batch create multiple shapes efficiently using Firestore batch writes
   * Firestore supports up to 500 operations per batch
   */
  async batchCreateShapes(shapes: CreateShapeData[], userId: string): Promise<void> {
    const BATCH_SIZE = 500; // Firestore batch write limit
    const now = Timestamp.now();
    
    console.log(`🔥 Batch creating ${shapes.length} shapes (${Math.ceil(shapes.length / BATCH_SIZE)} batches)`);
    
    // Process in batches of 500 (Firestore limit)
    for (let i = 0; i < shapes.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchShapes = shapes.slice(i, Math.min(i + BATCH_SIZE, shapes.length));
      
      for (const shapeData of batchShapes) {
        const shapeRef = doc(collection(db, this.collectionPath), shapeData.id);
        const firestoreData: FirestoreShape = {
          ...prepareShapeForFirestore(shapeData),
          createdAt: now,
          updatedAt: now,
          lastModifiedBy: userId,
        };
        
        batch.set(shapeRef, firestoreData);
      }
      
      // Commit this batch
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(shapes.length / BATCH_SIZE)} committed (${batchShapes.length} shapes)`);
    }
    
    console.log(`🎉 Successfully created ${shapes.length} shapes in batched writes`);
  }

  /**
   * Batch update multiple shapes (for conflict resolution and bulk operations)
   */
  async batchUpdateShapes(
    updates: Array<{ id: string; data: Partial<Shape> }>,
    userId: string
  ): Promise<void> {
    // For simplicity, we'll do sequential updates
    // In production, consider using Firestore batch writes for better performance
    const updatePromises = updates.map(({ id, data }) =>
      this.updateShape(id, data, userId)
    );
    
    await Promise.all(updatePromises);
  }

  /**
   * Create a shape with defaults based on type
   */
  async createShapeWithDefaults(
    type: ShapeType,
    position: { x: number; y: number },
    userId: string,
    overrides?: Partial<Shape>
  ): Promise<string> {
    const id = generateShapeId(type);
    let shapeData: any;
    
    switch (type) {
      case 'rectangle':
        shapeData = {
          ...DEFAULT_RECTANGLE,
          id,
          x: position.x,
          y: position.y,
          ...overrides,
        };
        break;
      
      case 'circle':
        shapeData = {
          ...DEFAULT_CIRCLE,
          id,
          x: position.x,
          y: position.y,
          ...overrides,
        };
        break;
      
      case 'line':
        shapeData = {
          ...DEFAULT_LINE,
          id,
          x: position.x,
          y: position.y,
          x2: position.x + 100, // Default line length
          y2: position.y,
          ...overrides,
        };
        break;
      
      case 'text':
        shapeData = {
          ...DEFAULT_TEXT,
          id,
          x: position.x,
          y: position.y,
          text: (overrides as any)?.text || 'New Text',
          ...overrides,
        };
        break;
      
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
    
    await this.createShape(shapeData, userId);
    return id;
  }

  /**
   * Get shapes by type
   */
  async getShapesByType(shapes: Shape[], type: ShapeType): Promise<Shape[]> {
    return shapes.filter(shape => shape.type === type);
  }

  /**
   * Get the collection path (useful for security rules testing)
   */
  getCollectionPath(): string {
    return this.collectionPath;
  }

  /**
   * Legacy method support for backward compatibility with rectangles
   * @deprecated Use createShape instead
   */
  async createRectangle(rectangleData: any, userId?: string): Promise<void> {
    // Convert legacy rectangle data to new Shape format
    const shapeData: Shape = {
      id: rectangleData.id,
      type: 'rectangle',
      x: rectangleData.x,
      y: rectangleData.y,
      width: rectangleData.width,
      height: rectangleData.height,
      fill: rectangleData.fill,
      stroke: rectangleData.stroke,
      strokeWidth: rectangleData.strokeWidth,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 0,
    };
    
    await this.createShape(shapeData, userId || rectangleData.createdBy);
  }

  /**
   * Legacy method support for backward compatibility with rectangles
   * @deprecated Use updateShape instead  
   */
  async updateRectangle(rectangleId: string, updates: any, userId: string): Promise<void> {
    await this.updateShape(rectangleId, updates, userId);
  }

  /**
   * Legacy method support for backward compatibility with rectangles
   * @deprecated Use deleteShape instead
   */
  async deleteRectangle(rectangleId: string): Promise<void> {
    await this.deleteShape(rectangleId);
  }
}

// Export a singleton instance
export const shapesService = new ShapesService();

// Utility functions for shape creation
export const createRectangleShape = (
  position: { x: number; y: number },
  userId: string,
  overrides?: Partial<RectangleShape>
): RectangleShape => ({
  ...DEFAULT_RECTANGLE,
  id: generateShapeId('rectangle'),
  x: position.x,
  y: position.y,
  createdBy: userId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createCircleShape = (
  position: { x: number; y: number },
  userId: string,
  overrides?: Partial<CircleShape>
): CircleShape => ({
  ...DEFAULT_CIRCLE,
  id: generateShapeId('circle'),
  x: position.x,
  y: position.y,
  createdBy: userId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createLineShape = (
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  userId: string,
  overrides?: Partial<LineShape>
): LineShape => ({
  ...DEFAULT_LINE,
  id: generateShapeId('line'),
  x: startPos.x,
  y: startPos.y,
  x2: endPos.x,
  y2: endPos.y,
  createdBy: userId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createTextShape = (
  position: { x: number; y: number },
  text: string,
  userId: string,
  overrides?: Partial<TextShape>
): TextShape => ({
  ...DEFAULT_TEXT,
  id: generateShapeId('text'),
  x: position.x,
  y: position.y,
  text,
  createdBy: userId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Legacy compatibility exports
export const rectanglesService = shapesService; // Alias for backward compatibility
export const prepareRectangleForFirestore = prepareShapeForFirestore;
export const generateRectangleId = () => generateShapeId('rectangle');

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  type Unsubscribe,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AudioConnection } from '../types/connections';
import { generateConnectionId } from '../types/connections';

// Extended connection data for Firestore
export type FirestoreConnection = Omit<AudioConnection, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// Connections service class for managing Firestore operations
export class ConnectionsService {
  private canvasId: string = 'shared';

  /**
   * Set the canvas ID for this service
   */
  setCanvasId(canvasId: string): void {
    this.canvasId = canvasId;
  }

  /**
   * Get the current collection path
   */
  private getCollectionPath(): string {
    return `canvas/${this.canvasId}/connections`;
  }

  /**
   * Create a new audio connection between two shapes
   */
  async createConnection(
    sourceShapeId: string,
    targetShapeId: string,
    userId: string
  ): Promise<AudioConnection> {
    const connectionId = generateConnectionId();
    const connectionRef = doc(db, this.getCollectionPath(), connectionId);
    
    const now = Timestamp.now();
    const connectionData: FirestoreConnection = {
      id: connectionId,
      sourceShapeId,
      targetShapeId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(connectionRef, connectionData);
    
    // Return the connection with numeric timestamps
    return {
      ...connectionData,
      createdAt: now.toMillis(),
      updatedAt: now.toMillis(),
    };
  }

  /**
   * Delete a connection from Firestore
   */
  async deleteConnection(connectionId: string): Promise<void> {
    const connectionRef = doc(db, this.getCollectionPath(), connectionId);
    await deleteDoc(connectionRef);
  }

  /**
   * Get connection for a specific shape (either as source or target)
   */
  async getConnectionForShape(shapeId: string): Promise<AudioConnection | null> {
    // Query for connections where this shape is the source
    const sourceQuery = query(
      collection(db, this.getCollectionPath()),
      where('sourceShapeId', '==', shapeId)
    );
    
    const sourceSnapshot = await getDocs(sourceQuery);
    if (!sourceSnapshot.empty) {
      const data = sourceSnapshot.docs[0].data() as FirestoreConnection;
      return {
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      };
    }
    
    // Query for connections where this shape is the target
    const targetQuery = query(
      collection(db, this.getCollectionPath()),
      where('targetShapeId', '==', shapeId)
    );
    
    const targetSnapshot = await getDocs(targetQuery);
    if (!targetSnapshot.empty) {
      const data = targetSnapshot.docs[0].data() as FirestoreConnection;
      return {
        ...data,
        createdAt: data.createdAt.toMillis(),
        updatedAt: data.updatedAt.toMillis(),
      };
    }
    
    return null;
  }

  /**
   * Check if a shape already has a connection
   */
  async shapeHasConnection(shapeId: string): Promise<boolean> {
    const connection = await this.getConnectionForShape(shapeId);
    return connection !== null;
  }

  /**
   * Subscribe to real-time updates for all connections
   * Returns an unsubscribe function
   */
  subscribeToConnections(
    onUpdate: (connections: AudioConnection[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const connectionsQuery = query(
      collection(db, this.getCollectionPath()),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      connectionsQuery,
      (snapshot) => {
        const connections: AudioConnection[] = [];
        
        snapshot.forEach((docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as FirestoreConnection;
            
            // Convert Firestore data back to AudioConnection format
            const connection: AudioConnection = {
              id: data.id,
              sourceShapeId: data.sourceShapeId,
              targetShapeId: data.targetShapeId,
              createdBy: data.createdBy,
              createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now(),
              updatedAt: data.updatedAt ? data.updatedAt.toMillis() : Date.now(),
            };
            
            connections.push(connection);
          }
        });

        onUpdate(connections);
      },
      (error) => {
        console.error('Error subscribing to connections:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }
}

// Export singleton instance
export const connectionsService = new ConnectionsService();


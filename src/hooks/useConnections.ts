import { useState, useEffect, useCallback } from 'react';
import { connectionsService } from '../services/connectionsService';
import type { AudioConnection } from '../types/connections';

interface PendingConnection {
  sourceShapeId: string;
}

interface UseConnectionsReturn {
  connections: AudioConnection[];
  pendingConnection: PendingConnection | null;
  loading: boolean;
  error: string | null;
  startConnection: (sourceShapeId: string) => void;
  completeConnection: (targetShapeId: string, userId: string) => Promise<boolean>;
  cancelConnection: () => void;
  deleteConnection: (connectionId: string) => Promise<void>;
  getConnectionForShape: (shapeId: string) => AudioConnection | undefined;
  shapeHasConnection: (shapeId: string) => boolean;
  shapeHasOutgoingConnection: (shapeId: string) => boolean;
  shapeHasIncomingConnection: (shapeId: string) => boolean;
  clearError: () => void;
}

export const useConnections = (): UseConnectionsReturn => {
  const [connections, setConnections] = useState<AudioConnection[]>([]);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to connections from Firestore
  useEffect(() => {
    console.log('📡 Subscribing to audio connections...');
    
    const unsubscribe = connectionsService.subscribeToConnections(
      (updatedConnections) => {
        console.log(`✅ Loaded ${updatedConnections.length} connections`);
        setConnections(updatedConnections);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error subscribing to connections:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from connections');
      unsubscribe();
    };
  }, []);

  /**
   * Start creating a new connection (select source shape)
   */
  const startConnection = useCallback((sourceShapeId: string) => {
    console.log('🔗 Starting connection from shape:', sourceShapeId);
    setPendingConnection({ sourceShapeId });
    setError(null);
  }, []);

  /**
   * Complete the connection (select target shape)
   * Returns true if successful, false if validation fails
   */
  const completeConnection = useCallback(async (
    targetShapeId: string,
    userId: string
  ): Promise<boolean> => {
    if (!pendingConnection) {
      setError('No pending connection');
      return false;
    }

    const { sourceShapeId } = pendingConnection;

    // Validation
    if (sourceShapeId === targetShapeId) {
      setError('Cannot connect a shape to itself');
      return false;
    }

    // Check if source already has an outgoing arrow
    const sourceOutgoingConnection = connections.find(
      conn => conn.sourceShapeId === sourceShapeId
    );
    if (sourceOutgoingConnection) {
      setError('Source shape already has an outgoing connection');
      return false;
    }

    // Check if target already has an incoming arrow
    const targetIncomingConnection = connections.find(
      conn => conn.targetShapeId === targetShapeId
    );
    if (targetIncomingConnection) {
      setError('Target shape already has an incoming connection');
      return false;
    }

    try {
      console.log('🎯 Creating connection:', { sourceShapeId, targetShapeId });
      await connectionsService.createConnection(sourceShapeId, targetShapeId, userId);
      setPendingConnection(null);
      console.log('✅ Connection created successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create connection';
      console.error('❌ Failed to create connection:', err);
      setError(errorMessage);
      return false;
    }
  }, [pendingConnection, connections]);

  /**
   * Cancel the pending connection
   */
  const cancelConnection = useCallback(() => {
    console.log('❌ Canceling pending connection');
    setPendingConnection(null);
    setError(null);
  }, []);

  /**
   * Delete a connection
   */
  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      console.log('🗑️ Deleting connection:', connectionId);
      await connectionsService.deleteConnection(connectionId);
      console.log('✅ Connection deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete connection';
      console.error('❌ Failed to delete connection:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Get connection for a specific shape (if it exists)
   */
  const getConnectionForShape = useCallback((shapeId: string): AudioConnection | undefined => {
    return connections.find(
      conn => conn.sourceShapeId === shapeId || conn.targetShapeId === shapeId
    );
  }, [connections]);

  /**
   * Check if a shape has any connection (incoming or outgoing)
   */
  const shapeHasConnection = useCallback((shapeId: string): boolean => {
    return connections.some(
      conn => conn.sourceShapeId === shapeId || conn.targetShapeId === shapeId
    );
  }, [connections]);

  /**
   * Check if a shape has an outgoing connection
   */
  const shapeHasOutgoingConnection = useCallback((shapeId: string): boolean => {
    return connections.some(conn => conn.sourceShapeId === shapeId);
  }, [connections]);

  /**
   * Check if a shape has an incoming connection
   */
  const shapeHasIncomingConnection = useCallback((shapeId: string): boolean => {
    return connections.some(conn => conn.targetShapeId === shapeId);
  }, [connections]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connections,
    pendingConnection,
    loading,
    error,
    startConnection,
    completeConnection,
    cancelConnection,
    deleteConnection,
    getConnectionForShape,
    shapeHasConnection,
    shapeHasOutgoingConnection,
    shapeHasIncomingConnection,
    clearError,
  };
};


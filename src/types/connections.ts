// Audio Connection Type System for CollabCanvas
// Represents arrow connections between shapes
// Each shape can have one incoming arrow and one outgoing arrow

export interface AudioConnection {
  id: string;
  sourceShapeId: string;  // ID of the source shape
  targetShapeId: string;  // ID of the target shape
  createdBy: string;      // User ID who created the connection
  createdAt: number;      // Timestamp when created
  updatedAt: number;      // Timestamp when last updated
}

// Helper type for creating new connections
export type CreateConnectionData = Omit<AudioConnection, 'createdAt' | 'updatedAt'>;

// Type guard to check if a value is an AudioConnection
export function isAudioConnection(obj: any): obj is AudioConnection {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.sourceShapeId === 'string' &&
    typeof obj.targetShapeId === 'string' &&
    typeof obj.createdBy === 'string' &&
    typeof obj.createdAt === 'number' &&
    typeof obj.updatedAt === 'number'
  );
}

// Generate a unique connection ID
export function generateConnectionId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}


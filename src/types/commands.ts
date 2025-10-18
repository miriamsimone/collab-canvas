// Command Pattern Types for Undo/Redo System

import type { Shape } from './shapes';

/**
 * Base Command interface - all commands must implement execute and undo
 */
export interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  readonly description: string; // Human-readable description for UI
}

/**
 * Command data for creating a shape
 */
export interface CreateShapeCommandData {
  shape: Shape;
}

/**
 * Command data for deleting a shape
 */
export interface DeleteShapeCommandData {
  shape: Shape;
}

/**
 * Command data for moving a shape
 */
export interface MoveShapeCommandData {
  shapeId: string;
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
}

/**
 * Command data for resizing a shape
 */
export interface ResizeShapeCommandData {
  shapeId: string;
  oldDimensions: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    x2?: number;
    y2?: number;
  };
  newDimensions: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    x2?: number;
    y2?: number;
  };
}

/**
 * Command data for updating shape properties
 */
export interface UpdateShapeCommandData {
  shapeId: string;
  oldProperties: Partial<Shape>;
  newProperties: Partial<Shape>;
}

/**
 * Command data for batch operations (multi-select operations)
 */
export interface BatchCommandData {
  commands: Command[];
}

/**
 * Command data for text editing
 */
export interface UpdateTextCommandData {
  shapeId: string;
  oldText: string;
  newText: string;
}

/**
 * Command data for AI-generated operations
 */
export interface AICommandData {
  commandId: string;
  prompt: string;
  createdShapes: Shape[];
  modifiedShapes: Array<{
    shapeId: string;
    oldState: Shape;
    newState: Shape;
  }>;
  deletedShapes: Shape[];
}

/**
 * Command history entry
 */
export interface CommandHistoryEntry {
  command: Command;
  timestamp: number;
  userId?: string;
  description: string;
}

/**
 * Undo/Redo manager state
 */
export interface UndoRedoState {
  undoStack: CommandHistoryEntry[];
  redoStack: CommandHistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
  historyLimit: number;
}


// Command Service - Manages undo/redo stacks and command execution

import type { 
  Command, 
  CommandHistoryEntry, 
  CreateShapeCommandData,
  DeleteShapeCommandData,
  MoveShapeCommandData,
  ResizeShapeCommandData,
  UpdateShapeCommandData,
  UpdateTextCommandData,
  BatchCommandData,
  AICommandData,
} from '../types/commands';
import type { Shape } from '../types/shapes';
import { shapesService } from './shapesService';

/**
 * Generate a unique command ID
 */
function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * CreateShapeCommand - Handles creating a new shape
 */
export class CreateShapeCommand implements Command {
  readonly id: string;
  readonly type = 'create';
  readonly timestamp: number;
  readonly description: string;
  
  private data: CreateShapeCommandData;
  private userId: string;
  
  constructor(data: CreateShapeCommandData, userId: string) {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `Create ${data.shape.type}`;
  }
  
  async execute(): Promise<void> {
    await shapesService.createShape(this.data.shape, this.userId);
  }
  
  async undo(): Promise<void> {
    await shapesService.deleteShape(this.data.shape.id);
  }
}

/**
 * DeleteShapeCommand - Handles deleting a shape
 */
export class DeleteShapeCommand implements Command {
  readonly id: string;
  readonly type = 'delete';
  readonly timestamp: number;
  readonly description: string;
  
  private data: DeleteShapeCommandData;
  private userId: string;
  
  constructor(data: DeleteShapeCommandData, userId: string) {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `Delete ${data.shape.type}`;
  }
  
  async execute(): Promise<void> {
    await shapesService.deleteShape(this.data.shape.id);
  }
  
  async undo(): Promise<void> {
    // Recreate the deleted shape
    await shapesService.createShape(this.data.shape, this.userId);
  }
}

/**
 * MoveShapeCommand - Handles moving a shape
 */
export class MoveShapeCommand implements Command {
  readonly id: string;
  readonly type = 'move';
  readonly timestamp: number;
  readonly description: string;
  
  private data: MoveShapeCommandData;
  private userId: string;
  
  constructor(data: MoveShapeCommandData, userId: string) {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `Move shape`;
  }
  
  async execute(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId, 
      { x: this.data.newX, y: this.data.newY },
      this.userId
    );
  }
  
  async undo(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      { x: this.data.oldX, y: this.data.oldY },
      this.userId
    );
  }
}

/**
 * ResizeShapeCommand - Handles resizing/transforming a shape
 */
export class ResizeShapeCommand implements Command {
  readonly id: string;
  readonly type = 'resize';
  readonly timestamp: number;
  readonly description: string;
  
  private data: ResizeShapeCommandData;
  private userId: string;
  
  constructor(data: ResizeShapeCommandData, userId: string) {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `Resize shape`;
  }
  
  async execute(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      this.data.newDimensions as Partial<Shape>,
      this.userId
    );
  }
  
  async undo(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      this.data.oldDimensions as Partial<Shape>,
      this.userId
    );
  }
}

/**
 * UpdateShapeCommand - Handles updating shape properties (color, stroke, etc.)
 */
export class UpdateShapeCommand implements Command {
  readonly id: string;
  readonly type = 'update';
  readonly timestamp: number;
  readonly description: string;
  
  private data: UpdateShapeCommandData;
  private userId: string;
  
  constructor(data: UpdateShapeCommandData, userId: string) {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `Update shape properties`;
  }
  
  async execute(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      this.data.newProperties,
      this.userId
    );
  }
  
  async undo(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      this.data.oldProperties,
      this.userId
    );
  }
}

/**
 * UpdateTextCommand - Handles updating text content
 */
export class UpdateTextCommand implements Command {
  readonly id: string;
  readonly type = 'updateText';
  readonly timestamp: number;
  readonly description: string;
  
  private data: UpdateTextCommandData;
  private userId: string;
  
  constructor(data: UpdateTextCommandData, userId: string) {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `Update text`;
  }
  
  async execute(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      { text: this.data.newText },
      this.userId
    );
  }
  
  async undo(): Promise<void> {
    await shapesService.updateShape(
      this.data.shapeId,
      { text: this.data.oldText },
      this.userId
    );
  }
}

/**
 * BatchCommand - Executes multiple commands as a single undoable operation
 */
export class BatchCommand implements Command {
  readonly id: string;
  readonly type = 'batch';
  readonly timestamp: number;
  readonly description: string;
  
  private data: BatchCommandData;
  
  constructor(data: BatchCommandData, description: string = 'Batch operation') {
    this.id = generateCommandId();
    this.timestamp = Date.now();
    this.data = data;
    this.description = description;
  }
  
  async execute(): Promise<void> {
    // Execute all commands in order
    for (const command of this.data.commands) {
      await command.execute();
    }
  }
  
  async undo(): Promise<void> {
    // Undo all commands in reverse order
    for (let i = this.data.commands.length - 1; i >= 0; i--) {
      await this.data.commands[i].undo();
    }
  }
}

/**
 * AICommand - Handles AI-generated operations
 */
export class AICommand implements Command {
  readonly id: string;
  readonly type = 'ai';
  readonly timestamp: number;
  readonly description: string;
  
  private data: AICommandData;
  private userId: string;
  
  constructor(data: AICommandData, userId: string) {
    this.id = data.commandId;
    this.timestamp = Date.now();
    this.data = data;
    this.userId = userId;
    this.description = `AI: ${data.prompt.substring(0, 50)}...`;
  }
  
  async execute(): Promise<void> {
    // AI commands are already executed when created
    // This is a no-op for execute
  }
  
  async undo(): Promise<void> {
    // Delete all created shapes
    for (const shape of this.data.createdShapes) {
      await shapesService.deleteShape(shape.id);
    }
    
    // Restore modified shapes to old state
    for (const { shapeId, oldState } of this.data.modifiedShapes) {
      await shapesService.updateShape(shapeId, oldState, this.userId);
    }
    
    // Restore deleted shapes
    for (const shape of this.data.deletedShapes) {
      await shapesService.createShape(shape, this.userId);
    }
  }
}

/**
 * CommandService - Manages command execution and undo/redo stacks
 */
class CommandService {
  private undoStack: CommandHistoryEntry[] = [];
  private redoStack: CommandHistoryEntry[] = [];
  private readonly maxHistorySize = 50;
  private listeners: Set<() => void> = new Set();
  
  /**
   * Execute a command and add it to the undo stack
   */
  async executeCommand(command: Command, userId?: string): Promise<void> {
    try {
      await command.execute();
      
      // Add to undo stack
      this.undoStack.push({
        command,
        timestamp: Date.now(),
        userId,
        description: command.description,
      });
      
      // Clear redo stack when new command is executed
      this.redoStack = [];
      
      // Limit stack size
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Command execution failed:', error);
      throw error;
    }
  }
  
  /**
   * Undo the last command
   */
  async undo(): Promise<void> {
    const entry = this.undoStack.pop();
    if (!entry) {
      console.warn('Nothing to undo');
      return;
    }
    
    try {
      await entry.command.undo();
      this.redoStack.push(entry);
      this.notifyListeners();
    } catch (error) {
      console.error('Undo failed:', error);
      // Push back to undo stack on failure
      this.undoStack.push(entry);
      throw error;
    }
  }
  
  /**
   * Redo the last undone command
   */
  async redo(): Promise<void> {
    const entry = this.redoStack.pop();
    if (!entry) {
      console.warn('Nothing to redo');
      return;
    }
    
    try {
      await entry.command.execute();
      this.undoStack.push(entry);
      this.notifyListeners();
    } catch (error) {
      console.error('Redo failed:', error);
      // Push back to redo stack on failure
      this.redoStack.push(entry);
      throw error;
    }
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  /**
   * Get the undo stack
   */
  getUndoStack(): readonly CommandHistoryEntry[] {
    return [...this.undoStack];
  }
  
  /**
   * Get the redo stack
   */
  getRedoStack(): readonly CommandHistoryEntry[] {
    return [...this.redoStack];
  }
  
  /**
   * Clear both stacks
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }
  
  /**
   * Subscribe to stack changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Notify all listeners of stack changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const commandService = new CommandService();
export default commandService;

// Export command classes for direct use
export {
  CreateShapeCommand,
  DeleteShapeCommand,
  MoveShapeCommand,
  ResizeShapeCommand,
  UpdateShapeCommand,
  UpdateTextCommand,
  BatchCommand,
  AICommand,
};


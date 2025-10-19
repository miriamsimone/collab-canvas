// Shape Type System for CollabCanvas
// Supports rectangles, circles, lines, and text with unified interface

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'text';

// Base shape properties shared by all shapes
export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean; // Permanent lock flag
  zIndex?: number;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  // Runtime lock information (from RTDB)
  isLockedByOther?: boolean;
  lockedBy?: string;
  lockedByName?: string;
  // Audio recording information
  audioUrl?: string;           // Firebase Storage download URL
  audioRecordedBy?: string;    // User ID who recorded
  audioRecordedAt?: number;    // Timestamp of recording
  audioDuration?: number;      // Duration in seconds
  // Audio connection information
  audioConnectionId?: string;  // ID of connection this shape is part of
  // Ramble start marker
  isRambleStart?: boolean;     // Marks this shape as the starting point of a ramble
}

// Rectangle-specific properties
export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}

// Circle-specific properties  
export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

// Line-specific properties
export interface LineShape extends BaseShape {
  type: 'line';
  x2: number; // End point x (start point is x, y from BaseShape)
  y2: number; // End point y
  stroke: string;
  strokeWidth: number;
  lineCap?: 'butt' | 'round' | 'square';
  dashArray?: number[]; // For dashed lines
}

// Text-specific properties
export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  width?: number; // For text wrapping
  height?: number; // For text box
}

// Discriminated union of all shape types
export type Shape = RectangleShape | CircleShape | LineShape | TextShape;

// Type guards for shape identification
export const isRectangle = (shape: Shape): shape is RectangleShape => shape.type === 'rectangle';
export const isCircle = (shape: Shape): shape is CircleShape => shape.type === 'circle';
export const isLine = (shape: Shape): shape is LineShape => shape.type === 'line';
export const isText = (shape: Shape): shape is TextShape => shape.type === 'text';

// Shape creation defaults
export const DEFAULT_RECTANGLE: Omit<RectangleShape, 'id' | 'x' | 'y'> = {
  type: 'rectangle',
  width: 120,
  height: 80,
  fill: '#007acc40', // Semi-transparent blue
  stroke: '#007acc',
  strokeWidth: 2,
  cornerRadius: 0,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 0,
};

export const DEFAULT_CIRCLE: Omit<CircleShape, 'id' | 'x' | 'y'> = {
  type: 'circle',
  radius: 50,
  fill: '#28a74540', // Semi-transparent green
  stroke: '#28a745',
  strokeWidth: 2,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 0,
};

export const DEFAULT_LINE: Omit<LineShape, 'id' | 'x' | 'y' | 'x2' | 'y2'> = {
  type: 'line',
  stroke: '#dc354540',
  strokeWidth: 2,
  lineCap: 'round',
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 0,
};

export const DEFAULT_TEXT: Omit<TextShape, 'id' | 'x' | 'y' | 'text'> = {
  type: 'text',
  fontSize: 16,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fill: '#000000',
  stroke: '#000000',
  strokeWidth: 0,
  align: 'left',
  verticalAlign: 'top',
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 0,
};

// Shape manipulation utilities
export interface ShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Calculate bounding box for any shape type
export const getShapeBounds = (shape: Shape): ShapeBounds => {
  switch (shape.type) {
    case 'rectangle':
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    
    case 'circle':
      return {
        x: shape.x - shape.radius,
        y: shape.y - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
      };
    
    case 'line':
      const minX = Math.min(shape.x, shape.x2);
      const maxX = Math.max(shape.x, shape.x2);
      const minY = Math.min(shape.y, shape.y2);
      const maxY = Math.max(shape.y, shape.y2);
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    
    case 'text':
      // Approximate text bounds (will be refined when rendering)
      const approximateWidth = shape.width || shape.text.length * shape.fontSize * 0.6;
      const approximateHeight = shape.height || shape.fontSize * 1.2;
      return {
        x: shape.x,
        y: shape.y,
        width: approximateWidth,
        height: approximateHeight,
      };
    
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = shape;
      throw new Error(`Unknown shape type: ${(_exhaustive as Shape).type}`);
  }
};

// Get shape center point
export const getShapeCenter = (shape: Shape): { x: number; y: number } => {
  const bounds = getShapeBounds(shape);
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
};

// Check if point is inside shape (for selection/hit testing)
export const isPointInShape = (point: { x: number; y: number }, shape: Shape): boolean => {
  const bounds = getShapeBounds(shape);
  
  switch (shape.type) {
    case 'rectangle':
      return (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      );
    
    case 'circle':
      const distance = Math.sqrt(
        Math.pow(point.x - shape.x, 2) + Math.pow(point.y - shape.y, 2)
      );
      return distance <= shape.radius;
    
    case 'line':
      // Simple line hit testing (within stroke width tolerance)
      const tolerance = Math.max(shape.strokeWidth / 2, 5);
      const lineLength = Math.sqrt(
        Math.pow(shape.x2 - shape.x, 2) + Math.pow(shape.y2 - shape.y, 2)
      );
      
      if (lineLength === 0) return false;
      
      const t = Math.max(0, Math.min(1, (
        (point.x - shape.x) * (shape.x2 - shape.x) + 
        (point.y - shape.y) * (shape.y2 - shape.y)
      ) / (lineLength * lineLength)));
      
      const projection = {
        x: shape.x + t * (shape.x2 - shape.x),
        y: shape.y + t * (shape.y2 - shape.y),
      };
      
      const distanceToLine = Math.sqrt(
        Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2)
      );
      
      return distanceToLine <= tolerance;
    
    case 'text':
      // Simple bounding box check for text
      return (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
      );
    
    default:
      return false;
  }
};

// Generate unique shape ID
export const generateShapeId = (type: ShapeType): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${type}-${timestamp}-${random}`;
};

// Convert legacy rectangle data to new shape format
export const rectangleToShape = (rectangle: any): RectangleShape => {
  return {
    id: rectangle.id,
    type: 'rectangle',
    x: rectangle.x,
    y: rectangle.y,
    width: rectangle.width,
    height: rectangle.height,
    fill: rectangle.fill,
    stroke: rectangle.stroke,
    strokeWidth: rectangle.strokeWidth,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

// Firestore data preparation
export const prepareShapeForFirestore = (shape: Shape, userId: string) => {
  return {
    ...shape,
    createdBy: userId,
    updatedAt: Date.now(),
  };
};

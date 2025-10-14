import Konva from 'konva';

// Canvas dimensions
export const CANVAS_DIMENSIONS = {
  WIDTH: 5000,
  HEIGHT: 5000,
} as const;

// Coordinate system types
export interface Point {
  x: number;
  y: number;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Convert screen coordinates to canvas coordinates
 * Takes into account pan and zoom transformations
 */
export const screenToCanvas = (
  screenPoint: Point,
  transform: CanvasTransform
): Point => {
  return {
    x: (screenPoint.x - transform.x) / transform.scaleX,
    y: (screenPoint.y - transform.y) / transform.scaleY,
  };
};

/**
 * Convert canvas coordinates to screen coordinates
 * Takes into account pan and zoom transformations
 */
export const canvasToScreen = (
  canvasPoint: Point,
  transform: CanvasTransform
): Point => {
  return {
    x: canvasPoint.x * transform.scaleX + transform.x,
    y: canvasPoint.y * transform.scaleY + transform.y,
  };
};

/**
 * Get the current transformation from a Konva stage
 */
export const getStageTransform = (stage: Konva.Stage): CanvasTransform => {
  const position = stage.position();
  const scale = stage.scale();
  
  return {
    x: position.x,
    y: position.y,
    scaleX: scale.x,
    scaleY: scale.y,
  };
};

/**
 * Get pointer position relative to canvas coordinates
 */
export const getCanvasPointerPosition = (stage: Konva.Stage): Point | null => {
  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return null;
  
  const transform = getStageTransform(stage);
  return screenToCanvas(pointerPosition, transform);
};

/**
 * Check if a point is within canvas bounds
 */
export const isPointInCanvas = (point: Point): boolean => {
  return (
    point.x >= 0 && 
    point.x <= CANVAS_DIMENSIONS.WIDTH &&
    point.y >= 0 && 
    point.y <= CANVAS_DIMENSIONS.HEIGHT
  );
};

/**
 * Clamp coordinates to canvas bounds
 */
export const clampToCanvas = (point: Point): Point => {
  return {
    x: Math.max(0, Math.min(point.x, CANVAS_DIMENSIONS.WIDTH)),
    y: Math.max(0, Math.min(point.y, CANVAS_DIMENSIONS.HEIGHT)),
  };
};

/**
 * Calculate distance between two points
 */
export const distance = (point1: Point, point2: Point): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the center point of a rectangle
 */
export const getRectCenter = (x: number, y: number, width: number, height: number): Point => {
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
};

/**
 * Generate grid lines for canvas background
 */
export const generateGridLines = (
  gridSize: number = 50,
  canvasWidth: number = CANVAS_DIMENSIONS.WIDTH,
  canvasHeight: number = CANVAS_DIMENSIONS.HEIGHT
): { vertical: number[]; horizontal: number[] } => {
  const vertical: number[] = [];
  const horizontal: number[] = [];
  
  // Generate vertical lines
  for (let x = 0; x <= canvasWidth; x += gridSize) {
    vertical.push(x);
  }
  
  // Generate horizontal lines
  for (let y = 0; y <= canvasHeight; y += gridSize) {
    horizontal.push(y);
  }
  
  return { vertical, horizontal };
};

/**
 * Snap coordinate to grid
 */
export const snapToGrid = (coord: number, gridSize: number = 20): number => {
  return Math.round(coord / gridSize) * gridSize;
};

/**
 * Snap point to grid
 */
export const snapPointToGrid = (point: Point, gridSize: number = 20): Point => {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
};

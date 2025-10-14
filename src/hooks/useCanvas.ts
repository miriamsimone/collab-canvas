import { useState, useCallback } from 'react';
import Konva from 'konva';
import { type ToolType } from '../components/Toolbar';

// Canvas configuration constants
export const CANVAS_CONFIG = {
  WIDTH: 5000,
  HEIGHT: 5000,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3,
  ZOOM_SPEED: 0.1,
} as const;

export interface CanvasState {
  scale: number;
  x: number;
  y: number;
  isDragging: boolean;
  activeTool: ToolType;
}

export interface CanvasActions {
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  setIsDragging: (isDragging: boolean) => void;
  setActiveTool: (tool: ToolType) => void;
  handleZoom: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  resetView: () => void;
  centerView: (containerWidth: number, containerHeight: number) => void;
}

export const useCanvas = (): CanvasState & CanvasActions => {
  const [scale, setScale] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('rectangle');

  // Set canvas position
  const setPosition = useCallback((newX: number, newY: number) => {
    setX(newX);
    setY(newY);
  }, []);

  // Handle mouse wheel zoom
  const handleZoom = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate new scale
    const deltaY = e.evt.deltaY;
    const scaleBy = 1 + CANVAS_CONFIG.ZOOM_SPEED * (deltaY > 0 ? -1 : 1);
    const newScale = Math.min(
      Math.max(oldScale * scaleBy, CANVAS_CONFIG.MIN_ZOOM),
      CANVAS_CONFIG.MAX_ZOOM
    );

    // Calculate new position to zoom towards pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newX = pointer.x - mousePointTo.x * newScale;
    const newY = pointer.y - mousePointTo.y * newScale;

    // Update state
    setScale(newScale);
    setPosition(newX, newY);
    
    // Update stage
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: newX, y: newY });
  }, [setPosition]);

  // Reset view to default
  const resetView = useCallback(() => {
    setScale(1);
    setPosition(0, 0);
  }, [setPosition]);

  // Center view on canvas
  const centerView = useCallback((containerWidth: number, containerHeight: number) => {
    const newX = (containerWidth - CANVAS_CONFIG.WIDTH) / 2;
    const newY = (containerHeight - CANVAS_CONFIG.HEIGHT) / 2;
    setPosition(newX, newY);
    setScale(1);
  }, [setPosition]);

  return {
    scale,
    x,
    y,
    isDragging,
    activeTool,
    setScale,
    setPosition,
    setIsDragging,
    setActiveTool,
    handleZoom,
    resetView,
    centerView,
  };
};

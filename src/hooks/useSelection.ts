import { useState, useCallback, useEffect } from 'react';
import { CanvasObjectData } from '../components/CanvasObject';

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseSelectionState {
  selectedIds: Set<string>;
  selectionBounds: SelectionBounds | null;
  isDragSelecting: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragCurrentPos: { x: number; y: number } | null;
}

interface UseSelectionActions {
  selectObject: (id: string) => void;
  deselectObject: (id: string) => void;
  toggleSelection: (id: string) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (objects: CanvasObjectData[]) => void;
  selectMultiple: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  getSelectedObjects: (allObjects: CanvasObjectData[]) => CanvasObjectData[];
  // Drag selection
  startDragSelection: (x: number, y: number) => void;
  updateDragSelection: (x: number, y: number) => void;
  endDragSelection: (objects: CanvasObjectData[]) => void;
  // Selection queries for AI
  selectByType: (objects: CanvasObjectData[], type?: string) => void;
  selectByColor: (objects: CanvasObjectData[], color: string) => void;
  selectByPosition: (objects: CanvasObjectData[], criteria: 'top-half' | 'bottom-half' | 'left-half' | 'right-half', canvasSize: { width: number; height: number }) => void;
}

export const useSelection = (): UseSelectionState & UseSelectionActions => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);

  // Calculate selection bounding box
  const calculateSelectionBounds = useCallback((objects: CanvasObjectData[], selectedObjectIds: Set<string>): SelectionBounds | null => {
    const selectedObjects = objects.filter(obj => selectedObjectIds.has(obj.id));
    
    if (selectedObjects.length === 0) {
      return null;
    }

    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      return {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };
    }

    // Calculate bounds for multiple objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedObjects.forEach(obj => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, []);

  // Basic selection operations
  const selectObject = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
  }, []);

  const deselectObject = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const addToSelection = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback((objects: CanvasObjectData[]) => {
    setSelectedIds(new Set(objects.map(obj => obj.id)));
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedObjects = useCallback((allObjects: CanvasObjectData[]): CanvasObjectData[] => {
    return allObjects.filter(obj => selectedIds.has(obj.id));
  }, [selectedIds]);

  // Drag selection operations
  const startDragSelection = useCallback((x: number, y: number) => {
    setIsDragSelecting(true);
    setDragStartPos({ x, y });
    setDragCurrentPos({ x, y });
  }, []);

  const updateDragSelection = useCallback((x: number, y: number) => {
    if (isDragSelecting) {
      setDragCurrentPos({ x, y });
    }
  }, [isDragSelecting]);

  const endDragSelection = useCallback((objects: CanvasObjectData[]) => {
    if (!isDragSelecting || !dragStartPos || !dragCurrentPos) {
      setIsDragSelecting(false);
      setDragStartPos(null);
      setDragCurrentPos(null);
      return;
    }

    // Calculate selection rectangle
    const selectionRect = {
      x: Math.min(dragStartPos.x, dragCurrentPos.x),
      y: Math.min(dragStartPos.y, dragCurrentPos.y),
      width: Math.abs(dragCurrentPos.x - dragStartPos.x),
      height: Math.abs(dragCurrentPos.y - dragStartPos.y),
    };

    // Find objects that intersect with selection rectangle
    const intersectingObjects = objects.filter(obj => {
      // Check if object intersects with selection rectangle
      return !(
        obj.x > selectionRect.x + selectionRect.width ||
        obj.x + obj.width < selectionRect.x ||
        obj.y > selectionRect.y + selectionRect.height ||
        obj.y + obj.height < selectionRect.y
      );
    });

    // Select all intersecting objects
    setSelectedIds(new Set(intersectingObjects.map(obj => obj.id)));

    // Reset drag state
    setIsDragSelecting(false);
    setDragStartPos(null);
    setDragCurrentPos(null);
  }, [isDragSelecting, dragStartPos, dragCurrentPos]);

  // AI-powered selection operations
  const selectByType = useCallback((objects: CanvasObjectData[], type?: string) => {
    // For now, since we only have rectangles, select all
    // This will be extended when we add circles, text, etc.
    const matchingObjects = type 
      ? objects.filter(obj => (obj as any).type === type)
      : objects; // Select all if no type specified
    
    setSelectedIds(new Set(matchingObjects.map(obj => obj.id)));
  }, []);

  const selectByColor = useCallback((objects: CanvasObjectData[], color: string) => {
    // Normalize color format for comparison
    const normalizeColor = (c: string) => c.toLowerCase().replace(/[^a-f0-9]/g, '');
    const targetColor = normalizeColor(color);

    const matchingObjects = objects.filter(obj => {
      const objFill = normalizeColor(obj.fill);
      const objStroke = normalizeColor(obj.stroke);
      return objFill.includes(targetColor) || objStroke.includes(targetColor);
    });

    setSelectedIds(new Set(matchingObjects.map(obj => obj.id)));
  }, []);

  const selectByPosition = useCallback((
    objects: CanvasObjectData[], 
    criteria: 'top-half' | 'bottom-half' | 'left-half' | 'right-half',
    canvasSize: { width: number; height: number }
  ) => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    const matchingObjects = objects.filter(obj => {
      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;

      switch (criteria) {
        case 'top-half':
          return objCenterY < centerY;
        case 'bottom-half':
          return objCenterY > centerY;
        case 'left-half':
          return objCenterX < centerX;
        case 'right-half':
          return objCenterX > centerX;
        default:
          return false;
      }
    });

    setSelectedIds(new Set(matchingObjects.map(obj => obj.id)));
  }, []);

  // Update selection bounds when selection changes
  const updateSelectionBounds = useCallback((objects: CanvasObjectData[]) => {
    const bounds = calculateSelectionBounds(objects, selectedIds);
    setSelectionBounds(bounds);
  }, [selectedIds, calculateSelectionBounds]);

  return {
    // State
    selectedIds,
    selectionBounds,
    isDragSelecting,
    dragStartPos,
    dragCurrentPos,
    
    // Actions
    selectObject,
    deselectObject,
    toggleSelection,
    addToSelection,
    clearSelection,
    selectAll,
    selectMultiple,
    isSelected,
    getSelectedObjects,
    
    // Drag selection
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    
    // AI-powered selections
    selectByType,
    selectByColor,
    selectByPosition,
  };
};

import { useState, useCallback } from 'react';
import type { Shape } from '../types/shapes';
import { findObjectsInSelection, findObjectsByColor, findObjectsByPosition } from '../utils/selectionHelpers';

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
  selectAll: (objects: Shape[]) => void;
  selectMultiple: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  getSelectedObjects: (allObjects: Shape[]) => Shape[];
  // Drag selection
  startDragSelection: (x: number, y: number) => void;
  updateDragSelection: (x: number, y: number) => void;
  endDragSelection: (objects: Shape[]) => void;
  // Selection queries for AI
  selectByType: (objects: Shape[], type?: string) => void;
  selectByColor: (objects: Shape[], color: string) => void;
  selectByPosition: (objects: Shape[], criteria: 'top-half' | 'bottom-half' | 'left-half' | 'right-half', canvasSize: { width: number; height: number }) => void;
}

export const useSelection = (): UseSelectionState & UseSelectionActions => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionBounds] = useState<SelectionBounds | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);

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

  const selectAll = useCallback((objects: Shape[]) => {
    setSelectedIds(new Set(objects.map(obj => obj.id)));
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedObjects = useCallback((allObjects: Shape[]): Shape[] => {
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

  const endDragSelection = useCallback((objects: Shape[]) => {
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

    // Find objects that intersect with selection rectangle using helper function
    const intersectingObjects = findObjectsInSelection(objects, selectionRect);

    // Select all intersecting objects
    setSelectedIds(new Set(intersectingObjects.map(obj => obj.id)));

    // Reset drag state
    setIsDragSelecting(false);
    setDragStartPos(null);
    setDragCurrentPos(null);
  }, [isDragSelecting, dragStartPos, dragCurrentPos]);

  // AI-powered selection operations
  const selectByType = useCallback((objects: Shape[], type?: string) => {
    const matchingObjects = type 
      ? objects.filter(obj => obj.type === type)
      : objects; // Select all if no type specified
    
    setSelectedIds(new Set(matchingObjects.map(obj => obj.id)));
  }, []);

  const selectByColor = useCallback((objects: Shape[], color: string) => {
    const matchingObjects = findObjectsByColor(objects, color);
    setSelectedIds(new Set(matchingObjects.map(obj => obj.id)));
  }, []);

  const selectByPosition = useCallback((
    objects: Shape[], 
    criteria: 'top-half' | 'bottom-half' | 'left-half' | 'right-half',
    canvasSize: { width: number; height: number }
  ) => {
    const matchingObjects = findObjectsByPosition(objects, criteria, canvasSize);
    setSelectedIds(new Set(matchingObjects.map(obj => obj.id)));
  }, []);

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

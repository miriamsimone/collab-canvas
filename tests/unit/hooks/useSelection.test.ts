import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSelection } from '../../../src/hooks/useSelection';
import { CanvasObjectData } from '../../../src/components/CanvasObject';

// Mock test data
const mockRectangles: CanvasObjectData[] = [
  {
    id: 'rect1',
    x: 100,
    y: 100,
    width: 150,
    height: 100,
    fill: '#ff0000',
    stroke: '#ff0000',
    strokeWidth: 2,
  },
  {
    id: 'rect2',
    x: 300,
    y: 200,
    width: 120,
    height: 80,
    fill: '#00ff00',
    stroke: '#00ff00',
    strokeWidth: 2,
  },
  {
    id: 'rect3',
    x: 500,
    y: 150,
    width: 100,
    height: 150,
    fill: '#0000ff',
    stroke: '#0000ff',
    strokeWidth: 2,
  },
];

describe('useSelection', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useSelection());
    
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.selectionBounds).toBeNull();
    expect(result.current.isDragSelecting).toBe(false);
  });

  it('should select a single object', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectObject('rect1');
    });
    
    expect(result.current.selectedIds.has('rect1')).toBe(true);
    expect(result.current.selectedIds.size).toBe(1);
    expect(result.current.isSelected('rect1')).toBe(true);
  });

  it('should toggle selection', () => {
    const { result } = renderHook(() => useSelection());
    
    // First toggle should select
    act(() => {
      result.current.toggleSelection('rect1');
    });
    expect(result.current.isSelected('rect1')).toBe(true);
    
    // Second toggle should deselect
    act(() => {
      result.current.toggleSelection('rect1');
    });
    expect(result.current.isSelected('rect1')).toBe(false);
  });

  it('should select multiple objects', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectMultiple(['rect1', 'rect2']);
    });
    
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.isSelected('rect1')).toBe(true);
    expect(result.current.isSelected('rect2')).toBe(true);
  });

  it('should select all objects', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectAll(mockRectangles);
    });
    
    expect(result.current.selectedIds.size).toBe(3);
    mockRectangles.forEach(rect => {
      expect(result.current.isSelected(rect.id)).toBe(true);
    });
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useSelection());
    
    // First select some objects
    act(() => {
      result.current.selectAll(mockRectangles);
    });
    expect(result.current.selectedIds.size).toBe(3);
    
    // Then clear
    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should get selected objects', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectMultiple(['rect1', 'rect3']);
    });
    
    const selectedObjects = result.current.getSelectedObjects(mockRectangles);
    expect(selectedObjects).toHaveLength(2);
    expect(selectedObjects[0].id).toBe('rect1');
    expect(selectedObjects[1].id).toBe('rect3');
  });

  it('should handle drag selection', () => {
    const { result } = renderHook(() => useSelection());
    
    // Start drag selection
    act(() => {
      result.current.startDragSelection(50, 50);
    });
    expect(result.current.isDragSelecting).toBe(true);
    expect(result.current.dragStartPos).toEqual({ x: 50, y: 50 });
    
    // Update drag selection
    act(() => {
      result.current.updateDragSelection(200, 150);
    });
    expect(result.current.dragCurrentPos).toEqual({ x: 200, y: 150 });
    
    // End drag selection (should select rect1 which intersects)
    act(() => {
      result.current.endDragSelection(mockRectangles);
    });
    expect(result.current.isDragSelecting).toBe(false);
    expect(result.current.isSelected('rect1')).toBe(true);
  });

  it('should select by color', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectByColor(mockRectangles, '#ff0000');
    });
    
    expect(result.current.isSelected('rect1')).toBe(true);
    expect(result.current.isSelected('rect2')).toBe(false);
    expect(result.current.isSelected('rect3')).toBe(false);
  });

  it('should select by position', () => {
    const { result } = renderHook(() => useSelection());
    const canvasSize = { width: 800, height: 600 };
    
    // Select objects in the left half (rect1 center: 175, rect2 center: 360, both < 400)
    act(() => {
      result.current.selectByPosition(mockRectangles, 'left-half', canvasSize);
    });
    
    expect(result.current.isSelected('rect1')).toBe(true); // center: 175, 150
    expect(result.current.isSelected('rect2')).toBe(true); // center: 360, 240 (< 400)
    expect(result.current.isSelected('rect3')).toBe(false); // center: 550, 225 (> 400)
  });

  it('should select objects in top half', () => {
    const { result } = renderHook(() => useSelection());
    const canvasSize = { width: 800, height: 600 };
    
    act(() => {
      result.current.selectByPosition(mockRectangles, 'top-half', canvasSize);
    });
    
    // All objects have centers < 300 (half of 600), so all should be selected
    expect(result.current.isSelected('rect1')).toBe(true); // center y: 150
    expect(result.current.isSelected('rect2')).toBe(true); // center y: 240
    expect(result.current.isSelected('rect3')).toBe(true); // center y: 225
  });

  it('should handle add to selection', () => {
    const { result } = renderHook(() => useSelection());
    
    // Start with one object
    act(() => {
      result.current.selectObject('rect1');
    });
    expect(result.current.selectedIds.size).toBe(1);
    
    // Add another to selection
    act(() => {
      result.current.addToSelection('rect2');
    });
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.isSelected('rect1')).toBe(true);
    expect(result.current.isSelected('rect2')).toBe(true);
  });

  it('should deselect individual object', () => {
    const { result } = renderHook(() => useSelection());
    
    // Start with multiple objects selected
    act(() => {
      result.current.selectMultiple(['rect1', 'rect2', 'rect3']);
    });
    expect(result.current.selectedIds.size).toBe(3);
    
    // Deselect one
    act(() => {
      result.current.deselectObject('rect2');
    });
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.isSelected('rect1')).toBe(true);
    expect(result.current.isSelected('rect2')).toBe(false);
    expect(result.current.isSelected('rect3')).toBe(true);
  });
});

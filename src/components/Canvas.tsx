import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../hooks/useAuth';
import { useCanvas, CANVAS_CONFIG } from '../hooks/useCanvas';
import { useShapes } from '../hooks/useShapes';
import { usePresence } from '../hooks/usePresence';
import { useAI } from '../hooks/useAI';
import { useSelection } from '../hooks/useSelection';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useGrid } from '../hooks/useGrid';
import { canvasService } from '../services/canvasService';
import { CreateShapeCommand, BatchCommand } from '../services/commandService';
import { copyShapesToClipboard, getShapesFromClipboard, duplicateShapes } from '../utils/clipboardHelpers';
import { CanvasBackground } from './CanvasBackground';
import { Toolbar } from './Toolbar';
import { CanvasObject } from './CanvasObject';
import { CircleComponent } from './shapes/Circle';
import { LineComponent } from './shapes/Line';
import { TextComponent } from './shapes/Text';
import { MultiplayerCursors } from './MultiplayerCursor';
import { DraggablePanel } from './DraggablePanel';
import { PresenceList } from './PresenceList';
import { SelectionBox } from './tools/SelectionBox';
import { AICommandInput } from './features/AI/AICommandInput';
import { AILoadingIndicator } from './features/AI/AILoadingIndicator';
import { AIErrorDisplay } from './features/AI/AIErrorDisplay';
import { AICommandHistory } from './features/AI/AICommandHistory';
import { ShortcutsPanel } from './features/KeyboardShortcuts/ShortcutsPanel';
import { SmartGuides } from './features/Grid/SmartGuides';
import { getCanvasPointerPosition } from '../utils/canvasHelpers';

export const Canvas: React.FC = () => {
  const { user, userProfile, signOut } = useAuth();
  const stageRef = useRef<Konva.Stage>(null);
  const { 
    scale, 
    x, 
    y, 
    isDragging,
    activeTool,
    setPosition, 
    setIsDragging,
    setActiveTool,
    handleZoom,
    centerView 
  } = useCanvas();

  // Real-time shapes management
  const {
    shapes,
    loading: shapesLoading,
    error: shapesError,
    isConnected,
    createRectangle,
    createCircle,
    createLine,
    createText,
    updateShape,
    updateShapeTransform,
    updateTextContent,
    deleteShapes,
    clearError: clearShapesError,
  } = useShapes();

  // Multi-select management
  const {
    isDragSelecting,
    dragStartPos,
    dragCurrentPos,
    selectObject,
    toggleSelection,
    clearSelection,
    selectAll,
    selectMultiple,
    isSelected,
    getSelectedObjects,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    selectByColor,
    selectByPosition,
  } = useSelection();

  // Undo/Redo management  
  const {
    executeCommand,
    // Note: canUndo, canRedo, undo, redo will be used for UI buttons in future PR
  } = useUndoRedo();

  // Real-time presence/cursor management
  const {
    cursors,
    isConnected: presenceConnected,
    loading: presenceLoading,
    error: presenceError,
    updateCursorPosition,
    clearError: clearPresenceError,
  } = usePresence();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 60, // Account for header
  });

  // Local UI state  
  const [isDraggingRectangle, setIsDraggingRectangle] = useState<boolean>(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  // Bulk operations for selected objects
  const handleBulkDelete = async () => {
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) return;

    try {
      // Delete all selected shapes using the batch method
      const selectedIds = selectedObjects.map(obj => obj.id);
      await deleteShapes(selectedIds);
      
      // Clear selection after deletion
      clearSelection();
    } catch (error) {
      console.error('Failed to delete selected shapes:', error);
      setCanvasError('Failed to delete selected objects. Please try again.');
    }
  };

  const handleBulkMove = async (deltaX: number, deltaY: number) => {
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) return;

    try {
      // Move all selected shapes
      const movePromises = selectedObjects.map(obj => 
        updateShape(obj.id, { 
          x: obj.x + deltaX, 
          y: obj.y + deltaY 
        })
      );
      await Promise.all(movePromises);
    } catch (error) {
      console.error('Failed to move selected shapes:', error);
      setCanvasError('Failed to move selected objects. Please try again.');
    }
  };

  const handleBulkChangeColor = async (newColor: string) => {
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) return;

    try {
      // Change color of all selected shapes (handle different shape types)
      const cleanColor = newColor.replace('#', '').substring(0, 6);
      const transparentFill = `#${cleanColor}40`; // Semi-transparent version
      
      const colorPromises = selectedObjects.map(obj => {
        const updates: any = {};
        
        // Handle different shape types
        if (obj.type === 'rectangle' || obj.type === 'circle') {
          updates.fill = transparentFill;
          updates.stroke = newColor;
        } else if (obj.type === 'line') {
          updates.stroke = newColor;
        } else if (obj.type === 'text') {
          updates.fill = newColor;
        }
        
        return updateShape(obj.id, updates);
      });
      await Promise.all(colorPromises);
    } catch (error) {
      console.error('Failed to change color of selected shapes:', error);
      setCanvasError('Failed to change color of selected objects. Please try again.');
    }
  };

  // Keyboard Shortcuts Handlers
  const handleCopy = useCallback(() => {
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) {
      console.log('No objects selected to copy');
      return;
    }
    
    copyShapesToClipboard(selectedObjects);
    console.log(`Copied ${selectedObjects.length} object(s)`);
  }, [shapes, getSelectedObjects]);

  const handlePaste = useCallback(async () => {
    if (!user || !userProfile) return;
    
    const shapesToPaste = getShapesFromClipboard();
    if (!shapesToPaste || shapesToPaste.length === 0) {
      console.log('Clipboard is empty');
      return;
    }
    
    // Duplicate shapes with offset
    const duplicatedShapes = duplicateShapes(shapesToPaste, 20, 20);
    
    try {
      // Create all shapes with command pattern for undo/redo
      const commands = duplicatedShapes.map(shape => 
        new CreateShapeCommand({ shape }, user.uid)
      );
      
      const batchCommand = new BatchCommand(
        { commands },
        `Paste ${duplicatedShapes.length} object(s)`
      );
      
      await executeCommand(batchCommand);
      
      // Select the pasted objects
      selectMultiple(duplicatedShapes.map(s => s.id));
      console.log(`Pasted ${duplicatedShapes.length} object(s)`);
    } catch (error) {
      console.error('Failed to paste objects:', error);
      setCanvasError('Failed to paste objects. Please try again.');
    }
  }, [user, userProfile, executeCommand, selectMultiple]);

  const handleCut = useCallback(async () => {
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) {
      console.log('No objects selected to cut');
      return;
    }
    
    // Copy to clipboard first
    copyShapesToClipboard(selectedObjects);
    
    // Then delete
    await handleBulkDelete();
    console.log(`Cut ${selectedObjects.length} object(s)`);
  }, [shapes, getSelectedObjects, handleBulkDelete]);

  const handleDuplicate = useCallback(async () => {
    if (!user || !userProfile) return;
    
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) {
      console.log('No objects selected to duplicate');
      return;
    }
    
    // Duplicate shapes with offset
    const duplicatedShapes = duplicateShapes(selectedObjects, 20, 20);
    
    try {
      // Create all shapes with command pattern for undo/redo
      const commands = duplicatedShapes.map(shape => 
        new CreateShapeCommand({ shape }, user.uid)
      );
      
      const batchCommand = new BatchCommand(
        { commands },
        `Duplicate ${duplicatedShapes.length} object(s)`
      );
      
      await executeCommand(batchCommand);
      
      // Select the duplicated objects
      selectMultiple(duplicatedShapes.map(s => s.id));
      console.log(`Duplicated ${duplicatedShapes.length} object(s)`);
    } catch (error) {
      console.error('Failed to duplicate objects:', error);
      setCanvasError('Failed to duplicate objects. Please try again.');
    }
  }, [user, userProfile, shapes, getSelectedObjects, executeCommand, selectMultiple]);

  const handleNudge = useCallback(async (direction: 'up' | 'down' | 'left' | 'right', distance: number) => {
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length === 0) return;
    
    let deltaX = 0;
    let deltaY = 0;
    
    switch (direction) {
      case 'up':
        deltaY = -distance;
        break;
      case 'down':
        deltaY = distance;
        break;
      case 'left':
        deltaX = -distance;
        break;
      case 'right':
        deltaX = distance;
        break;
    }
    
    await handleBulkMove(deltaX, deltaY);
  }, [shapes, getSelectedObjects, handleBulkMove]);

  // AI shape creation handlers
  const handleAICreateRectangle = async (x: number, y: number, width: number, height: number, color: string): Promise<void> => {
    try {
      await createRectangle(x, y, width, height, color);
    } catch (error) {
      console.error('Failed to create AI rectangle:', error);
      throw error;
    }
  };

  const handleAICreateCircle = async (x: number, y: number, radius: number, color: string): Promise<void> => {
    try {
      await createCircle(x, y, radius, color);
    } catch (error) {
      console.error('Failed to create AI circle:', error);
      throw error;
    }
  };

  const handleAICreateLine = async (x1: number, y1: number, x2: number, y2: number, color: string): Promise<void> => {
    try {
      await createLine(x1, y1, x2, y2, color);
    } catch (error) {
      console.error('Failed to create AI line:', error);
      throw error;
    }
  };

  const handleAICreateText = async (x: number, y: number, text: string, fontSize?: number): Promise<void> => {
    try {
      await createText(x, y, text, fontSize);
    } catch (error) {
      console.error('Failed to create AI text:', error);
      throw error;
    }
  };

  // AI command processing
  const {
    isLoading: aiLoading,
    error: aiError,
    commandHistory,
    executeCommand: executeAICommand,
    clearError: clearAIError,
    clearHistory: clearAIHistory,
  } = useAI({
    rectangles: shapes, // Pass all shapes, but keep prop name for compatibility
    canvasSize: { width: windowSize.width, height: windowSize.height },
    // Shape creation functions
    onCreateRectangle: handleAICreateRectangle,
    onCreateCircle: handleAICreateCircle,
    onCreateLine: handleAICreateLine,
    onCreateText: handleAICreateText,
    // Selection functions
    onSelectAll: selectAll,
    onSelectByColor: selectByColor,
    onSelectByPosition: selectByPosition,
    onSelectByIds: selectMultiple,
    onClearSelection: clearSelection,
    getSelectedObjects,
    // Bulk operation functions
    onBulkMove: handleBulkMove,
    onBulkDelete: handleBulkDelete,
    onBulkChangeColor: handleBulkChangeColor,
  });

  // Set up keyboard shortcuts (after AI hook to access aiLoading)
  const { isHelpVisible, setIsHelpVisible } = useKeyboardShortcuts({
    onSelectAll: () => selectAll(shapes),
    onClearSelection: clearSelection,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onCut: handleCut,
    onDuplicate: handleDuplicate,
    onDelete: handleBulkDelete,
    onNudge: handleNudge,
    enabled: true, // Always enabled
  });

  // Grid and snap-to-grid functionality
  const {
    gridConfig,
    smartGuides,
    toggleSnapToGrid,
    snapPointToGrid,
    calculateSmartGuides,
    updateSmartGuides,
    clearSmartGuides,
  } = useGrid();

  // Initialize shared canvas on mount
  useEffect(() => {
    const initializeCanvas = async () => {
      if (!user || !userProfile) {
        return;
      }

      try {
        setCanvasError(null);
        await canvasService.initializeSharedCanvas(user.uid);
      } catch (error: any) {
        console.error('Failed to initialize canvas:', error);
        setCanvasError(`Failed to initialize canvas: ${error.message}`);
      }
    };

    initializeCanvas();
  }, [user, userProfile]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight - 60,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Select All: Cmd/Ctrl + A
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        selectAll(shapes);
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
      }

      // Delete: Delete selected objects
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, selectAll, clearSelection, getSelectedObjects, handleBulkDelete]);

  // Update cursor style based on active tool
  useEffect(() => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      if (container) {
        let cursor = 'default';
        switch (activeTool) {
          case 'select':
            cursor = 'default';
            break;
          case 'pan':
            cursor = isDragging ? 'grabbing' : 'grab';
            break;
          case 'rectangle':
          case 'circle':
          case 'line':
            cursor = 'crosshair';
            break;
          case 'text':
            cursor = 'text';
            break;
        }
        container.style.cursor = cursor;
      }
    }
  }, [activeTool, isDragging]);

  // Shape interaction handlers
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [transformStartDimensions, setTransformStartDimensions] = useState<Record<string, any>>({});

  const handleShapeDragStart = (id: string, x: number, y: number) => {
    setIsDraggingRectangle(true);
    // Store the starting position for undo/redo
    setDragStartPositions(prev => ({
      ...prev,
      [id]: { x, y }
    }));
  };

  const handleTransformStart = (id: string, dimensions: any) => {
    // Store starting dimensions for undo/redo
    setTransformStartDimensions(prev => ({
      ...prev,
      [id]: dimensions
    }));
  };

  // Handle shape drag end (position updates with real-time sync and undo support)
  const handleShapeDragEnd = async (id: string, newX: number, newY: number) => {
    if (!user) return;
    
    // Clear smart guides after drag
    clearSmartGuides();
    
    // Apply snap-to-grid if enabled
    const snapped = snapPointToGrid(newX, newY);
    const finalX = snapped.x;
    const finalY = snapped.y;
    
    const startPos = dragStartPositions[id];
    if (!startPos) {
      // Fallback if we don't have start position - just update without undo
      try {
        await updateShape(id, { x: finalX, y: finalY });
      } catch (error) {
        console.error('Failed to update shape position:', error);
      }
      setIsDraggingRectangle(false);
      return;
    }

    try {
      // Create a MoveShapeCommand for undo/redo support
      const { MoveShapeCommand } = await import('../services/commandService');
      const moveCommand = new MoveShapeCommand(
        {
          shapeId: id,
          oldX: startPos.x,
          oldY: startPos.y,
          newX: finalX,
          newY: finalY,
        },
        user.uid
      );
      
      await executeCommand(moveCommand);
      
      // Clean up stored position
      setDragStartPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[id];
        return newPositions;
      });
    } catch (error) {
      console.error('Failed to update shape position:', error);
    }
    setIsDraggingRectangle(false);
  };

  // Handle rectangle transform end (resize operations with real-time sync and undo support)
  const handleRectangleTransformEnd = async (id: string, x: number, y: number, width: number, height: number) => {
    if (!user) return;
    
    // Apply snap-to-grid if enabled
    const snappedPos = snapPointToGrid(x, y);
    const finalX = snappedPos.x;
    const finalY = snappedPos.y;
    
    // Optionally snap size to grid multiples
    const finalWidth = gridConfig.enabled ? Math.round(width / gridConfig.size) * gridConfig.size : width;
    const finalHeight = gridConfig.enabled ? Math.round(height / gridConfig.size) * gridConfig.size : height;
    
    const startDims = transformStartDimensions[id];
    if (!startDims) {
      // Fallback if we don't have start dimensions - just update without undo
      try {
        await updateShapeTransform(id, finalX, finalY, { width: finalWidth, height: finalHeight });
      } catch (error) {
        console.error('Failed to update rectangle transform:', error);
        setCanvasError('Failed to update rectangle size. Please try again.');
      }
      setIsDraggingRectangle(false);
      return;
    }

    try {
      const { ResizeShapeCommand } = await import('../services/commandService');
      const resizeCommand = new ResizeShapeCommand(
        {
          shapeId: id,
          oldDimensions: startDims,
          newDimensions: { x: finalX, y: finalY, width: finalWidth, height: finalHeight },
        },
        user.uid
      );
      
      await executeCommand(resizeCommand);
      
      // Clean up stored dimensions
      setTransformStartDimensions(prev => {
        const newDims = { ...prev };
        delete newDims[id];
        return newDims;
      });
    } catch (error) {
      console.error('Failed to update rectangle transform:', error);
      setCanvasError('Failed to update rectangle size. Please try again.');
    }
    setIsDraggingRectangle(false);
  };

  // Handle circle transform end (radius changes with undo support)
  const handleCircleTransformEnd = async (id: string, x: number, y: number, radius: number) => {
    if (!user) return;
    
    // Apply snap-to-grid if enabled
    const snappedPos = snapPointToGrid(x, y);
    const finalX = snappedPos.x;
    const finalY = snappedPos.y;
    
    // Optionally snap radius to grid multiples
    const finalRadius = gridConfig.enabled ? Math.round(radius / gridConfig.size) * gridConfig.size : radius;
    
    const startDims = transformStartDimensions[id];
    if (!startDims) {
      try {
        await updateShapeTransform(id, finalX, finalY, { radius: finalRadius });
      } catch (error) {
        console.error('Failed to update circle transform:', error);
        setCanvasError('Failed to update circle size. Please try again.');
      }
      setIsDraggingRectangle(false);
      return;
    }

    try {
      const { ResizeShapeCommand } = await import('../services/commandService');
      const resizeCommand = new ResizeShapeCommand(
        {
          shapeId: id,
          oldDimensions: startDims,
          newDimensions: { x: finalX, y: finalY, radius: finalRadius },
        },
        user.uid
      );
      
      await executeCommand(resizeCommand);
      
      setTransformStartDimensions(prev => {
        const newDims = { ...prev };
        delete newDims[id];
        return newDims;
      });
    } catch (error) {
      console.error('Failed to update circle transform:', error);
      setCanvasError('Failed to update circle size. Please try again.');
    }
    setIsDraggingRectangle(false);
  };

  // Handle line transform end (endpoint changes with undo support)
  const handleLineTransformEnd = async (id: string, x: number, y: number, x2: number, y2: number) => {
    if (!user) return;
    
    // Apply snap-to-grid if enabled
    const snappedStart = snapPointToGrid(x, y);
    const snappedEnd = snapPointToGrid(x2, y2);
    const finalX = snappedStart.x;
    const finalY = snappedStart.y;
    const finalX2 = snappedEnd.x;
    const finalY2 = snappedEnd.y;
    
    const startDims = transformStartDimensions[id];
    if (!startDims) {
      try {
        await updateShapeTransform(id, finalX, finalY, { x2: finalX2, y2: finalY2 });
      } catch (error) {
        console.error('Failed to update line transform:', error);
        setCanvasError('Failed to update line. Please try again.');
      }
      setIsDraggingRectangle(false);
      return;
    }

    try {
      const { ResizeShapeCommand } = await import('../services/commandService');
      const resizeCommand = new ResizeShapeCommand(
        {
          shapeId: id,
          oldDimensions: startDims,
          newDimensions: { x: finalX, y: finalY, x2: finalX2, y2: finalY2 },
        },
        user.uid
      );
      
      await executeCommand(resizeCommand);
      
      setTransformStartDimensions(prev => {
        const newDims = { ...prev };
        delete newDims[id];
        return newDims;
      });
    } catch (error) {
      console.error('Failed to update line transform:', error);
      setCanvasError('Failed to update line. Please try again.');
    }
    setIsDraggingRectangle(false);
  };

  // Handle text transform end (size changes with undo support)
  const handleTextTransformEnd = async (id: string, x: number, y: number, width?: number, height?: number) => {
    if (!user) return;
    
    // Apply snap-to-grid if enabled
    const snappedPos = snapPointToGrid(x, y);
    const finalX = snappedPos.x;
    const finalY = snappedPos.y;
    
    // Optionally snap size to grid multiples
    const finalWidth = width && gridConfig.enabled ? Math.round(width / gridConfig.size) * gridConfig.size : width;
    const finalHeight = height && gridConfig.enabled ? Math.round(height / gridConfig.size) * gridConfig.size : height;
    
    const startDims = transformStartDimensions[id];
    if (!startDims) {
      try {
        await updateShapeTransform(id, finalX, finalY, { width: finalWidth, height: finalHeight });
      } catch (error) {
        console.error('Failed to update text transform:', error);
        setCanvasError('Failed to update text. Please try again.');
      }
      setIsDraggingRectangle(false);
      return;
    }

    try {
      const { ResizeShapeCommand } = await import('../services/commandService');
      const resizeCommand = new ResizeShapeCommand(
        {
          shapeId: id,
          oldDimensions: startDims,
          newDimensions: { x: finalX, y: finalY, width: finalWidth, height: finalHeight },
        },
        user.uid
      );
      
      await executeCommand(resizeCommand);
      
      setTransformStartDimensions(prev => {
        const newDims = { ...prev };
        delete newDims[id];
        return newDims;
      });
    } catch (error) {
      console.error('Failed to update text transform:', error);
      setCanvasError('Failed to update text. Please try again.');
    }
    setIsDraggingRectangle(false);
  };

  // Handle text content changes
  const handleTextChange = async (id: string, newText: string) => {
    try {
      await updateTextContent(id, newText);
    } catch (error) {
      console.error('Failed to update text content:', error);
      setCanvasError('Failed to update text content. Please try again.');
    }
  };

  // Handle shape selection with support for multi-select
  const handleShapeSelect = (id: string, event?: { shiftKey?: boolean }) => {
    if (event?.shiftKey) {
      // Shift-click: toggle object in selection
      toggleSelection(id);
    } else {
      // Regular click: select only this object
      selectObject(id);
    }
  };


  const handleStageClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't create shapes if dragging the canvas, shapes, or drag selecting
    if (isDragging || isDraggingRectangle || isDragSelecting) return;
    
    const stage = stageRef.current;
    if (!stage || !user || !userProfile) return;

    const pos = getCanvasPointerPosition(stage);
    if (!pos) return;

    // Apply snap-to-grid if enabled
    const snapped = snapPointToGrid(pos.x, pos.y);
    const clickX = snapped.x;
    const clickY = snapped.y;

    // Import utilities
    const { CreateShapeCommand } = await import('../services/commandService');
    const { createRectangleShape, createCircleShape, createLineShape, createTextShape } = await import('../services/shapesService');
    const { generateShapeId } = await import('../types/shapes');
    
    const colors = ['#007ACC', '#28A745', '#DC3545', '#FFC107', '#6F42C1', '#FD7E14'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    if (activeTool === 'rectangle') {
      try {
        // Build shape object without saving (command will handle saving)
        const newRectangle = createRectangleShape({ x: clickX, y: clickY }, user.uid, {
          id: generateShapeId('rectangle'),
          width: 120,
          height: 80,
          fill: `${randomColor}40`,
          stroke: randomColor,
          strokeWidth: 2,
        });
        const createCommand = new CreateShapeCommand({ shape: newRectangle }, user.uid);
        await executeCommand(createCommand);
        selectObject(newRectangle.id);
      } catch (error) {
        console.error('Failed to create rectangle:', error);
      }
    } else if (activeTool === 'circle') {
      try {
        const newCircle = createCircleShape({ x: clickX, y: clickY }, user.uid, {
          id: generateShapeId('circle'),
          radius: 50,
          fill: `${randomColor}40`,
          stroke: randomColor,
          strokeWidth: 2,
        });
        const createCommand = new CreateShapeCommand({ shape: newCircle }, user.uid);
        await executeCommand(createCommand);
        selectObject(newCircle.id);
      } catch (error) {
        console.error('Failed to create circle:', error);
      }
    } else if (activeTool === 'line') {
      try {
        const newLine = createLineShape(
          { x: clickX, y: clickY },
          { x: clickX + 100, y: clickY },
          user.uid,
          {
            id: generateShapeId('line'),
            stroke: randomColor,
            strokeWidth: 3,
          }
        );
        const createCommand = new CreateShapeCommand({ shape: newLine }, user.uid);
        await executeCommand(createCommand);
        selectObject(newLine.id);
      } catch (error) {
        console.error('Failed to create line:', error);
      }
    } else if (activeTool === 'text') {
      try {
        const newText = createTextShape({ x: clickX, y: clickY }, 'New Text', user.uid, {
          id: generateShapeId('text'),
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fill: '#000000',
        });
        const createCommand = new CreateShapeCommand({ shape: newText }, user.uid);
        await executeCommand(createCommand);
        selectObject(newText.id);
      } catch (error) {
        console.error('Failed to create text:', error);
      }
    } else if (activeTool === 'select') {
      // Deselect if clicking on empty space (not on a shape)
      if (e.target === stage) {
        if (!e.evt?.shiftKey) {
          clearSelection();
        }
      }
    }
  };

  // Handle stage mouse down for drag selection start
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only start drag selection in select mode and when clicking on empty canvas
    if (activeTool !== 'select' || isDraggingRectangle) {
      return;
    }

    // Check if clicking on empty canvas (stage or layer background, not shapes)
    const isStageOrLayer = e.target === stageRef.current || e.target.getType() === 'Layer';
    if (!isStageOrLayer) {
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const pos = getCanvasPointerPosition(stage);
    if (!pos) return;

    // Start drag selection
    startDragSelection(pos.x, pos.y);
  };

  // Handle stage mouse move for drag selection update
  const handleStageMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getCanvasPointerPosition(stage);
    if (!pos) return;

    // Update cursor position for multiplayer cursors
    updateCursorPosition(pos.x, pos.y);

    // Update drag selection if active
    if (isDragSelecting) {
      updateDragSelection(pos.x, pos.y);
    }
  };

  // Handle stage mouse up for drag selection end
  const handleStageMouseUp = () => {
    if (isDragSelecting) {
      endDragSelection(shapes);
    }
  };

  return (
    <div className="canvas-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>CollabCanvas</h1>
          
          {/* Real-time status indicator */}
          <div className="realtime-status">
            <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span className="status-text">
                {shapesLoading ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="user-info">
            <button 
              onClick={signOut} 
              className="sign-out-button"
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Error Toasts */}
      {shapesError && (
        <div className="error-toast">
          <div className="error-content">
            <span className="error-message">{shapesError}</span>
            <button 
              onClick={clearShapesError}
              className="error-close"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {presenceError && (
        <div className="error-toast" style={{ top: '120px' }}>
          <div className="error-content">
            <span className="error-message">Cursor sync: {presenceError}</span>
            <button 
              onClick={clearPresenceError}
              className="error-close"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {canvasError && (
        <div className="error-toast" style={{ top: '160px' }}>
          <div className="error-content">
            <span className="error-message">{canvasError}</span>
            <button 
              onClick={() => setCanvasError(null)}
              className="error-close"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <DraggablePanel 
        title="Tools"
        defaultPosition={{ x: 20, y: 80 }}
        className="toolbar-panel"
      >
        <Toolbar 
          activeTool={activeTool}
          onToolChange={setActiveTool}
          snapToGridEnabled={gridConfig.enabled}
          onToggleSnapToGrid={toggleSnapToGrid}
        />
      </DraggablePanel>
      
      {/* Canvas Container */}
      <div className="canvas-container">
        <Stage
          ref={stageRef}
          width={windowSize.width}
          height={windowSize.height}
          scaleX={scale}
          scaleY={scale}
          x={x}
          y={y}
          draggable={activeTool === 'pan' && !isDraggingRectangle}
          listening={!isDraggingRectangle}
          onDragStart={(e) => {
            // Only allow dragging in pan mode
            if (activeTool !== 'pan' || isDraggingRectangle) {
              e.evt?.preventDefault();
              e.evt?.stopPropagation();
              return false;
            }
            // Only allow Stage dragging if clicking on Stage itself, not on shapes
            if (e.target !== stageRef.current) {
              e.evt?.preventDefault();
              e.evt?.stopPropagation();
              return false;
            }
            setIsDragging(true);
          }}
          onDragEnd={(e) => {
            if (isDragging) {
              setIsDragging(false);
              setPosition(e.target.x(), e.target.y());
            }
          }}
          onWheel={handleZoom}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Canvas Background with Grid */}
            <CanvasBackground 
              scale={scale} 
              snapToGridEnabled={gridConfig.enabled}
              gridSize={gridConfig.size}
            />
            
            {/* Render All Shapes */}
            {shapes.map((shape) => {
              // Render different components based on shape type
              if (shape.type === 'rectangle') {
                return (
                  <CanvasObject
                    key={shape.id}
                    object={shape}
                    isSelected={isSelected(shape.id)}
                    onSelect={(event?: { shiftKey?: boolean }) => handleShapeSelect(shape.id, event)}
                    onDragStart={handleShapeDragStart}
                    onDragEnd={handleShapeDragEnd}
                    onTransformStart={handleTransformStart}
                    onTransformEnd={handleRectangleTransformEnd}
                    currentUserId={user?.uid}
                    onCursorUpdate={updateCursorPosition}
                  />
                );
              } else if (shape.type === 'circle') {
                return (
                  <CircleComponent
                    key={shape.id}
                    shape={shape}
                    isSelected={isSelected(shape.id)}
                    onSelect={(event?: { shiftKey?: boolean }) => handleShapeSelect(shape.id, event)}
                    onDragStart={handleShapeDragStart}
                    onDragEnd={handleShapeDragEnd}
                    onTransformStart={handleTransformStart}
                    onTransformEnd={handleCircleTransformEnd}
                    currentUserId={user?.uid}
                    onCursorUpdate={updateCursorPosition}
                  />
                );
              } else if (shape.type === 'line') {
                return (
                  <LineComponent
                    key={shape.id}
                    shape={shape}
                    isSelected={isSelected(shape.id)}
                    onSelect={(event?: { shiftKey?: boolean }) => handleShapeSelect(shape.id, event)}
                    onDragStart={handleShapeDragStart}
                    onDragEnd={handleShapeDragEnd}
                    onTransformStart={handleTransformStart}
                    onTransformEnd={handleLineTransformEnd}
                    currentUserId={user?.uid}
                    onCursorUpdate={updateCursorPosition}
                  />
                );
              } else if (shape.type === 'text') {
                return (
                  <TextComponent
                    key={shape.id}
                    shape={shape}
                    isSelected={isSelected(shape.id)}
                    onSelect={(event?: { shiftKey?: boolean }) => handleShapeSelect(shape.id, event)}
                    onDragStart={handleShapeDragStart}
                    onDragEnd={handleShapeDragEnd}
                    onTransformStart={handleTransformStart}
                    onTransformEnd={handleTextTransformEnd}
                    onTextChange={handleTextChange}
                    currentUserId={user?.uid}
                    onCursorUpdate={updateCursorPosition}
                    stageRef={stageRef}
                  />
                );
              }
              return null; // Unknown shape type
            })}

            {/* Selection Box for drag selection */}
            <SelectionBox
              startPos={dragStartPos}
              currentPos={dragCurrentPos}
              isVisible={isDragSelecting}
            />

            {/* Smart Guides for alignment */}
            <SmartGuides guides={smartGuides} />
          </Layer>
        </Stage>
        
        {/* Multiplayer Cursors Overlay */}
        <MultiplayerCursors 
          cursors={cursors as any}
          canvasScale={scale}
          canvasOffset={{ x, y }}
        />
      </div>
      
      {/* Canvas Info Overlay */}
      <div className="canvas-info">
        <div className="info-panel">
          <p>Canvas: {CANVAS_CONFIG.WIDTH} × {CANVAS_CONFIG.HEIGHT}px</p>
          <p>Zoom: {Math.round(scale * 100)}%</p>
          <p>Position: ({Math.round(x)}, {Math.round(y)})</p>
          {isDragging && <p className="drag-indicator">Dragging...</p>}
        </div>
      </div>
      
      {/* Canvas Controls */}
      <div className="canvas-controls">
        <button
          className="canvas-button"
          onClick={() => centerView(windowSize.width, windowSize.height)}
          type="button"
        >
          Center View
        </button>
        <button
          className="canvas-button"
          onClick={() => {
            if (stageRef.current) {
              const stage = stageRef.current;
              stage.scale({ x: 1, y: 1 });
              stage.position({ x: 0, y: 0 });
              setPosition(0, 0);
            }
          }}
          type="button"
        >
          Reset Zoom
        </button>
      </div>
      
      {/* Presence List */}
      <DraggablePanel 
        title="Online Users"
        defaultPosition={{ x: windowSize.width - 280, y: 80 }}
        className="presence-panel"
      >
        <PresenceList
          presenceData={cursors as any}
          currentUserId={userProfile?.uid}
          currentUserDisplayName={userProfile?.displayName}
          isConnected={presenceConnected}
          loading={presenceLoading}
        />
      </DraggablePanel>

      {/* AI Command Panel */}
      <DraggablePanel 
        title="AI Assistant"
        defaultPosition={{ x: 20, y: windowSize.height - 320 }}
        className="ai-assistant-panel"
      >
        <div className="ai-panel">
          <div className="ai-panel-content">
            <div className="ai-status">
              {aiLoading && <AILoadingIndicator size="small" />}
            </div>
            
            {aiError && (
              <AIErrorDisplay 
                error={aiError} 
                onDismiss={clearAIError}
              />
            )}
            
            <AICommandInput
              onExecuteCommand={executeAICommand}
              isLoading={aiLoading}
              disabled={!user}
              placeholder="Try: 'create a red rectangle at 200, 150'"
            />
            
            <AICommandHistory
              commands={commandHistory}
              maxVisible={3}
              onClearHistory={clearAIHistory}
            />
          </div>
        </div>
      </DraggablePanel>

      {/* Keyboard Shortcuts Panel */}
      <ShortcutsPanel 
        isVisible={isHelpVisible}
        onClose={() => setIsHelpVisible(false)}
      />
    </div>
  );
};

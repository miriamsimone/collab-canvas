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
import { useZIndex } from '../hooks/useZIndex';
import { useAlignment } from '../hooks/useAlignment';
import { useComments } from '../hooks/useComments';
import { canvasService } from '../services/canvasService';
import { shapesService } from '../services/shapesService';
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
import { GridOverlay } from './features/Grid/GridOverlay';
import { ShapeContextMenu, type ContextMenuItem } from './features/ContextMenu/ShapeContextMenu';
import { CommentPin } from './features/Comments/CommentPin';
import { CommentThread } from './features/Comments/CommentThread';
import { CommentInput } from './features/Comments/CommentInput';
import { getCanvasPointerPosition } from '../utils/canvasHelpers';
import { countUnresolvedComments } from '../services/commentsService';

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

  // Collaborative comments
  const {
    comments,
    activeCommentId,
    addComment,
    addReply,
    toggleResolved,
    deleteComment,
    setActiveComment,
  } = useComments();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 60, // Account for header
  });

  // Panel width for right-side panels
  const PANEL_WIDTH = 320;

  // Style controls state
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [currentTextSize, setCurrentTextSize] = useState(16);
  const [currentOpacity, setCurrentOpacity] = useState(100);
  
  // Named color palette
  const colorPalette = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Violet', value: '#a855f7' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Black', value: '#000000' },
  ];

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Local UI state  
  const [isDraggingRectangle, setIsDraggingRectangle] = useState<boolean>(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);

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

  const handleBulkCreate = async (
    shapeType: 'rectangle' | 'circle' | 'line' | 'text',
    count: number,
    pattern: 'grid' | 'random' | 'horizontal' | 'vertical' = 'random',
    baseParams?: Record<string, any>,
    area?: { startX?: number; startY?: number; width?: number; height?: number }
  ) => {
    if (!user || !userProfile) return;
    
    try {
      console.log(`🚀 Bulk creating ${count} ${shapeType}s with pattern: ${pattern}`);
      
      // Define default area if not provided
      const createArea = {
        startX: area?.startX ?? 50,
        startY: area?.startY ?? 50,
        width: area?.width ?? windowSize.width - 100,
        height: area?.height ?? windowSize.height - 100,
      };
      
      // Calculate grid dimensions if using grid pattern
      const gridCols = pattern === 'grid' ? Math.ceil(Math.sqrt(count)) : 1;
      const gridRows = pattern === 'grid' ? Math.ceil(count / gridCols) : 1;
      const cellWidth = createArea.width / gridCols;
      const cellHeight = createArea.height / gridRows;
      
      // Generate all shape data first
      const shapesData: any[] = [];
      
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        
        // Calculate position based on pattern
        if (pattern === 'grid') {
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          x = createArea.startX + col * cellWidth + cellWidth / 2;
          y = createArea.startY + row * cellHeight + cellHeight / 2;
        } else if (pattern === 'horizontal') {
          const spacing = createArea.width / (count + 1);
          x = createArea.startX + (i + 1) * spacing;
          y = createArea.startY + createArea.height / 2;
        } else if (pattern === 'vertical') {
          const spacing = createArea.height / (count + 1);
          x = createArea.startX + createArea.width / 2;
          y = createArea.startY + (i + 1) * spacing;
        } else { // random
          x = createArea.startX + Math.random() * createArea.width;
          y = createArea.startY + Math.random() * createArea.height;
        }
        
        // Create shape data based on type
        if (shapeType === 'rectangle') {
          const width = baseParams?.width ?? 80;
          const height = baseParams?.height ?? 60;
          const color = baseParams?.color ?? `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
          const cleanColor = color.replace('#', '').substring(0, 6);
          const transparentFill = `#${cleanColor}40`;
          
          shapesData.push({
            id: `rect-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            type: 'rectangle' as const,
            x,
            y,
            width,
            height,
            fill: transparentFill,
            stroke: `#${cleanColor}`,
            strokeWidth: 2,
          });
        } else if (shapeType === 'circle') {
          const radius = baseParams?.radius ?? 30;
          const color = baseParams?.color ?? `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
          const cleanColor = color.replace('#', '').substring(0, 6);
          const transparentFill = `#${cleanColor}40`;
          
          shapesData.push({
            id: `circle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            type: 'circle' as const,
            x,
            y,
            radius,
            fill: transparentFill,
            stroke: `#${cleanColor}`,
            strokeWidth: 2,
          });
        } else if (shapeType === 'line') {
          const length = baseParams?.length ?? 100;
          const angle = Math.random() * Math.PI * 2;
          const x2 = x + Math.cos(angle) * length;
          const y2 = y + Math.sin(angle) * length;
          const color = baseParams?.color ?? `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
          const cleanColor = color.replace('#', '').substring(0, 6);
          
          shapesData.push({
            id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            type: 'line' as const,
            x,
            y,
            x2,
            y2,
            stroke: `#${cleanColor}`,
            strokeWidth: 2,
          });
        } else if (shapeType === 'text') {
          const text = baseParams?.text ?? `Text ${i + 1}`;
          const fontSize = baseParams?.fontSize ?? 16;
          const color = baseParams?.color ?? `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
          
          shapesData.push({
            id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
            type: 'text' as const,
            x,
            y,
            text,
            fontSize,
            fill: color,
          });
        }
      }
      
      // Use batch create for maximum performance (creates all shapes in 1-2 Firestore transactions)
      await shapesService.batchCreateShapes(shapesData, user.uid);
      
      console.log(`✅ Successfully created ${count} ${shapeType}s using batch writes`);
    } catch (error) {
      console.error(`Failed to bulk create ${shapeType}s:`, error);
      setCanvasError(`Failed to bulk create shapes. Please try again.`);
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

  // Comment handlers
  const handleAddComment = async (text: string) => {
    if (!newCommentPos) return;
    
    try {
      await addComment({
        text,
        x: newCommentPos.x,
        y: newCommentPos.y,
      });
      setNewCommentPos(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setCanvasError('Failed to add comment. Please try again.');
    }
  };

  const handleCancelComment = () => {
    setNewCommentPos(null);
  };

  const handleCommentPinClick = (commentId: string) => {
    setActiveComment(activeCommentId === commentId ? null : commentId);
  };

  const handleCloseCommentThread = () => {
    setActiveComment(null);
  };

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

  // AI transform operations handlers
  const handleAIResize = async (shapeId: string | undefined, width?: number, height?: number, scale?: number): Promise<void> => {
    try {
      // Get selected objects or specific shape
      let targetShapes = shapeId ? shapes.filter(s => s.id === shapeId) : getSelectedObjects(shapes);
      
      if (targetShapes.length === 0) {
        console.warn('No shapes to resize');
        return;
      }
      
      for (const shape of targetShapes) {
        // Only resize shapes with width/height (rectangles, not circles or lines)
        if (shape.type === 'rectangle') {
          let newWidth = shape.width;
          let newHeight = shape.height;
          
          if (scale) {
            // Apply scale factor
            newWidth = shape.width * scale;
            newHeight = shape.height * scale;
          } else {
            // Use specific width/height if provided
            if (width) newWidth = width;
            if (height) newHeight = height;
          }
          
          await updateShape(shape.id, { width: newWidth, height: newHeight });
        } else if (shape.type === 'circle') {
          // For circles, scale the radius
          if (scale) {
            await updateShape(shape.id, { radius: shape.radius * scale });
          } else if (width) {
            // Treat width as new diameter
            await updateShape(shape.id, { radius: width / 2 });
          }
        }
      }
    } catch (error) {
      console.error('Failed to resize shape:', error);
      throw error;
    }
  };

  const handleAIRotate = async (shapeId: string | undefined, degrees: number): Promise<void> => {
    try {
      // Get selected objects or specific shape
      let targetShapes = shapeId ? shapes.filter(s => s.id === shapeId) : getSelectedObjects(shapes);
      
      if (targetShapes.length === 0) {
        console.warn('No shapes to rotate');
        return;
      }
      
      for (const shape of targetShapes) {
        const currentRotation = shape.rotation || 0;
        await updateShape(shape.id, { rotation: currentRotation + degrees });
      }
    } catch (error) {
      console.error('Failed to rotate shape:', error);
      throw error;
    }
  };

  const handleAIAlign = async (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Promise<void> => {
    try {
      if (!user) return;
      const selectedObjects = getSelectedObjects(shapes);
      if (selectedObjects.length === 0) {
        console.warn('No shapes selected for alignment');
        return;
      }
      
      // Use appropriate alignment function
      let alignFunc;
      switch (alignment) {
        case 'left': alignFunc = alignLeft; break;
        case 'center': alignFunc = alignCenter; break;
        case 'right': alignFunc = alignRight; break;
        case 'top': alignFunc = alignTop; break;
        case 'middle': alignFunc = alignMiddle; break;
        case 'bottom': alignFunc = alignBottom; break;
        default: return;
      }
      
      const updates = alignFunc(selectedObjects);
      if (updates.length === 0) return;
      
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: alignment }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align shapes:', error);
      throw error;
    }
  };

  const handleAIDistribute = async (direction: 'horizontal' | 'vertical'): Promise<void> => {
    try {
      if (!user) return;
      const selectedObjects = getSelectedObjects(shapes);
      if (selectedObjects.length < 3) {
        console.warn('Need at least 3 shapes for distribution');
        return;
      }
      
      const distributeFunc = direction === 'horizontal' ? distributeHorizontally : distributeVertically;
      const updates = distributeFunc(selectedObjects);
      if (updates.length === 0) return;
      
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: `distribute-${direction}` }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to distribute shapes:', error);
      throw error;
    }
  };

  const handleAIZIndex = async (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward', shapeId?: string): Promise<void> => {
    try {
      if (!user) return;
      
      // Get target shape IDs
      let targetIds: string[];
      if (shapeId) {
        targetIds = [shapeId];
      } else {
        const selectedObjects = getSelectedObjects(shapes);
        targetIds = selectedObjects.map(obj => obj.id);
      }
      
      if (targetIds.length === 0) {
        console.warn('No shapes for z-index operation');
        return;
      }
      
      // Use appropriate z-index function
      let zIndexFunc;
      switch (operation) {
        case 'bringToFront': zIndexFunc = bringToFront; break;
        case 'sendToBack': zIndexFunc = sendToBack; break;
        case 'bringForward': zIndexFunc = bringForward; break;
        case 'sendBackward': zIndexFunc = sendBackward; break;
        default: return;
      }
      
      const { updates } = zIndexFunc(targetIds, shapes);
      if (updates.length === 0) return;
      
      const { ChangeZIndexCommand } = await import('../services/commandService');
      const command = new ChangeZIndexCommand({ updates }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to change z-index:', error);
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
    // Bulk create function
    onBulkCreate: handleBulkCreate,
    // Transform operations
    onResize: handleAIResize,
    onRotate: handleAIRotate,
    // Alignment operations
    onAlign: handleAIAlign,
    onDistribute: handleAIDistribute,
    // Z-index operations
    onZIndex: handleAIZIndex,
  });

  // Grid and snap-to-grid functionality
  const {
    gridConfig,
    smartGuides,
    toggleSnapToGrid,
    snapPointToGrid,
    clearSmartGuides,
  } = useGrid();

  // Z-Index management for layer ordering
  const {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    sortShapesByZIndex,
  } = useZIndex();

  // Alignment management
  const {
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontally,
    distributeVertically,
  } = useAlignment();

  // Z-Index handlers
  const handleBringToFront = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    const selectedIds = selectedObjects.map(obj => obj.id);
    if (selectedIds.length === 0) return;

    const { updates } = bringToFront(selectedIds, shapes);
    if (updates.length === 0) return;

    try {
      const { ChangeZIndexCommand } = await import('../services/commandService');
      const command = new ChangeZIndexCommand({ updates }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to bring to front:', error);
    }
  }, [user, getSelectedObjects, shapes, bringToFront, executeCommand]);

  const handleSendToBack = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    const selectedIds = selectedObjects.map(obj => obj.id);
    if (selectedIds.length === 0) return;

    const { updates } = sendToBack(selectedIds, shapes);
    if (updates.length === 0) return;

    try {
      const { ChangeZIndexCommand } = await import('../services/commandService');
      const command = new ChangeZIndexCommand({ updates }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to send to back:', error);
    }
  }, [user, getSelectedObjects, shapes, sendToBack, executeCommand]);

  const handleBringForward = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    const selectedIds = selectedObjects.map(obj => obj.id);
    if (selectedIds.length === 0) return;

    const { updates } = bringForward(selectedIds, shapes);
    if (updates.length === 0) return;

    try {
      const { ChangeZIndexCommand } = await import('../services/commandService');
      const command = new ChangeZIndexCommand({ updates }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to bring forward:', error);
    }
  }, [user, getSelectedObjects, shapes, bringForward, executeCommand]);

  const handleSendBackward = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    const selectedIds = selectedObjects.map(obj => obj.id);
    if (selectedIds.length === 0) return;

    const { updates } = sendBackward(selectedIds, shapes);
    if (updates.length === 0) return;

    try {
      const { ChangeZIndexCommand } = await import('../services/commandService');
      const command = new ChangeZIndexCommand({ updates }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to send backward:', error);
    }
  }, [user, getSelectedObjects, shapes, sendBackward, executeCommand]);

  // Alignment handlers
  const handleAlignLeft = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 2) return;

    const updates = alignLeft(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'left' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align left:', error);
    }
  }, [user, getSelectedObjects, shapes, alignLeft, executeCommand]);

  const handleAlignCenter = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 2) return;

    const updates = alignCenter(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'center' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align center:', error);
    }
  }, [user, getSelectedObjects, shapes, alignCenter, executeCommand]);

  const handleAlignRight = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 2) return;

    const updates = alignRight(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'right' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align right:', error);
    }
  }, [user, getSelectedObjects, shapes, alignRight, executeCommand]);

  const handleAlignTop = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 2) return;

    const updates = alignTop(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'top' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align top:', error);
    }
  }, [user, getSelectedObjects, shapes, alignTop, executeCommand]);

  const handleAlignMiddle = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 2) return;

    const updates = alignMiddle(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'middle' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align middle:', error);
    }
  }, [user, getSelectedObjects, shapes, alignMiddle, executeCommand]);

  const handleAlignBottom = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 2) return;

    const updates = alignBottom(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'bottom' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to align bottom:', error);
    }
  }, [user, getSelectedObjects, shapes, alignBottom, executeCommand]);

  const handleDistributeHorizontally = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 3) return;

    const updates = distributeHorizontally(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'distribute-h' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to distribute horizontally:', error);
    }
  }, [user, getSelectedObjects, shapes, distributeHorizontally, executeCommand]);

  const handleDistributeVertically = useCallback(async () => {
    if (!user) return;
    const selectedObjects = getSelectedObjects(shapes);
    if (selectedObjects.length < 3) return;

    const updates = distributeVertically(selectedObjects);
    if (updates.length === 0) return;

    try {
      const { AlignShapesCommand } = await import('../services/commandService');
      const command = new AlignShapesCommand({ updates, alignmentType: 'distribute-v' }, user.uid);
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to distribute vertically:', error);
    }
  }, [user, getSelectedObjects, shapes, distributeVertically, executeCommand]);

  // Set up keyboard shortcuts (after all handler functions are defined)
  const { isHelpVisible, setIsHelpVisible } = useKeyboardShortcuts({
    onSelectAll: () => selectAll(shapes),
    onClearSelection: clearSelection,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onCut: handleCut,
    onDuplicate: handleDuplicate,
    onDelete: handleBulkDelete,
    onNudge: handleNudge,
    // Layer (Z-Index) operations
    onBringToFront: handleBringToFront,
    onBringForward: handleBringForward,
    onSendBackward: handleSendBackward,
    onSendToBack: handleSendToBack,
    // Alignment operations
    onAlignLeft: handleAlignLeft,
    onAlignCenter: handleAlignCenter,
    onAlignRight: handleAlignRight,
    onAlignTop: handleAlignTop,
    onAlignMiddle: handleAlignMiddle,
    onAlignBottom: handleAlignBottom,
    onDistributeHorizontally: handleDistributeHorizontally,
    onDistributeVertically: handleDistributeVertically,
    enabled: true, // Always enabled
  });

  // Context menu handlers
  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    
    // Cancel the event bubble to prevent onClick from firing
    e.cancelBubble = true;
    
    // Get the clicked shape
    const clickedShape = e.target;
    const shapeId = clickedShape.id();
    
    // If the clicked shape is not selected, select only it
    // Otherwise, keep the current selection (preserve multi-select)
    if (shapeId && !isSelected(shapeId)) {
      selectObject(shapeId);
    }
    
    // Show context menu at cursor position
    setContextMenu({
      visible: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
    });
  }, [isSelected, selectObject]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Function to get context menu items (not memoized to avoid initialization issues)
  const getContextMenuItems = (): ContextMenuItem[] => {
    const selectedObjects = getSelectedObjects(shapes);
    const hasSelection = selectedObjects.length > 0;
    const selectionCount = selectedObjects.length;
    
    // Add count to labels when multiple objects are selected
    const countSuffix = selectionCount > 1 ? ` (${selectionCount})` : '';

    return [
      {
        id: 'copy',
        label: `Copy${countSuffix}`,
        shortcut: '⌘C',
        onClick: handleCopy,
        disabled: !hasSelection,
      },
      {
        id: 'duplicate',
        label: `Duplicate${countSuffix}`,
        shortcut: '⌘D',
        onClick: handleDuplicate,
        disabled: !hasSelection,
      },
      {
        id: 'delete',
        label: `Delete${countSuffix}`,
        shortcut: '⌫',
        onClick: handleBulkDelete,
        disabled: !hasSelection,
        separator: true,
      },
      {
        id: 'bring-to-front',
        label: `Bring to Front${countSuffix}`,
        shortcut: '⌘⇧]',
        onClick: handleBringToFront,
        disabled: !hasSelection,
        separator: true,
      },
      {
        id: 'bring-forward',
        label: `Bring Forward${countSuffix}`,
        shortcut: '⌘]',
        onClick: handleBringForward,
        disabled: !hasSelection,
      },
      {
        id: 'send-backward',
        label: `Send Backward${countSuffix}`,
        shortcut: '⌘[',
        onClick: handleSendBackward,
        disabled: !hasSelection,
      },
      {
        id: 'send-to-back',
        label: `Send to Back${countSuffix}`,
        shortcut: '⌘⇧[',
        onClick: handleSendToBack,
        disabled: !hasSelection,
      },
    ];
  };

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
    
    // Use current style settings
    const cleanColor = currentColor.replace('#', '');
    const opacityHex = Math.round((currentOpacity / 100) * 255).toString(16).padStart(2, '0');
    const opacity = currentOpacity / 100;

    if (activeTool === 'rectangle') {
      try {
        // Build shape object without saving (command will handle saving)
        const newRectangle = createRectangleShape({ x: clickX, y: clickY }, user.uid, {
          id: generateShapeId('rectangle'),
          width: 120,
          height: 80,
          fill: `#${cleanColor}${opacityHex}`,
          stroke: currentColor,
          strokeWidth: 2,
          opacity: opacity,
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
          fill: `#${cleanColor}${opacityHex}`,
          stroke: currentColor,
          strokeWidth: 2,
          opacity: opacity,
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
            stroke: currentColor,
            strokeWidth: 3,
            opacity: opacity,
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
          fontSize: currentTextSize,
          fontFamily: 'Arial, sans-serif',
          fill: currentColor,
          opacity: opacity,
        });
        const createCommand = new CreateShapeCommand({ shape: newText }, user.uid);
        await executeCommand(createCommand);
        selectObject(newText.id);
      } catch (error) {
        console.error('Failed to create text:', error);
      }
    } else if (activeTool === 'comment') {
      // Store the position and show the comment input
      const containerRect = stage.container().getBoundingClientRect();
      setNewCommentPos({
        x: clickX,
        y: clickY,
        screenX: pos.x * scale + x + containerRect.left,
        screenY: pos.y * scale + y + containerRect.top,
      });
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
          unresolvedCommentsCount={countUnresolvedComments(comments)}
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
          {/* Grid Overlay Layer (drawn first, behind everything) */}
          {gridConfig.showGrid && gridConfig.enabled && (
            <GridOverlay
              width={CANVAS_CONFIG.WIDTH}
              height={CANVAS_CONFIG.HEIGHT}
              gridSize={gridConfig.size}
              visible={gridConfig.showGrid && gridConfig.enabled}
              scale={scale}
            />
          )}
          
          <Layer>
            {/* Canvas Background with Grid */}
            <CanvasBackground 
              scale={scale} 
              snapToGridEnabled={gridConfig.enabled}
              gridSize={gridConfig.size}
            />
            
            {/* Render All Shapes (sorted by z-index) */}
            {sortShapesByZIndex(shapes).map((shape) => {
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
                    onContextMenu={handleContextMenu}
                    currentUserId={user?.uid}
                    currentUserName={userProfile?.displayName}
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
                    onContextMenu={handleContextMenu}
                    currentUserId={user?.uid}
                    currentUserName={userProfile?.displayName}
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
                    onContextMenu={handleContextMenu}
                    currentUserId={user?.uid}
                    currentUserName={userProfile?.displayName}
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
                    onContextMenu={handleContextMenu}
                    currentUserId={user?.uid}
                    currentUserName={userProfile?.displayName}
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

          {/* Comments Layer */}
          <Layer>
            {comments.map((comment) => (
              <CommentPin
                key={comment.id}
                comment={comment}
                isActive={activeCommentId === comment.id}
                onClick={() => handleCommentPinClick(comment.id)}
                scale={scale}
              />
            ))}
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
      
      {/* Right Side Panels - Independent movement */}
      
      {/* Presence List */}
      <DraggablePanel 
        title="Online Users"
        panelId="presence-panel"
        defaultPosition={{ x: windowSize.width - PANEL_WIDTH - 20, y: 160 }}
        className="presence-panel"
      >
        <PresenceList
          presenceData={cursors as any}
          currentUserId={userProfile?.uid}
          currentUserDisplayName={userProfile?.displayName}
          isConnected={presenceConnected}
          loading={presenceLoading}
          onSignOut={signOut}
        />
      </DraggablePanel>

      {/* AI Command Panel - Below Presence Panel */}
      <DraggablePanel 
        title="AI Assistant"
        panelId="ai-assistant-panel"
        defaultPosition={{ x: windowSize.width - PANEL_WIDTH - 20, y: 390 }}
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

      {/* Style Panel - Below AI Assistant */}
      <DraggablePanel 
        title="Style Controls"
        panelId="style-panel"
        defaultPosition={{ x: windowSize.width - PANEL_WIDTH - 20, y: 720 }}
        className="style-panel"
        defaultCollapsed={true}
      >
        <div className="style-controls">
          <div className="control-group">
            <label>Color</label>
            <div className="color-palette-grid">
              {colorPalette.map((color) => (
                <button
                  key={color.value}
                  className={`color-swatch ${currentColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    setCurrentColor(color.value);
                    // Update selected objects
                    const selected = getSelectedObjects(shapes);
                    selected.forEach(shape => {
                      if (shape.type === 'text') {
                        updateShape(shape.id, { fill: color.value });
                      } else if (shape.type === 'rectangle' || shape.type === 'circle') {
                        // Keep transparency for fill, update stroke
                        const cleanColor = color.value.replace('#', '');
                        const opacityHex = Math.round((currentOpacity / 100) * 255).toString(16).padStart(2, '0');
                        updateShape(shape.id, { 
                          stroke: color.value,
                          fill: `#${cleanColor}${opacityHex}`
                        });
                      } else if (shape.type === 'line') {
                        updateShape(shape.id, { stroke: color.value });
                      }
                    });
                  }}
                  title={color.name}
                  type="button"
                />
              ))}
            </div>
          </div>
          
          <div className="control-group">
            <label htmlFor="opacity-slider">Opacity</label>
            <div className="opacity-control">
              <input 
                type="range" 
                id="opacity-slider"
                min="0" 
                max="100" 
                value={currentOpacity}
                onChange={(e) => {
                  const newOpacity = parseInt(e.target.value);
                  setCurrentOpacity(newOpacity);
                  // Update selected objects
                  const selected = getSelectedObjects(shapes);
                  selected.forEach(shape => {
                    if (shape.type === 'rectangle' || shape.type === 'circle' || shape.type === 'text') {
                      updateShape(shape.id, { opacity: newOpacity / 100 });
                    } else if (shape.type === 'line') {
                      updateShape(shape.id, { opacity: newOpacity / 100 });
                    }
                  });
                }}
                className="opacity-slider"
              />
              <span className="opacity-value">{currentOpacity}%</span>
            </div>
          </div>
          
          <div className="control-group">
            <label htmlFor="text-size">Text Size</label>
            <div className="text-size-control">
              <input 
                type="range" 
                id="text-size"
                min="8" 
                max="72" 
                value={currentTextSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setCurrentTextSize(newSize);
                  // Update selected text objects
                  const selected = getSelectedObjects(shapes);
                  selected.forEach(shape => {
                    if (shape.type === 'text') {
                      updateShape(shape.id, { fontSize: newSize });
                    }
                  });
                }}
                className="text-size-slider"
              />
              <span className="text-size-value">{currentTextSize}px</span>
            </div>
          </div>
        </div>
      </DraggablePanel>

      {/* Keyboard Shortcuts Panel */}
      <ShortcutsPanel 
        isVisible={isHelpVisible}
        onClose={() => setIsHelpVisible(false)}
      />

      {/* Comment Thread Panel */}
      {activeCommentId && (
        <DraggablePanel
          title=""
          defaultPosition={{ x: windowSize.width - 420, y: 200 }}
          className="comment-thread-panel"
        >
          {(() => {
            const activeComment = comments.find(c => c.id === activeCommentId);
            if (!activeComment || !user) return null;
            
            return (
              <CommentThread
                comment={activeComment}
                currentUserId={user.uid}
                onAddReply={(text) => addReply(activeCommentId, text)}
                onToggleResolved={() => toggleResolved(activeCommentId)}
                onDelete={() => deleteComment(activeCommentId)}
                onClose={handleCloseCommentThread}
              />
            );
          })()}
        </DraggablePanel>
      )}

      {/* Comment Input Overlay */}
      {newCommentPos && (
        <CommentInput
          x={newCommentPos.screenX}
          y={newCommentPos.screenY}
          onSubmit={handleAddComment}
          onCancel={handleCancelComment}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ShapeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

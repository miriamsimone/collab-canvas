import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../hooks/useAuth';
import { useCanvas, CANVAS_CONFIG } from '../hooks/useCanvas';
import { useRectangles } from '../hooks/useRectangles';
import { usePresence } from '../hooks/usePresence';
import { useAI } from '../hooks/useAI';
import { useSelection } from '../hooks/useSelection';
import { canvasService } from '../services/canvasService';
import { CanvasBackground } from './CanvasBackground';
import { Toolbar } from './Toolbar';
import { CanvasObject } from './CanvasObject';
import { MultiplayerCursors } from './MultiplayerCursor';
import { PresenceList } from './PresenceList';
import { SelectionBox } from './tools/SelectionBox';
import { AICommandInput } from './features/AI/AICommandInput';
import { AILoadingIndicator } from './features/AI/AILoadingIndicator';
import { AIErrorDisplay } from './features/AI/AIErrorDisplay';
import { AICommandHistory } from './features/AI/AICommandHistory';
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

  // Real-time rectangles management
  const {
    rectangles,
    loading: rectanglesLoading,
    error: rectanglesError,
    isConnected,
    createRectangle,
    updateRectangle,
    updateRectangleTransform,
    deleteRectangle,
    clearError: clearRectanglesError,
  } = useRectangles();

  // Multi-select management
  const {
    selectedIds,
    selectionBounds,
    isDragSelecting,
    dragStartPos,
    dragCurrentPos,
    selectObject,
    deselectObject,
    toggleSelection,
    addToSelection,
    clearSelection,
    selectAll,
    selectMultiple,
    isSelected,
    getSelectedObjects,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    selectByType,
    selectByColor,
    selectByPosition,
  } = useSelection();

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
    const selectedObjects = getSelectedObjects(rectangles);
    if (selectedObjects.length === 0) return;

    try {
      // Delete all selected rectangles using the hook's method
      const deletePromises = selectedObjects.map(obj => 
        deleteRectangle(obj.id)
      );
      await Promise.all(deletePromises);
      
      // Clear selection after deletion
      clearSelection();
    } catch (error) {
      console.error('Failed to delete selected rectangles:', error);
      setCanvasError('Failed to delete selected objects. Please try again.');
    }
  };

  const handleBulkMove = async (deltaX: number, deltaY: number) => {
    const selectedObjects = getSelectedObjects(rectangles);
    if (selectedObjects.length === 0) return;

    try {
      // Move all selected rectangles
      const movePromises = selectedObjects.map(obj => 
        updateRectangle(obj.id, { 
          x: obj.x + deltaX, 
          y: obj.y + deltaY 
        })
      );
      await Promise.all(movePromises);
    } catch (error) {
      console.error('Failed to move selected rectangles:', error);
      setCanvasError('Failed to move selected objects. Please try again.');
    }
  };

  const handleBulkChangeColor = async (newColor: string) => {
    const selectedObjects = getSelectedObjects(rectangles);
    if (selectedObjects.length === 0) return;

    try {
      // Change color of all selected rectangles with semi-transparency
      const cleanColor = newColor.replace('#', '').substring(0, 6); // Remove # and any existing alpha
      const transparentFill = `#${cleanColor}40`; // Add 25% opacity (40 in hex)
      
      const colorPromises = selectedObjects.map(obj => 
        updateRectangle(obj.id, { 
          fill: transparentFill,
          stroke: newColor
        })
      );
      await Promise.all(colorPromises);
    } catch (error) {
      console.error('Failed to change color of selected rectangles:', error);
      setCanvasError('Failed to change color of selected objects. Please try again.');
    }
  };

  // AI rectangle creation handler
  const handleAICreateRectangle = async (x: number, y: number, width: number, height: number, color: string): Promise<void> => {
    try {
      await createRectangle(x, y, width, height, color);
    } catch (error) {
      console.error('Failed to create AI rectangle:', error);
      throw error; // Re-throw to let AI hook handle the error
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
    rectangles,
    canvasSize: { width: windowSize.width, height: windowSize.height },
    onCreateRectangle: handleAICreateRectangle,
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
        selectAll(rectangles);
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
  }, [rectangles, selectAll, clearSelection, getSelectedObjects, handleBulkDelete]);

  // Rectangle interaction handlers
  const handleRectangleDragStart = () => {
    setIsDraggingRectangle(true);
  };

  // Handle rectangle drag end (position updates with real-time sync)
  const handleRectangleDragEnd = async (id: string, x: number, y: number) => {
    try {
      await updateRectangle(id, { x, y });
    } catch (error) {
      console.error('Failed to update rectangle position:', error);
      // Error handling is managed by useRectangles hook
    }
    setIsDraggingRectangle(false);
  };

  // Handle rectangle transform end (resize/rotate operations with real-time sync)
  const handleRectangleTransformEnd = async (id: string, x: number, y: number, width: number, height: number) => {
    try {
      await updateRectangleTransform(id, x, y, width, height);
    } catch (error) {
      console.error('Failed to update rectangle transform:', error);
      setCanvasError('Failed to update rectangle size. Please try again.');
    }
    setIsDraggingRectangle(false);
  };

  // Handle rectangle selection with support for multi-select
  const handleRectangleSelect = (id: string, event?: { shiftKey?: boolean }) => {
    if (event?.shiftKey) {
      // Shift-click: toggle object in selection
      toggleSelection(id);
    } else {
      // Regular click: select only this object
      selectObject(id);
    }
  };


  const handleStageClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't create rectangles if dragging the canvas, rectangles, or drag selecting
    if (isDragging || isDraggingRectangle || isDragSelecting) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getCanvasPointerPosition(stage);
    if (!pos) return;

    if (activeTool === 'rectangle') {
      // Create a new rectangle at the click position with real-time sync
      try {
        const newRectangle = await createRectangle(pos.x, pos.y);
        selectObject(newRectangle.id); // Select the newly created rectangle
      } catch (error) {
        console.error('Failed to create rectangle:', error);
        // Error handling is managed by useRectangles hook
      }
    } else if (activeTool === 'select') {
      // Deselect if clicking on empty space (not on a rectangle)
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
    if (activeTool !== 'select' || isDraggingRectangle || e.target !== e.target.getStage()) {
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
      endDragSelection(rectangles);
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
                {rectanglesLoading ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="user-info">
            <span className="welcome-text">
              Welcome, {userProfile?.displayName}!
            </span>
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
      {rectanglesError && (
        <div className="error-toast">
          <div className="error-content">
            <span className="error-message">{rectanglesError}</span>
            <button 
              onClick={clearRectanglesError}
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
      <Toolbar 
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />
      
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
          draggable={activeTool === 'select' && !isDraggingRectangle}
          listening={!isDraggingRectangle}
          onDragStart={(e) => {
            // Completely prevent canvas dragging when dealing with rectangles
            if (isDraggingRectangle || activeTool === 'rectangle') {
              e.evt?.preventDefault();
              e.evt?.stopPropagation();
              return false;
            }
            // Only allow Stage dragging if clicking on Stage itself, not on rectangles
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
            <CanvasBackground scale={scale} />
            
            {/* Render Rectangles */}
            {rectangles.map((rectangle) => (
              <CanvasObject
                key={rectangle.id}
                object={rectangle}
                isSelected={isSelected(rectangle.id)}
                onSelect={(event?: { shiftKey?: boolean }) => handleRectangleSelect(rectangle.id, event)}
                onDragStart={handleRectangleDragStart}
                onDragEnd={handleRectangleDragEnd}
                onTransformEnd={handleRectangleTransformEnd}
                currentUserId={user?.uid}
                onCursorUpdate={updateCursorPosition}
              />
            ))}

            {/* Selection Box for drag selection */}
            <SelectionBox
              startPos={dragStartPos}
              currentPos={dragCurrentPos}
              isVisible={isDragSelecting}
            />
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
      <PresenceList
        presenceData={cursors as any}
        currentUserId={userProfile?.uid}
        isConnected={presenceConnected}
        loading={presenceLoading}
      />

      {/* AI Command Panel */}
      <div className="ai-panel">
        <div className="ai-panel-header">
          <h3>AI Assistant</h3>
          <div className="ai-status">
            {aiLoading && <AILoadingIndicator size="small" />}
          </div>
        </div>
        
        <div className="ai-panel-content">
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
    </div>
  );
};

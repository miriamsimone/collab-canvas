import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../hooks/useAuth';
import { useCanvas, CANVAS_CONFIG } from '../hooks/useCanvas';
import { useRectangles } from '../hooks/useRectangles';
import { CanvasBackground } from './CanvasBackground';
import { Toolbar } from './Toolbar';
import { CanvasObject } from './CanvasObject';
import { getCanvasPointerPosition } from '../utils/canvasHelpers';

export const Canvas: React.FC = () => {
  const { userProfile, signOut } = useAuth();
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
    clearError: clearRectanglesError,
  } = useRectangles();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 60, // Account for header
  });

  // Local UI state  
  const [selectedRectangleId, setSelectedRectangleId] = useState<string | null>(null);
  const [isDraggingRectangle, setIsDraggingRectangle] = useState<boolean>(false);

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

  // Handle rectangle selection
  const handleRectangleSelect = (id: string) => {
    setSelectedRectangleId(id);
  };

  const handleStageClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't create rectangles if dragging the canvas or rectangles
    if (isDragging || isDraggingRectangle) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getCanvasPointerPosition(stage);
    if (!pos) return;

    if (activeTool === 'rectangle') {
      // Create a new rectangle at the click position with real-time sync
      try {
        const newRectangle = await createRectangle(pos.x, pos.y);
        setSelectedRectangleId(newRectangle.id);
      } catch (error) {
        console.error('Failed to create rectangle:', error);
        // Error handling is managed by useRectangles hook
      }
    } else if (activeTool === 'select') {
      // Deselect if clicking on empty space (not on a rectangle)
      if (e.target === stage) {
        setSelectedRectangleId(null);
      }
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
      
      {/* Error Toast */}
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
                isSelected={selectedRectangleId === rectangle.id}
                onSelect={() => handleRectangleSelect(rectangle.id)}
                onDragStart={handleRectangleDragStart}
                onDragEnd={handleRectangleDragEnd}
              />
            ))}
          </Layer>
        </Stage>
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
    </div>
  );
};

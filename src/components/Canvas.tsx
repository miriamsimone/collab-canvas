import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../hooks/useAuth';
import { useCanvas, CANVAS_CONFIG } from '../hooks/useCanvas';
import { CanvasBackground } from './CanvasBackground';

export const Canvas: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const stageRef = useRef<Konva.Stage>(null);
  const { 
    scale, 
    x, 
    y, 
    isDragging,
    setPosition, 
    setIsDragging,
    handleZoom,
    centerView 
  } = useCanvas();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 60, // Account for header
  });

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

  return (
    <div className="canvas-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>CollabCanvas</h1>
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
          draggable
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e) => {
            setIsDragging(false);
            setPosition(e.target.x(), e.target.y());
          }}
          onWheel={handleZoom}
        >
          <Layer>
            {/* Canvas Background with Grid */}
            <CanvasBackground scale={scale} />
            {/* Shapes will be rendered here later */}
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

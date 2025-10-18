import React from 'react';
import { Line, Rect } from 'react-konva';
import { CANVAS_DIMENSIONS, generateGridLines } from '../utils/canvasHelpers';

interface CanvasBackgroundProps {
  scale: number;
  snapToGridEnabled?: boolean;
  gridSize?: number;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ 
  scale,
  snapToGridEnabled = false,
  gridSize = 20,
}) => {
  // Show grid when zoomed in enough OR when snap-to-grid is enabled
  const showGrid = scale > 0.3 || snapToGridEnabled;
  
  // Use custom grid size if snap-to-grid is enabled, otherwise use default zoom-based sizing
  const effectiveGridSize = snapToGridEnabled ? gridSize : (scale > 0.8 ? 50 : 100);
  
  // More visible grid when snap-to-grid is enabled
  const gridOpacity = snapToGridEnabled ? 0.4 : Math.min(scale * 0.5, 0.3);
  const gridStroke = snapToGridEnabled ? '#10b981' : '#f0f0f0';
  const gridStrokeWidth = snapToGridEnabled ? 1.5 : 1;
  
  const { vertical, horizontal } = generateGridLines(effectiveGridSize);

  return (
    <>
      {/* Canvas Background */}
      <Rect
        x={0}
        y={0}
        width={CANVAS_DIMENSIONS.WIDTH}
        height={CANVAS_DIMENSIONS.HEIGHT}
        fill="#ffffff"
        stroke="#e0e0e0"
        strokeWidth={2}
        listening={false} // Don't interfere with mouse events for drag selection
      />
      
      {/* Grid Lines */}
      {showGrid && (
        <>
          {/* Vertical Grid Lines */}
          {vertical.map((x) => (
            <Line
              key={`v-${x}`}
              points={[x, 0, x, CANVAS_DIMENSIONS.HEIGHT]}
              stroke={gridStroke}
              strokeWidth={gridStrokeWidth}
              opacity={gridOpacity}
              listening={false} // Don't interfere with mouse events
            />
          ))}
          
          {/* Horizontal Grid Lines */}
          {horizontal.map((y) => (
            <Line
              key={`h-${y}`}
              points={[0, y, CANVAS_DIMENSIONS.WIDTH, y]}
              stroke={gridStroke}
              strokeWidth={gridStrokeWidth}
              opacity={gridOpacity}
              listening={false} // Don't interfere with mouse events
            />
          ))}
        </>
      )}
      
      {/* Canvas Boundary */}
      <Rect
        x={0}
        y={0}
        width={CANVAS_DIMENSIONS.WIDTH}
        height={CANVAS_DIMENSIONS.HEIGHT}
        fill="transparent"
        stroke="#007ACC"
        strokeWidth={3}
        dash={[20, 10]}
        listening={false}
      />
      
      {/* Corner Indicators */}
      <Rect
        x={0}
        y={0}
        width={40}
        height={40}
        fill="#007ACC"
        opacity={0.7}
        cornerRadius={5}
        listening={false}
      />
      
      <Rect
        x={CANVAS_DIMENSIONS.WIDTH - 40}
        y={CANVAS_DIMENSIONS.HEIGHT - 40}
        width={40}
        height={40}
        fill="#007ACC"
        opacity={0.7}
        cornerRadius={5}
        listening={false}
      />
    </>
  );
};

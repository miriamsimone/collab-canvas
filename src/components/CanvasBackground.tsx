import React from 'react';
import { Line, Rect } from 'react-konva';
import { CANVAS_DIMENSIONS, generateGridLines } from '../utils/canvasHelpers';

interface CanvasBackgroundProps {
  scale: number;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ scale }) => {
  // Only show grid when zoomed in enough to see it clearly
  const showGrid = scale > 0.3;
  const gridSize = scale > 0.8 ? 50 : 100; // Larger grid when zoomed out
  const gridOpacity = Math.min(scale * 0.5, 0.3);
  
  const { vertical, horizontal } = generateGridLines(gridSize);

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
              stroke="#f0f0f0"
              strokeWidth={1}
              opacity={gridOpacity}
              listening={false} // Don't interfere with mouse events
            />
          ))}
          
          {/* Horizontal Grid Lines */}
          {horizontal.map((y) => (
            <Line
              key={`h-${y}`}
              points={[0, y, CANVAS_DIMENSIONS.WIDTH, y]}
              stroke="#f0f0f0"
              strokeWidth={1}
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

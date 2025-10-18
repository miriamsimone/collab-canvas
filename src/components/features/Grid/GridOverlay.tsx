import React from 'react';
import { Layer, Line } from 'react-konva';

interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
  visible: boolean;
  scale: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  gridSize,
  visible,
  scale,
}) => {
  if (!visible) return null;

  // Adjust grid size based on scale for better visibility
  const effectiveGridSize = gridSize * scale;
  
  // Don't render if grid would be too small to see
  if (effectiveGridSize < 5) return null;

  const lines: React.ReactNode[] = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#e0e0e0"
        strokeWidth={0.5 / scale}
        opacity={0.5}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#e0e0e0"
        strokeWidth={0.5 / scale}
        opacity={0.5}
        listening={false}
      />
    );
  }

  return (
    <Layer listening={false}>
      {lines}
    </Layer>
  );
};


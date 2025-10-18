import React from 'react';
import { Rect } from 'react-konva';

interface SelectionBoxProps {
  startPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
  isVisible: boolean;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ 
  startPos, 
  currentPos, 
  isVisible 
}) => {
  if (!isVisible || !startPos || !currentPos) {
    return null;
  }

  // Calculate rectangle properties for the selection box
  const x = Math.min(startPos.x, currentPos.x);
  const y = Math.min(startPos.y, currentPos.y);
  const width = Math.abs(currentPos.x - startPos.x);
  const height = Math.abs(currentPos.y - startPos.y);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 123, 255, 0.1)" // Light blue with transparency
      stroke="rgba(0, 123, 255, 0.6)" // Blue border
      strokeWidth={1}
      dash={[5, 5]} // Dashed border
      listening={false} // Don't interfere with other interactions
      perfectDrawEnabled={false} // Performance optimization
    />
  );
};

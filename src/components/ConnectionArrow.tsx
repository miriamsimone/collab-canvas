import React, { useMemo } from 'react';
import { Arrow, Group } from 'react-konva';
import type { AudioConnection } from '../types/connections';
import type { Shape } from '../types/shapes';

interface ConnectionArrowProps {
  connection: AudioConnection;
  shapes: Shape[];
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const ConnectionArrow: React.FC<ConnectionArrowProps> = ({
  connection,
  shapes,
  isSelected,
  onSelect,
  onDelete,
}) => {
  // Find source and target shapes
  const sourceShape = useMemo(
    () => shapes.find(s => s.id === connection.sourceShapeId),
    [shapes, connection.sourceShapeId]
  );

  const targetShape = useMemo(
    () => shapes.find(s => s.id === connection.targetShapeId),
    [shapes, connection.targetShapeId]
  );

  // Calculate shape centers
  const getShapeCenter = (shape: Shape): { x: number; y: number } | null => {
    if (!shape) return null;

    if (shape.type === 'rectangle') {
      return {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
    } else if (shape.type === 'circle') {
      return {
        x: shape.x,
        y: shape.y,
      };
    } else if (shape.type === 'line') {
      return {
        x: (shape.x + shape.x2) / 2,
        y: (shape.y + shape.y2) / 2,
      };
    } else if (shape.type === 'text') {
      return {
        x: shape.x + (shape.width || 100) / 2,
        y: shape.y + (shape.height || 30) / 2,
      };
    }

    return null;
  };

  const sourceCenter = sourceShape ? getShapeCenter(sourceShape) : null;
  const targetCenter = targetShape ? getShapeCenter(targetShape) : null;

  // Don't render if either shape is missing
  if (!sourceCenter || !targetCenter) {
    return null;
  }

  // Arrow styling
  const arrowColor = '#8b5cf6'; // Purple
  const strokeWidth = isSelected ? 4 : 3;
  const dash = [10, 5]; // Dashed line

  return (
    <Group>
      <Arrow
        points={[
          sourceCenter.x,
          sourceCenter.y,
          targetCenter.x,
          targetCenter.y,
        ]}
        stroke={arrowColor}
        strokeWidth={strokeWidth}
        fill={arrowColor}
        dash={dash}
        pointerLength={15}
        pointerWidth={15}
        shadowColor={isSelected ? '#3b82f6' : 'rgba(0, 0, 0, 0.3)'}
        shadowBlur={isSelected ? 10 : 4}
        shadowOpacity={isSelected ? 0.8 : 0.3}
        shadowOffsetX={0}
        shadowOffsetY={2}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDblClick={(e) => {
          e.cancelBubble = true;
          onDelete();
        }}
        onDblTap={(e) => {
          e.cancelBubble = true;
          onDelete();
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
      />
    </Group>
  );
};


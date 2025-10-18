import React from 'react';
import { Line } from 'react-konva';
import { CANVAS_DIMENSIONS } from '../../../utils/canvasHelpers';
import type { SmartGuide } from '../../../hooks/useGrid';

interface SmartGuidesProps {
  guides: SmartGuide[];
}

/**
 * Component to render smart alignment guides on the canvas
 * Shows when shapes align with other shapes during dragging
 */
export const SmartGuides: React.FC<SmartGuidesProps> = ({ guides }) => {
  if (!guides || guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          return (
            <Line
              key={`smart-guide-v-${index}`}
              points={[guide.position, 0, guide.position, CANVAS_DIMENSIONS.HEIGHT]}
              stroke="#FF00FF"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              opacity={0.8}
            />
          );
        } else {
          return (
            <Line
              key={`smart-guide-h-${index}`}
              points={[0, guide.position, CANVAS_DIMENSIONS.WIDTH, guide.position]}
              stroke="#FF00FF"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              opacity={0.8}
            />
          );
        }
      })}
    </>
  );
};


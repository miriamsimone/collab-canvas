import React from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';

export interface CanvasObjectData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

interface CanvasObjectProps {
  object: CanvasObjectData;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const CanvasObject: React.FC<CanvasObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  const shapeRef = React.useRef<Konva.Rect>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  // Update transformer when selection changes
  React.useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to Stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    onDragStart();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to Stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    const node = e.target;
    onDragEnd(object.id, node.x(), node.y());
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    // Reset scale and apply to width/height instead
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    // Update the object dimensions
    const newWidth = Math.max(20, node.width() * scaleX); // Min width 20px
    const newHeight = Math.max(20, node.height() * scaleY); // Min height 20px
    
    node.width(newWidth);
    node.height(newHeight);
    
    // Trigger update (could be extended to call a callback)
    onDragEnd(object.id, node.x(), node.y());
  };


  return (
    <>
      <Rect
        ref={shapeRef}
        id={object.id}
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        fill={object.fill}
        stroke={object.stroke}
        strokeWidth={object.strokeWidth}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        // Visual feedback on hover
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
        // Selection styling
        shadowColor={isSelected ? object.stroke : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Show transformer only when selected */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to reasonable dimensions
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
          // Transformer styling
          borderStroke={object.stroke}
          borderStrokeWidth={2}
          anchorStroke={object.stroke}
          anchorStrokeWidth={2}
          anchorFill='white'
          anchorSize={8}
          // Keep aspect ratio when holding shift
          keepRatio={false}
          // Enable rotation
          enabledAnchors={[
            'top-left',
            'top-center', 
            'top-right',
            'middle-right',
            'bottom-right',
            'bottom-center',
            'bottom-left',
            'middle-left'
          ]}
        />
      )}
    </>
  );
};

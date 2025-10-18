import React from 'react';
import { Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { CircleShape } from '../../types/shapes';
import { realtimeObjectService } from '../../services/realtimeObjectService';

interface CircleComponentProps {
  shape: CircleShape;
  isSelected: boolean;
  onSelect: (event?: { shiftKey?: boolean }) => void;
  onDragStart: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformStart?: (id: string, dimensions: { x: number; y: number; radius: number }) => void;
  onTransformEnd?: (id: string, x: number, y: number, radius: number) => void;
  currentUserId?: string;
  onCursorUpdate?: (x: number, y: number) => void;
}

export const CircleComponent: React.FC<CircleComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  currentUserId,
  onCursorUpdate,
}) => {
  const shapeRef = React.useRef<Konva.Circle>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  // Update transformer when selection changes
  React.useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragStart = async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to Stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    
    // Start real-time dragging in RTDB
    if (currentUserId) {
      try {
        await realtimeObjectService.updateObjectPosition(shape.id, {
          x: shape.x,
          y: shape.y,
          width: shape.radius * 2, // Store diameter as width for consistency
          height: shape.radius * 2,
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB circle dragging:', error);
      }
    }
    
    onDragStart(shape.id, shape.x, shape.y);
  };

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to Stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    const node = e.target;
    
    // Call the original onDragEnd first (which will save to Firestore)
    onDragEnd(shape.id, node.x(), node.y());
    
    // Add grace period before stopping RTDB dragging to prevent snap-back
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(shape.id);
        }, 1000); // 1 second grace period
      } catch (error) {
        console.error('Failed to stop RTDB circle dragging:', error);
      }
    }
  };

  // Handle continuous drag movement for real-time updates
  const handleDragMove = async (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!currentUserId) return;
    
    const node = e.target;
    const stage = node.getStage();
    
    try {
      // Update circle position in RTDB
      await realtimeObjectService.updateObjectPosition(shape.id, {
        x: node.x(),
        y: node.y(),
        width: shape.radius * 2,
        height: shape.radius * 2,
        isDragging: true,
        draggedBy: currentUserId,
      });

      // Also update cursor position during drag
      if (onCursorUpdate && stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          const transform = stage.getAbsoluteTransform().copy();
          transform.invert();
          const canvasPos = transform.point(pointerPosition);
          onCursorUpdate(canvasPos.x, canvasPos.y);
        }
      }
    } catch (error) {
      console.error('Failed to update RTDB circle position during drag:', error);
    }
  };

  // Handle continuous transform (resize) for real-time updates
  const handleTransform = async () => {
    if (!currentUserId) return;
    
    const node = shapeRef.current;
    if (!node) return;

    const stage = node.getStage();
    
    try {
      // Get current scale values to calculate new radius
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // For circles, we'll use the average scale to maintain circular shape
      const avgScale = (scaleX + scaleY) / 2;
      const currentRadius = Math.max(10, shape.radius * avgScale); // Min radius 10px

      // Update circle position and size in RTDB during transform
      await realtimeObjectService.updateObjectPosition(shape.id, {
        x: node.x(),
        y: node.y(),
        width: currentRadius * 2,
        height: currentRadius * 2,
        isDragging: true,
        draggedBy: currentUserId,
      });

      // Update cursor position during transform
      if (onCursorUpdate && stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          const transform = stage.getAbsoluteTransform().copy();
          transform.invert();
          const canvasPos = transform.point(pointerPosition);
          onCursorUpdate(canvasPos.x, canvasPos.y);
        }
      }
    } catch (error) {
      console.error('Failed to update RTDB circle position during transform:', error);
    }
  };

  const handleTransformStart = async () => {
    // Capture initial dimensions for undo/redo
    onTransformStart?.(shape.id, {
      x: shape.x,
      y: shape.y,
      radius: shape.radius,
    });

    // Start real-time transform tracking in RTDB
    if (currentUserId) {
      try {
        await realtimeObjectService.updateObjectPosition(shape.id, {
          x: shape.x,
          y: shape.y,
          width: shape.radius * 2,
          height: shape.radius * 2,
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB circle transform tracking:', error);
      }
    }
  };

  const handleTransformEnd = async () => {
    const node = shapeRef.current;
    if (!node) return;

    // Get scale values and calculate new radius
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and apply to radius instead
    node.scaleX(1);
    node.scaleY(1);
    
    // For circles, use average scale to maintain circular shape
    const avgScale = (scaleX + scaleY) / 2;
    const newRadius = Math.max(10, shape.radius * avgScale); // Min radius 10px
    
    // Get the current position (circle should stay at shape.x, shape.y)
    const currentX = shape.x;
    const currentY = shape.y;
    
    // Call the transform callback if provided (for Firestore persistence)
    if (onTransformEnd) {
      onTransformEnd(shape.id, currentX, currentY, newRadius);
    } else {
      // Fallback to drag end callback
      onDragEnd(shape.id, currentX, currentY);
    }
    
    // Add grace period before stopping RTDB state (same as drag)
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(shape.id);
        }, 1000); // 1 second grace period
      } catch (error) {
        console.error('Failed to stop RTDB circle transform:', error);
      }
    }
  };

  return (
    <>
      <Circle
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        radius={shape.radius}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity || 1}
        visible={shape.visible !== false}
        rotation={shape.rotation || 0}
        draggable={!shape.locked}
        onClick={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
        onTap={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        // Visual feedback on hover
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage && !shape.locked) {
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
        shadowColor={isSelected ? shape.stroke : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Show transformer only when selected */}
      {isSelected && !shape.locked && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to reasonable dimensions
            const minSize = 20;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            
            // For circles, we want to maintain aspect ratio
            const size = Math.min(newBox.width, newBox.height);
            return {
              ...newBox,
              width: size,
              height: size,
            };
          }}
          // Real-time transform handlers
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
          // Transformer styling
          borderStroke={shape.stroke}
          borderStrokeWidth={2}
          anchorStroke={shape.stroke}
          anchorStrokeWidth={2}
          anchorFill='white'
          anchorSize={8}
          // Keep aspect ratio for circles
          keepRatio={true}
          // Enable resize anchors
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-right',
            'bottom-left'
          ]}
        />
      )}
    </>
  );
};

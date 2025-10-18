import React from 'react';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { realtimeObjectService } from '../services/realtimeObjectService';

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
  onSelect: (event?: { shiftKey?: boolean }) => void;
  onDragStart: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformStart?: (id: string, dimensions: { x: number; y: number; width: number; height: number }) => void; // For resize undo support
  onTransformEnd?: (id: string, x: number, y: number, width: number, height: number) => void; // For resize handling
  currentUserId?: string; // For RTDB real-time dragging
  onCursorUpdate?: (x: number, y: number) => void; // For cursor updates during drag/resize
}

export const CanvasObject: React.FC<CanvasObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onDragStart,  
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  currentUserId,
  onCursorUpdate,
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

  const handleDragStart = async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to Stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    
    // Start real-time dragging in RTDB
    if (currentUserId) {
      try {
        await realtimeObjectService.updateObjectPosition(object.id, {
          x: object.x,
          y: object.y,
          width: object.width,
          height: object.height,
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB dragging:', error);
      }
    }
    
    onDragStart(object.id, object.x, object.y);
  };

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling to Stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    const node = e.target;
    
    // Call the original onDragEnd first (which will save to Firestore)
    onDragEnd(object.id, node.x(), node.y());
    
    // Add grace period before stopping RTDB dragging to prevent snap-back
    if (currentUserId) {
      try {
        // Wait a bit for Firestore to update before cleaning up RTDB
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(object.id);
        }, 1000); // 1 second grace period
      } catch (error) {
        console.error('Failed to stop RTDB dragging:', error);
      }
    }
  };

  // Handle continuous drag movement for real-time updates
  const handleDragMove = async (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!currentUserId) return;
    
    const node = e.target;
    const stage = node.getStage();
    
    try {
      // Update object position in RTDB
      await realtimeObjectService.updateObjectPosition(object.id, {
        x: node.x(),
        y: node.y(),
        width: object.width,
        height: object.height,
        isDragging: true,
        draggedBy: currentUserId,
      });

      // Also update cursor position during drag to maintain smooth cursor movement
      if (onCursorUpdate && stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          // Convert screen coordinates to canvas coordinates
          const transform = stage.getAbsoluteTransform().copy();
          transform.invert();
          const canvasPos = transform.point(pointerPosition);
          onCursorUpdate(canvasPos.x, canvasPos.y);
        }
      }
    } catch (error) {
      console.error('Failed to update RTDB position during drag:', error);
    }
  };

  // Handle continuous transform (resize/rotate) for real-time updates
  const handleTransform = async () => {
    if (!currentUserId) return;
    
    const node = shapeRef.current;
    if (!node) return;

    const stage = node.getStage();
    
    try {
      // Get current transform values
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const currentWidth = Math.max(20, node.width() * scaleX);
      const currentHeight = Math.max(20, node.height() * scaleY);

      // Update object position and size in RTDB during transform
      await realtimeObjectService.updateObjectPosition(object.id, {
        x: node.x(),
        y: node.y(),
        width: currentWidth,
        height: currentHeight,
        isDragging: true, // Use dragging flag for transforms too
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
      console.error('Failed to update RTDB position during transform:', error);
    }
  };

  const handleTransformStart = async () => {
    // Capture initial dimensions for undo/redo
    onTransformStart?.(object.id, {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    });

    // Start real-time transform tracking in RTDB
    if (currentUserId) {
      try {
        await realtimeObjectService.updateObjectPosition(object.id, {
          x: object.x,
          y: object.y,
          width: object.width,
          height: object.height,
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB transform tracking:', error);
      }
    }
  };

  const handleTransformEnd = async () => {
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
    
    // Call the transform callback if provided (for Firestore persistence)
    if (onTransformEnd) {
      onTransformEnd(object.id, node.x(), node.y(), newWidth, newHeight);
    } else {
      // Fallback to drag end callback
      onDragEnd(object.id, node.x(), node.y());
    }
    
    // Add grace period before stopping RTDB state (same as drag)
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(object.id);
        }, 1000); // 1 second grace period
      } catch (error) {
        console.error('Failed to stop RTDB transform after transform:', error);
      }
    }
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
        onClick={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
        onTap={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
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
          // Real-time transform handlers
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
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

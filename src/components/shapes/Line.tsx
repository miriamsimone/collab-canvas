import React from 'react';
import { Line, Circle, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import type { LineShape } from '../../types/shapes';
import { realtimeObjectService } from '../../services/realtimeObjectService';

interface LineComponentProps {
  shape: LineShape;
  isSelected: boolean;
  onSelect: (event?: { shiftKey?: boolean }) => void;
  onDragStart: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformStart?: (id: string, dimensions: { x: number; y: number; x2: number; y2: number }) => void;
  onTransformEnd?: (id: string, x: number, y: number, x2: number, y2: number) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  currentUserId?: string;
  onCursorUpdate?: (x: number, y: number) => void;
}

export const LineComponent: React.FC<LineComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onContextMenu,
  currentUserId,
  onCursorUpdate,
}) => {
  const groupRef = React.useRef<Konva.Group>(null);
  const lineRef = React.useRef<Konva.Line>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);
  const startPointRef = React.useRef<Konva.Circle>(null);
  const endPointRef = React.useRef<Konva.Circle>(null);

  // Calculate points array for Konva Line (relative to group position)
  const points = [0, 0, shape.x2 - shape.x, shape.y2 - shape.y];

  // Update transformer when selection changes
  React.useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
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
        const lineWidth = Math.abs(shape.x2 - shape.x);
        const lineHeight = Math.abs(shape.y2 - shape.y);
        
        await realtimeObjectService.updateObjectPosition(shape.id, {
          x: shape.x,
          y: shape.y,
          width: lineWidth,
          height: lineHeight,
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB line dragging:', error);
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
    
    // Calculate new positions for both endpoints
    const deltaX = node.x() - shape.x;
    const deltaY = node.y() - shape.y;
    
    const newX = shape.x + deltaX;
    const newY = shape.y + deltaY;
    const newX2 = shape.x2 + deltaX;
    const newY2 = shape.y2 + deltaY;
    
    // Call the appropriate callback
    if (onTransformEnd) {
      onTransformEnd(shape.id, newX, newY, newX2, newY2);
    } else {
      onDragEnd(shape.id, newX, newY);
    }
    
    // Add grace period before stopping RTDB dragging
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(shape.id);
        }, 1000);
      } catch (error) {
        console.error('Failed to stop RTDB line dragging:', error);
      }
    }
  };

  // Handle continuous drag movement for real-time updates
  const handleDragMove = async (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!currentUserId) return;
    
    const node = e.target;
    const stage = node.getStage();
    
    try {
      const lineWidth = Math.abs(shape.x2 - shape.x);
      const lineHeight = Math.abs(shape.y2 - shape.y);
      
      // Update line position in RTDB
      await realtimeObjectService.updateObjectPosition(shape.id, {
        x: node.x(),
        y: node.y(),
        width: lineWidth,
        height: lineHeight,
        isDragging: true,
        draggedBy: currentUserId,
      });

      // Update cursor position during drag
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
      console.error('Failed to update RTDB line position during drag:', error);
    }
  };

  const handleTransformStart = async () => {
    // Capture initial dimensions for undo/redo
    onTransformStart?.(shape.id, {
      x: shape.x,
      y: shape.y,
      x2: shape.x2,
      y2: shape.y2,
    });

    if (currentUserId) {
      try {
        const lineWidth = Math.abs(shape.x2 - shape.x);
        const lineHeight = Math.abs(shape.y2 - shape.y);
        
        await realtimeObjectService.updateObjectPosition(shape.id, {
          x: shape.x,
          y: shape.y,
          width: lineWidth,
          height: lineHeight,
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB line transform tracking:', error);
      }
    }
  };

  const handleTransform = async () => {
    if (!currentUserId) return;
    
    const node = groupRef.current;
    if (!node) return;

    const stage = node.getStage();
    
    try {
      // Get current transform values
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Calculate new line dimensions
      const newWidth = Math.abs((shape.x2 - shape.x) * scaleX);
      const newHeight = Math.abs((shape.y2 - shape.y) * scaleY);

      await realtimeObjectService.updateObjectPosition(shape.id, {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        isDragging: true,
        draggedBy: currentUserId,
      });

      // Update cursor position
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
      console.error('Failed to update RTDB line during transform:', error);
    }
  };

  const handleTransformEnd = async () => {
    const node = groupRef.current;
    if (!node) return;

    // Get scale values
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and calculate new endpoints
    node.scaleX(1);
    node.scaleY(1);
    
    // Calculate new endpoint positions
    const newX = node.x();
    const newY = node.y();
    const newX2 = newX + (shape.x2 - shape.x) * scaleX;
    const newY2 = newY + (shape.y2 - shape.y) * scaleY;
    
    // Call the transform callback
    if (onTransformEnd) {
      onTransformEnd(shape.id, newX, newY, newX2, newY2);
    } else {
      onDragEnd(shape.id, newX, newY);
    }
    
    // Grace period before stopping RTDB
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(shape.id);
        }, 1000);
      } catch (error) {
        console.error('Failed to stop RTDB line transform:', error);
      }
    }
  };

  // Handle endpoint dragging
  const handleEndpointDrag = (isStartPoint: boolean) => {
    return (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      if (e.evt) {
        e.evt.stopPropagation?.();
      }

      const node = e.target;
      const group = groupRef.current;
      if (!group || !onTransformEnd) return;

      // Get the new position relative to the group
      const newLocalX = node.x();
      const newLocalY = node.y();
      
      // Convert to global coordinates
      const groupX = group.x();
      const groupY = group.y();
      const globalX = groupX + newLocalX;
      const globalY = groupY + newLocalY;

      if (isStartPoint) {
        // Moving start point - update shape.x, shape.y
        onTransformEnd(shape.id, globalX, globalY, shape.x2, shape.y2);
      } else {
        // Moving end point - update shape.x2, shape.y2  
        onTransformEnd(shape.id, shape.x, shape.y, globalX, globalY);
      }
    };
  };

  return (
    <Group
      ref={groupRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation || 0}
      opacity={shape.opacity || 1}
      visible={shape.visible !== false}
      draggable={!shape.locked}
      onClick={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
      onTap={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
      onContextMenu={onContextMenu}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
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
    >
      {/* Main line */}
      <Line
        ref={lineRef}
        points={points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        lineCap={shape.lineCap || 'round'}
        dash={shape.dashArray}
        // Selection styling
        shadowColor={isSelected ? shape.stroke : 'transparent'}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Endpoint handles when selected */}
      {isSelected && !shape.locked && (
        <>
          {/* Start point handle */}
          <Circle
            ref={startPointRef}
            x={0}
            y={0}
            radius={6}
            fill="white"
            stroke={shape.stroke}
            strokeWidth={2}
            draggable
            onDragEnd={handleEndpointDrag(true)}
          />
          
          {/* End point handle */}
          <Circle
            ref={endPointRef}
            x={shape.x2 - shape.x}
            y={shape.y2 - shape.y}
            radius={6}
            fill="white"
            stroke={shape.stroke}
            strokeWidth={2}
            draggable
            onDragEnd={handleEndpointDrag(false)}
          />
        </>
      )}
      
      {/* Transformer for overall line manipulation */}
      {isSelected && !shape.locked && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent line from becoming too small
            if (newBox.width < 20 && newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
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
          // Enable corner anchors for scaling
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-right',
            'bottom-left'
          ]}
        />
      )}
    </Group>
  );
};

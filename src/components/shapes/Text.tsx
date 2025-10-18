import React, { useState, useRef, useEffect } from 'react';
import { Text, Transformer } from 'react-konva';
import Konva from 'konva';
import type { TextShape } from '../../types/shapes';
import { realtimeObjectService } from '../../services/realtimeObjectService';

interface TextComponentProps {
  shape: TextShape;
  isSelected: boolean;
  onSelect: (event?: { shiftKey?: boolean }) => void;
  onDragStart: () => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd?: (id: string, x: number, y: number, width?: number, height?: number) => void;
  onTextChange?: (id: string, newText: string) => void;
  currentUserId?: string;
  onCursorUpdate?: (x: number, y: number) => void;
  stageRef?: React.RefObject<Konva.Stage | null>; // Needed for positioning the text input
}

export const TextComponent: React.FC<TextComponentProps> = ({
  shape,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  onTextChange,
  currentUserId,
  onCursorUpdate,
  stageRef,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Calculate text dimensions
  const getTextWidth = () => {
    if (shape.width) return shape.width;
    
    // Approximate text width if not specified
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = `${shape.fontWeight || 'normal'} ${shape.fontStyle || 'normal'} ${shape.fontSize}px ${shape.fontFamily}`;
      return context.measureText(shape.text).width;
    }
    return shape.text.length * shape.fontSize * 0.6; // Fallback approximation
  };

  const getTextHeight = () => {
    if (shape.height) return shape.height;
    return shape.fontSize * 1.2; // Line height approximation
  };

  const handleDragStart = async (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    
    if (currentUserId) {
      try {
        await realtimeObjectService.updateObjectPosition(shape.id, {
          x: shape.x,
          y: shape.y,
          width: getTextWidth(),
          height: getTextHeight(),
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB text dragging:', error);
      }
    }
    
    onDragStart();
  };

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation?.();
    }
    const node = e.target;
    
    onDragEnd(shape.id, node.x(), node.y());
    
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(shape.id);
        }, 1000);
      } catch (error) {
        console.error('Failed to stop RTDB text dragging:', error);
      }
    }
  };

  const handleDragMove = async (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!currentUserId) return;
    
    const node = e.target;
    const stage = node.getStage();
    
    try {
      await realtimeObjectService.updateObjectPosition(shape.id, {
        x: node.x(),
        y: node.y(),
        width: getTextWidth(),
        height: getTextHeight(),
        isDragging: true,
        draggedBy: currentUserId,
      });

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
      console.error('Failed to update RTDB text position during drag:', error);
    }
  };

  const handleDoubleClick = () => {
    if (shape.locked) return;
    setIsEditing(true);
  };

  const handleTextEdit = () => {
    if (!stageRef?.current || !textRef.current) return;

    const textNode = textRef.current;
    const stage = stageRef.current;
    
    // Get text position on the screen
    const textPosition = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    
    // Create textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    
    // Position textarea over the text
    textarea.value = shape.text;
    textarea.style.position = 'absolute';
    textarea.style.top = (stageBox.top + textPosition.y) + 'px';
    textarea.style.left = (stageBox.left + textPosition.x) + 'px';
    textarea.style.width = Math.max(getTextWidth(), 100) + 'px';
    textarea.style.height = Math.max(getTextHeight(), 30) + 'px';
    textarea.style.fontSize = shape.fontSize + 'px';
    textarea.style.fontFamily = shape.fontFamily;
    textarea.style.fontWeight = shape.fontWeight || 'normal';
    textarea.style.fontStyle = shape.fontStyle || 'normal';
    textarea.style.color = shape.fill;
    textarea.style.background = 'rgba(255, 255, 255, 0.9)';
    textarea.style.border = '2px solid #007acc';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '4px';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.zIndex = '1000';
    
    // Focus and select all text
    textarea.focus();
    textarea.select();
    
    // Handle textarea events
    const finishEditing = () => {
      if (onTextChange && textarea.value !== shape.text) {
        onTextChange(shape.id, textarea.value);
      }
      document.body.removeChild(textarea);
      setIsEditing(false);
    };
    
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        document.body.removeChild(textarea);
        setIsEditing(false);
      }
    });
    
    textarea.addEventListener('blur', finishEditing);
  };

  const handleTransformStart = async () => {
    if (currentUserId) {
      try {
        await realtimeObjectService.updateObjectPosition(shape.id, {
          x: shape.x,
          y: shape.y,
          width: getTextWidth(),
          height: getTextHeight(),
          isDragging: true,
          draggedBy: currentUserId,
        });
      } catch (error) {
        console.error('Failed to start RTDB text transform:', error);
      }
    }
  };

  const handleTransform = async () => {
    if (!currentUserId) return;
    
    const node = textRef.current;
    if (!node) return;

    const stage = node.getStage();
    
    try {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      await realtimeObjectService.updateObjectPosition(shape.id, {
        x: node.x(),
        y: node.y(),
        width: getTextWidth() * scaleX,
        height: getTextHeight() * scaleY,
        isDragging: true,
        draggedBy: currentUserId,
      });

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
      console.error('Failed to update RTDB text during transform:', error);
    }
  };

  const handleTransformEnd = async () => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and update dimensions
    node.scaleX(1);
    node.scaleY(1);
    
    const newWidth = getTextWidth() * scaleX;
    const newHeight = getTextHeight() * scaleY;
    
    if (onTransformEnd) {
      onTransformEnd(shape.id, node.x(), node.y(), newWidth, newHeight);
    } else {
      onDragEnd(shape.id, node.x(), node.y());
    }
    
    if (currentUserId) {
      try {
        setTimeout(async () => {
          await realtimeObjectService.stopObjectDragging(shape.id);
        }, 1000);
      } catch (error) {
        console.error('Failed to stop RTDB text transform:', error);
      }
    }
  };

  // Start editing when component becomes selected and double-clicked
  useEffect(() => {
    if (isEditing) {
      handleTextEdit();
    }
  }, [isEditing]);

  return (
    <>
      <Text
        ref={textRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily}
        fontStyle={shape.fontStyle || 'normal'}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth || 0}
        align={shape.align || 'left'}
        verticalAlign={shape.verticalAlign || 'top'}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation || 0}
        opacity={shape.opacity || 1}
        visible={shape.visible !== false && !isEditing}
        draggable={!shape.locked && !isEditing}
        onClick={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
        onTap={(e) => onSelect({ shiftKey: (e.evt as MouseEvent)?.shiftKey })}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        // Visual feedback
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage && !shape.locked) {
            stage.container().style.cursor = 'text';
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
        // Selection styling
        shadowColor={isSelected ? shape.fill : 'transparent'}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Transformer for text resizing */}
      {isSelected && !shape.locked && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum text size
            if (newBox.width < 20 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
          // Transformer styling
          borderStroke={shape.fill}
          borderStrokeWidth={1}
          anchorStroke={shape.fill}
          anchorStrokeWidth={1}
          anchorFill='white'
          anchorSize={6}
          // Text-specific transform options
          enabledAnchors={[
            'middle-left',
            'middle-right',
            'bottom-center',
          ]}
        />
      )}
    </>
  );
};

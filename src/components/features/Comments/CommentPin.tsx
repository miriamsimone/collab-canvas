import React from 'react';
import { Circle, Group, Text } from 'react-konva';
import type { Comment } from '../../../types/comments';

interface CommentPinProps {
  comment: Comment;
  isActive: boolean;
  onClick: () => void;
  scale: number;
}

export const CommentPin: React.FC<CommentPinProps> = ({
  comment,
  isActive,
  onClick,
  scale,
}) => {
  const pinSize = 24 / scale; // Adjust size based on zoom
  const fontSize = 14 / scale;
  
  // Use author color or default
  const pinColor = comment.resolved ? '#9CA3AF' : (comment.authorColor || '#3B82F6');
  const fillColor = isActive ? pinColor : '#FFFFFF';
  const strokeColor = pinColor;

  return (
    <Group
      x={comment.x}
      y={comment.y}
      onClick={onClick}
      onTap={onClick}
    >
      {/* Pin circle background */}
      <Circle
        radius={pinSize / 2}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2 / scale}
        shadowColor="black"
        shadowBlur={4 / scale}
        shadowOpacity={0.3}
        shadowOffsetX={1 / scale}
        shadowOffsetY={1 / scale}
      />
      
      {/* Comment icon (💬) or number */}
      <Text
        text={comment.replies.length > 0 ? `${comment.replies.length + 1}` : '💬'}
        fontSize={fontSize}
        fill={isActive ? '#FFFFFF' : strokeColor}
        align="center"
        verticalAlign="middle"
        offsetX={pinSize / 4}
        offsetY={pinSize / 4}
        width={pinSize / 2}
        height={pinSize / 2}
      />
      
      {/* Resolved indicator */}
      {comment.resolved && (
        <Text
          text="✓"
          fontSize={fontSize * 0.8}
          fill="#10B981"
          fontStyle="bold"
          x={pinSize / 3}
          y={-pinSize / 3}
        />
      )}
    </Group>
  );
};


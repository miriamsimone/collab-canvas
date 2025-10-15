import React from 'react';
import { type PresenceData } from '../services/presenceService';

interface MultiplayerCursorProps {
  presence: PresenceData;
  canvasScale?: number;
  canvasOffset?: { x: number; y: number };
}

export const MultiplayerCursor: React.FC<MultiplayerCursorProps> = ({
  presence,
  canvasScale = 1,
  canvasOffset = { x: 0, y: 0 }
}) => {
  // Calculate final position accounting for canvas transform
  const finalX = (presence.cursorX * canvasScale) + canvasOffset.x;
  const finalY = (presence.cursorY * canvasScale) + canvasOffset.y;

  return (
    <div
      className="multiplayer-cursor"
      style={{
        position: 'absolute',
        left: finalX,
        top: finalY,
        pointerEvents: 'none',
        zIndex: 1000,
        transform: 'translate(-2px, -2px)', // Offset to position cursor tip correctly
        transition: 'all 0.1s ease-out', // Smooth movement
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        {/* Cursor arrow shape */}
        <path
          d="M5.65 2.1L22.15 18.6L16.5 20L11.7 15.2L8.9 22L5.65 2.1Z"
          fill={presence.cursorColor}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M5.65 2.1L22.15 18.6L16.5 20L11.7 15.2L8.9 22L5.65 2.1Z"
          fill={presence.cursorColor}
          opacity="0.9"
        />
      </svg>

      {/* User name label */}
      <div
        className="cursor-label"
        style={{
          backgroundColor: presence.cursorColor,
        }}
      >
        {presence.displayName}
      </div>
    </div>
  );
};

// Container component for rendering all multiplayer cursors
interface MultiplayerCursorsProps {
  cursors: Record<string, PresenceData>;
  canvasScale?: number;
  canvasOffset?: { x: number; y: number };
}

export const MultiplayerCursors: React.FC<MultiplayerCursorsProps> = ({
  cursors,
  canvasScale = 1,
  canvasOffset = { x: 0, y: 0 }
}) => {
  return (
    <div
      className="multiplayer-cursors-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {Object.values(cursors).map((presence) => (
        <MultiplayerCursor
          key={presence.userId}
          presence={presence}
          canvasScale={canvasScale}
          canvasOffset={canvasOffset}
        />
      ))}
    </div>
  );
};

import React from 'react';
import { Group, Circle, Line, Rect, Text as KonvaText, Path } from 'react-konva';
import { useAudioRecording } from '../../../hooks/useAudioRecording';

interface AudioControlsProps {
  shapeId: string;
  canvasId: string;
  x: number;
  y: number;
  hasAudio: boolean;
  audioUrl?: string;
  isRambleStart?: boolean;
  onRecordingComplete: (audioUrl: string, duration: number) => Promise<void>;
  onDeleteOldAudio?: () => Promise<void>;
  onToggleRambleStart?: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  shapeId,
  canvasId,
  x,
  y,
  hasAudio,
  audioUrl,
  isRambleStart = false,
  onRecordingComplete,
  onDeleteOldAudio,
  onToggleRambleStart,
}) => {
  const {
    isRecording,
    isPlaying,
    recordingTime,
    error,
    isUploading,
    startRecording,
    stopRecording,
    playAudio,
    stopPlayback,
    clearError,
  } = useAudioRecording({
    shapeId,
    canvasId,
    onRecordingComplete: async (url, duration) => {
      // Delete old audio if re-recording
      if (hasAudio && onDeleteOldAudio) {
        await onDeleteOldAudio();
      }
      await onRecordingComplete(url, duration);
    },
    onRecordingError: (err) => {
      console.error('Audio error:', err);
      // Error will be shown via the error state
    },
  });

  const handleStopClick = async (e: any) => {
    e.cancelBubble = true;
    await stopRecording();
  };

  const handleRecordClick = async (e: any) => {
    e.cancelBubble = true;
    await startRecording();
  };

  const handlePlayClick = (e: any) => {
    e.cancelBubble = true;
    
    if (isPlaying) {
      stopPlayback();
    } else if (audioUrl) {
      playAudio(audioUrl);
    }
  };

  const handleRamToggleClick = (e: any) => {
    e.cancelBubble = true;
    if (onToggleRambleStart) {
      onToggleRambleStart();
    }
  };

  const buttonSize = 24;
  const buttonSpacing = 30;
  const offsetY = -40; // Position above the shape


  return (
    <Group x={x} y={y + offsetY}>
      {/* Stop Button - Show when recording */}
      {isRecording && (
        <Group x={0} y={0}>
          {/* Button Background */}
          <Circle
            radius={buttonSize / 2}
            fill="#dc2626"
            stroke="#fff"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={handleStopClick}
            onTap={handleStopClick}
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
          
          {/* Stop Icon (square inside) */}
          <Rect
            x={-5}
            y={-5}
            width={10}
            height={10}
            fill="#fff"
            listening={false}
          />
          
          {/* Recording Timer */}
          <KonvaText
            text={`${recordingTime}s`}
            fontSize={12}
            fontStyle="bold"
            fill="#fff"
            x={-20}
            y={buttonSize / 2 + 8}
            width={40}
            align="center"
            listening={false}
            shadowColor="#000"
            shadowBlur={3}
            shadowOpacity={0.8}
          />
        </Group>
      )}

      {/* Uploading indicator - Show when uploading */}
      {isUploading && (
        <Group x={0} y={0}>
          <Circle
            radius={buttonSize / 2}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
          />
          <KonvaText
            text="↑"
            fontSize={16}
            fontStyle="bold"
            fill="#fff"
            x={-5}
            y={-8}
            listening={false}
          />
          <KonvaText
            text="Uploading..."
            fontSize={10}
            fill="#fff"
            x={-25}
            y={buttonSize / 2 + 8}
            width={50}
            align="center"
            listening={false}
          />
        </Group>
      )}

      {/* Play Button - Show when audio exists and not recording and not uploading */}
      {hasAudio && !isRecording && !isUploading && (
        <Group x={0} y={0}>
          {/* Button Background */}
          <Circle
            radius={buttonSize / 2}
            fill={isPlaying ? '#2563eb' : '#3b82f6'}
            stroke="#fff"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={handlePlayClick}
            onTap={handlePlayClick}
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
          
          {/* Play Icon (triangle) or Pause Icon (two bars) */}
          {isPlaying ? (
            // Pause icon (two vertical bars)
            <>
              <Line
                points={[-3, -5, -3, 5]}
                stroke="#fff"
                strokeWidth={2}
                lineCap="round"
                listening={false}
              />
              <Line
                points={[3, -5, 3, 5]}
                stroke="#fff"
                strokeWidth={2}
                lineCap="round"
                listening={false}
              />
            </>
          ) : (
            // Play icon (triangle)
            <Line
              points={[-3, -5, -3, 5, 5, 0, -3, -5]}
              fill="#fff"
              closed
              listening={false}
            />
          )}
        </Group>
      )}

      {/* Ram Toggle Button - Show when audio exists (marks ramble start) */}
      {hasAudio && !isRecording && !isUploading && onToggleRambleStart && (
        <Group x={-buttonSpacing} y={0}>
          {/* Button Background */}
          <Circle
            radius={buttonSize / 2}
            fill={isRambleStart ? '#8b5cf6' : '#6b7280'}
            stroke="#fff"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={handleRamToggleClick}
            onTap={handleRamToggleClick}
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
          
          {/* Ram Icon - Stylized ram head with horns */}
          <Group listening={false}>
            {/* Head circle */}
            <Circle
              x={0}
              y={1}
              radius={4}
              fill="#fff"
            />
            
            {/* Left horn (curved) */}
            <Path
              data="M -3 -2 Q -6 -4 -7 -1"
              stroke="#fff"
              strokeWidth={1.5}
              lineCap="round"
              fill="none"
            />
            
            {/* Right horn (curved) */}
            <Path
              data="M 3 -2 Q 6 -4 7 -1"
              stroke="#fff"
              strokeWidth={1.5}
              lineCap="round"
              fill="none"
            />
            
            {/* Ears */}
            <Circle x={-2.5} y={0} radius={1.5} fill="#fff" />
            <Circle x={2.5} y={0} radius={1.5} fill="#fff" />
            
            {/* Eyes */}
            <Circle x={-1.5} y={1} radius={0.5} fill={isRambleStart ? '#8b5cf6' : '#6b7280'} />
            <Circle x={1.5} y={1} radius={0.5} fill={isRambleStart ? '#8b5cf6' : '#6b7280'} />
          </Group>
          
          {/* Start indicator dot when active */}
          {isRambleStart && (
            <Circle
              x={buttonSize / 2 - 2}
              y={-buttonSize / 2 + 2}
              radius={3}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={1}
              listening={false}
            />
          )}
        </Group>
      )}

      {/* Record Button - Show when not recording and not uploading */}
      {!isRecording && !isUploading && (
        <Group x={hasAudio ? buttonSpacing : 0} y={0}>
          {/* Button Background */}
          <Circle
            radius={buttonSize / 2}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={2}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            onClick={handleRecordClick}
            onTap={handleRecordClick}
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
          
          {/* Record Icon (smaller circle inside) */}
          <Circle
            radius={6}
            fill="#fff"
            listening={false}
          />
        </Group>
      )}

      {/* Error indicator (small red dot if error exists) */}
      {error && (
        <Circle
          x={hasAudio && !isRecording ? buttonSpacing * 2 : buttonSize}
          y={-buttonSize / 2}
          radius={4}
          fill="#ef4444"
          onClick={(e) => {
            e.cancelBubble = true;
            clearError();
          }}
        />
      )}
    </Group>
  );
};


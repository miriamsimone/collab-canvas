import React, { useState, useCallback } from 'react';
import type { Shape } from '../../../types/shapes';
import type { AudioConnection } from '../../../types/connections';
import { audioService } from '../../../services/audioService';

// Updated to support multiple concurrent ramble chains
interface RamblePlayerProps {
  shapes: Shape[];
  connections: AudioConnection[];
  onPlayingShapesChange?: (shapeIds: string[]) => void;
}

export const RamblePlayer: React.FC<RamblePlayerProps> = ({ 
  shapes, 
  connections,
  onPlayingShapesChange 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingShapeIds, setPlayingShapeIds] = useState<string[]>([]);

  // Only show button if at least one shape is marked as ramble start
  const hasRambleStarts = shapes.some(shape => shape.isRambleStart);

  const playRambleChain = useCallback(async () => {
    // Find ALL ramble start shapes with audio
    const startShapes = shapes.filter(shape => shape.isRambleStart && shape.audioUrl);
    
    if (startShapes.length === 0) {
      console.log('❌ No ramble start shapes found with audio');
      alert('Please mark at least one shape with audio as a ramble start (click the ram icon)');
      return;
    }

    console.log(`🐏 Starting ${startShapes.length} ramble chain(s)...`);
    setIsPlaying(true);

    // Helper to add a shape to the playing list
    const addPlayingShape = (shapeId: string) => {
      setPlayingShapeIds(prev => {
        const updated = [...prev, shapeId];
        if (onPlayingShapesChange) {
          onPlayingShapesChange(updated);
        }
        return updated;
      });
    };

    // Helper to remove a shape from the playing list
    const removePlayingShape = (shapeId: string) => {
      setPlayingShapeIds(prev => {
        const updated = prev.filter(id => id !== shapeId);
        if (onPlayingShapesChange) {
          onPlayingShapesChange(updated);
        }
        return updated;
      });
    };

    // Play a single chain starting from a specific shape
    const playChain = async (startShape: Shape, chainIndex: number) => {
      console.log(`🎵 Chain ${chainIndex + 1}: Starting from shape ${startShape.id}`);
      let currentShape = startShape;
      
      while (currentShape && currentShape.audioUrl) {
        console.log(`🎵 Chain ${chainIndex + 1}: Playing ${currentShape.id}`);
        addPlayingShape(currentShape.id);
        
        try {
          // Play the audio and wait for it to finish
          await audioService.playAudio(currentShape.audioUrl);
          removePlayingShape(currentShape.id);
          
          // Find the next shape in the chain (follow outgoing connection)
          const nextConnection = connections.find(
            conn => conn.sourceShapeId === currentShape.id
          );
          
          if (nextConnection) {
            const nextShape = shapes.find(s => s.id === nextConnection.targetShapeId);
            
            if (nextShape && nextShape.audioUrl) {
              console.log(`➡️ Chain ${chainIndex + 1}: Following to ${nextShape.id}`);
              currentShape = nextShape;
            } else {
              console.log(`✅ Chain ${chainIndex + 1}: Next shape has no audio, ending`);
              break;
            }
          } else {
            console.log(`✅ Chain ${chainIndex + 1}: No more connections, ending`);
            break;
          }
        } catch (error) {
          console.error(`❌ Chain ${chainIndex + 1}: Error playing audio:`, error);
          removePlayingShape(currentShape.id);
          break;
        }
      }
      
      console.log(`🎉 Chain ${chainIndex + 1}: Complete!`);
    };

    // Start all chains in parallel
    await Promise.all(
      startShapes.map((shape, index) => playChain(shape, index))
    );
    
    console.log('🎉 All ramble chains complete!');
    setIsPlaying(false);
    setPlayingShapeIds([]);
    if (onPlayingShapesChange) {
      onPlayingShapesChange([]);
    }
  }, [shapes, connections, onPlayingShapesChange]);

  const stopRamble = useCallback(() => {
    audioService.stopPlayback();
    setIsPlaying(false);
    setPlayingShapeIds([]);
    if (onPlayingShapesChange) {
      onPlayingShapesChange([]);
    }
    console.log('⏹️ All rambles stopped');
  }, [onPlayingShapesChange]);

  // Only show button if at least one shape is marked as ramble start
  if (!hasRambleStarts) {
    return null;
  }

  return (
    <div className="ramble-player">
      <button
        onClick={isPlaying ? stopRamble : playRambleChain}
        className={`ramble-button ${isPlaying ? 'playing' : ''}`}
        title={isPlaying ? 'Stop Ramble' : 'Start Ramble'}
      >
        {/* Ram Icon - Stylized ram head with horns */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head circle */}
          <circle cx="12" cy="13" r="5" fill="currentColor" />
          
          {/* Left horn (curved) */}
          <path
            d="M 8 10 Q 4 7 3 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Right horn (curved) */}
          <path
            d="M 16 10 Q 20 7 21 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Ears */}
          <circle cx="9" cy="12" r="2" fill="currentColor" />
          <circle cx="15" cy="12" r="2" fill="currentColor" />
          
          {/* Eyes */}
          <circle cx="10" cy="13" r="0.8" fill={isPlaying ? '#10b981' : '#fff'} />
          <circle cx="14" cy="13" r="0.8" fill={isPlaying ? '#10b981' : '#fff'} />
        </svg>
        
        <span>{isPlaying ? 'Stop Ramble' : 'Start Ramble'}</span>
        
        {playingShapeIds.length > 0 && (
          <span className="ramble-playing-indicator">▶ {playingShapeIds.length}</span>
        )}
      </button>
    </div>
  );
};


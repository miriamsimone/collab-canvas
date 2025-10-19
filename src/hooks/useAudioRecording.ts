import { useState, useCallback, useRef } from 'react';
import { audioService, AudioRecordingService } from '../services/audioService';

interface UseAudioRecordingProps {
  shapeId: string;
  canvasId: string;
  onRecordingComplete?: (audioUrl: string, duration: number) => Promise<void>;
  onRecordingError?: (error: string) => void;
}

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isPlaying: boolean;
  recordingTime: number;
  error: string | null;
  isUploading: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playAudio: (url: string) => void;
  stopPlayback: () => void;
  clearError: () => void;
}

export const useAudioRecording = ({
  shapeId,
  canvasId,
  onRecordingComplete,
  onRecordingError,
}: UseAudioRecordingProps): UseAudioRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Check if browser supports recording
      if (!AudioRecordingService.isSupported()) {
        throw new Error('Audio recording is not supported in this browser');
      }

      // Request permission
      const hasPermission = await audioService.requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      setIsRecording(true);
      setRecordingTime(0);

      // Start recording with time updates
      await audioService.startRecording(
        (seconds) => setRecordingTime(seconds),
        () => {
          // Auto-stop when max time reached
          stopRecording();
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setIsRecording(false);
      if (onRecordingError) {
        onRecordingError(errorMessage);
      }
    }
  }, [shapeId, canvasId, onRecordingError]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      setError(null);
      
      // Stop recording and get blob
      const audioBlob = await audioService.stopRecording();
      const duration = audioService.getRecordingDuration();
      
      setIsRecording(false);
      setRecordingTime(0);
      setIsUploading(true);

      // Upload to Firebase Storage
      const audioUrl = await audioService.uploadToStorage(audioBlob, shapeId, canvasId);

      // Notify parent component
      if (onRecordingComplete) {
        await onRecordingComplete(audioUrl, duration);
      }

      setIsUploading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save recording';
      setError(errorMessage);
      setIsRecording(false);
      setIsUploading(false);
      if (onRecordingError) {
        onRecordingError(errorMessage);
      }
    }
  }, [isRecording, shapeId, canvasId, onRecordingComplete, onRecordingError]);

  const playAudio = useCallback(async (url: string) => {
    try {
      // Stop any existing playback
      audioService.stopPlayback();

      setIsPlaying(true);
      setError(null);

      // Play audio (now returns a promise)
      await audioService.playAudio(url, () => {
        setIsPlaying(false);
      });
      setIsPlaying(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMessage);
      setIsPlaying(false);
      if (onRecordingError) {
        onRecordingError(errorMessage);
      }
    }
  }, [onRecordingError]);

  const stopPlayback = useCallback(() => {
    audioService.stopPlayback();
    setIsPlaying(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
  };
};


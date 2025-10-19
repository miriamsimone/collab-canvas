import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
const MAX_RECORDING_TIME = 30000; // 30 seconds in milliseconds

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingTimer: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private activeAudioElements: HTMLAudioElement[] = []; // Track multiple playing audios

  /**
   * Request microphone permission from the user
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Start recording audio from the microphone
   * @param onTimeUpdate Callback for recording time updates
   * @param onMaxTimeReached Callback when 30s limit is reached
   */
  async startRecording(
    onTimeUpdate?: (seconds: number) => void,
    onMaxTimeReached?: () => void
  ): Promise<void> {
    try {
      // Get microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Set up timer to track recording time
      if (onTimeUpdate) {
        this.recordingTimer = setInterval(() => {
          const elapsed = Date.now() - this.startTime;
          onTimeUpdate(Math.floor(elapsed / 1000));
        }, 100);
      }

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopRecording();
          if (onMaxTimeReached) {
            onMaxTimeReached();
          }
        }
      }, MAX_RECORDING_TIME);

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone. Please grant permission.');
    }
  }

  /**
   * Stop recording and return the audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.getSupportedMimeType();
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        if (this.recordingTimer) {
          clearInterval(this.recordingTimer);
          this.recordingTimer = null;
        }

        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Upload audio blob to Firebase Storage
   * @param audioBlob The recorded audio blob
   * @param shapeId The ID of the shape
   * @param canvasId The ID of the canvas
   * @returns Download URL for the uploaded audio
   */
  async uploadToStorage(audioBlob: Blob, shapeId: string, canvasId: string): Promise<string> {
    try {
      const extension = this.getSupportedMimeType().includes('webm') ? 'webm' : 'mp4';
      const path = `audio/${canvasId}/${shapeId}.${extension}`;
      const audioRef = ref(storage, path);
      
      console.log('📤 Uploading audio:', path, `(${(audioBlob.size / 1024).toFixed(1)}KB)`);
      
      // Upload the audio file
      await uploadBytes(audioRef, audioBlob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(audioRef);
      console.log('✅ Upload complete');
      return downloadURL;
    } catch (error: any) {
      console.error('❌ Failed to upload audio:', error.message || error);
      throw new Error(`Failed to upload recording: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete audio file from Firebase Storage
   * @param audioUrl The download URL of the audio to delete
   */
  async deleteAudio(audioUrl: string): Promise<void> {
    try {
      // Extract the path from the URL
      const url = new URL(audioUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid audio URL');
      }
      
      const path = decodeURIComponent(pathMatch[1]);
      const audioRef = ref(storage, path);
      
      await deleteObject(audioRef);
    } catch (error) {
      console.error('Failed to delete audio:', error);
      // Don't throw - deletion failure shouldn't block other operations
    }
  }

  /**
   * Play audio from a URL
   * @param url The audio URL to play
   * @param onEnded Callback when playback finishes
   * @returns Promise that resolves when audio finishes playing
   */
  playAudio(url: string, onEnded?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      
      audio.onended = () => {
        if (onEnded) {
          onEnded();
        }
        // Remove from active list
        this.activeAudioElements = this.activeAudioElements.filter(a => a !== audio);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('Failed to play audio:', error);
        // Remove from active list
        this.activeAudioElements = this.activeAudioElements.filter(a => a !== audio);
        reject(error);
      };
      
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        // Remove from active list
        this.activeAudioElements = this.activeAudioElements.filter(a => a !== audio);
        reject(error);
      });
      
      // Add to active list for stopPlayback
      this.activeAudioElements.push(audio);
    });
  }
  
  /**
   * Stop all active playback
   */
  stopPlayback(): void {
    this.activeAudioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeAudioElements = [];
  }

  /**
   * Get supported MIME type for this browser
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback
    return 'audio/webm';
  }

  /**
   * Check if browser supports audio recording
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia !== 'undefined' && 
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  /**
   * Get recording duration from blob
   */
  getRecordingDuration(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// Export singleton instance
export const audioService = new AudioRecordingService();


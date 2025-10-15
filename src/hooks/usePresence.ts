import { useState, useEffect, useCallback, useRef } from 'react';
import { presenceService, generateUserColor, type PresenceData, type CursorUpdate } from '../services/presenceService';
import { useAuth } from './useAuth';

interface UsePresenceState {
  cursors: Record<string, PresenceData>;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}

interface UsePresenceActions {
  updateCursorPosition: (x: number, y: number) => void;
  clearError: () => void;
}

export const usePresence = (): UsePresenceState & UsePresenceActions => {
  const { user, userProfile } = useAuth();
  const [cursors, setCursors] = useState<Record<string, PresenceData>>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for throttling and optimization
  const lastUpdateTime = useRef<number>(0);
  const lastPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userColorRef = useRef<string | null>(null);
  
  // Throttling configuration
  const THROTTLE_INTERVAL = 50; // 20 FPS (50ms between updates)
  const MIN_POSITION_CHANGE = 2; // Minimum pixel change to trigger update

  // Get or generate user color
  const getUserColor = useCallback(() => {
    if (!user) return '#999999';
    if (!userColorRef.current) {
      userColorRef.current = generateUserColor(user.uid);
    }
    return userColorRef.current;
  }, [user]);

  /**
   * Throttled cursor position update
   */
  const updateCursorPosition = useCallback((x: number, y: number) => {
    if (!user || !userProfile) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    const distanceFromLastPosition = Math.sqrt(
      Math.pow(x - lastPosition.current.x, 2) + 
      Math.pow(y - lastPosition.current.y, 2)
    );

    // Skip update if too soon or position hasn't changed significantly
    if (timeSinceLastUpdate < THROTTLE_INTERVAL && 
        distanceFromLastPosition < MIN_POSITION_CHANGE) {
      return;
    }

    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Schedule the update
    const updateFn = async () => {
      try {
        const cursorUpdate: CursorUpdate = {
          x,
          y,
          displayName: userProfile.displayName,
          color: getUserColor(),
        };

        await presenceService.updateCursorPosition(user.uid, cursorUpdate);
        
        lastUpdateTime.current = now;
        lastPosition.current = { x, y };
      } catch (err: any) {
        console.error('Failed to update cursor position:', err);
        setError(`Failed to update cursor: ${err.message}`);
      }
    };

    // Execute immediately if enough time has passed, otherwise throttle
    if (timeSinceLastUpdate >= THROTTLE_INTERVAL) {
      updateFn();
    } else {
      updateTimeoutRef.current = setTimeout(updateFn, THROTTLE_INTERVAL - timeSinceLastUpdate);
    }
  }, [user, userProfile, getUserColor]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set up presence subscription and heartbeat when user is authenticated
  useEffect(() => {
    if (!user || !userProfile) {
      setCursors({});
      setLoading(false);
      setIsConnected(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Start heartbeat to maintain presence
    const userColor = getUserColor();
    presenceService.startHeartbeat(user.uid, userProfile.displayName, userColor);

    // Subscribe to presence updates
    const unsubscribe = presenceService.subscribeToPresence(
      (presenceList) => {
        // Convert array to object keyed by userId, excluding current user
        const cursorsObject: Record<string, PresenceData> = {};
        presenceList.forEach((presence) => {
          if (presence.userId !== user.uid) { // Exclude current user's cursor
            cursorsObject[presence.userId] = presence;
          }
        });

        setCursors(cursorsObject);
        setLoading(false);
        setIsConnected(true);
      },
      (error) => {
        console.error('Presence subscription error:', error);
        setError(`Connection error: ${error.message}`);
        setLoading(false);
        setIsConnected(false);
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
      presenceService.stopHeartbeat();
      
      // Mark user as inactive and clean up
      if (user) {
        presenceService.markInactive(user.uid).catch(console.error);
      }
      
      setIsConnected(false);
    };
  }, [user, userProfile, getUserColor]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      presenceService.stopHeartbeat();
      
      if (user) {
        presenceService.removePresence(user.uid).catch(console.error);
      }
    };
  }, [user]);

  // Handle page visibility change to pause/resume heartbeat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!user || !userProfile) return;

      if (document.hidden) {
        presenceService.stopHeartbeat();
        presenceService.markInactive(user.uid).catch(console.error);
      } else {
        const userColor = getUserColor();
        presenceService.startHeartbeat(user.uid, userProfile.displayName, userColor);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, userProfile, getUserColor]);

  return {
    // State
    cursors,
    isConnected,
    loading,
    error,
    
    // Actions
    updateCursorPosition,
    clearError,
  };
};
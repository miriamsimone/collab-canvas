import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeCursorService, type RealtimePresenceData, type RealtimeCursorUpdate } from '../services/realtimeCursorService';
import { generateUserColor } from '../services/presenceService'; // Keep the color generation utility
import { useAuth } from './useAuth';

interface UsePresenceState {
  cursors: Record<string, RealtimePresenceData>;
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
  const [cursors, setCursors] = useState<Record<string, RealtimePresenceData>>({});
  const [isConnected, setIsConnected] = useState<boolean>(true); // Start as true to avoid flash, will update after subscription
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for optimization (no more throttling!)
  const userColorRef = useRef<string | null>(null);
  const isOnlineRef = useRef<boolean>(navigator.onLine); // Track online status in ref
  const userRef = useRef(user);
  const userProfileRef = useRef(userProfile);

  // Keep refs in sync
  useEffect(() => {
    userRef.current = user;
    userProfileRef.current = userProfile;
  }, [user, userProfile]);

  // Get or generate user color
  const getUserColor = useCallback(() => {
    if (!user) return '#999999';
    if (!userColorRef.current) {
      userColorRef.current = generateUserColor(user.uid);
    }
    return userColorRef.current;
  }, [user]);

  /**
   * Real-time cursor position update (no throttling!)
   */
  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    if (!user || !userProfile) return;

    try {
      const cursorUpdate: RealtimeCursorUpdate = {
        x,
        y,
        displayName: userProfile.displayName,
        color: getUserColor(),
      };

      await realtimeCursorService.updateCursorPosition(user.uid, cursorUpdate);
    } catch (err: any) {
      console.error('Failed to update cursor position:', err);
      setError(`Failed to update cursor: ${err.message}`);
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

    // Start heartbeat to maintain presence (only if online)
    if (isOnlineRef.current) {
      const userColor = getUserColor();
      realtimeCursorService.startHeartbeat(user.uid, userProfile.displayName, userColor);
    }

    // Subscribe to presence updates
    const unsubscribe = realtimeCursorService.subscribeToPresence(
      (allCursors) => {
        // Exclude current user's cursor from display
        const otherUsersCursors: Record<string, RealtimePresenceData> = {};
        Object.entries(allCursors).forEach(([userId, presenceData]) => {
          if (userId !== user.uid) {
            otherUsersCursors[userId] = presenceData;
          }
        });

        setCursors(otherUsersCursors);
        setLoading(false);
        // Only set connected if browser is actually online (use ref to avoid stale closure)
        if (isOnlineRef.current) {
          setIsConnected(true);
        }
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
      realtimeCursorService.stopHeartbeat();
      
      // Mark user as inactive and clean up
      if (user) {
        realtimeCursorService.markInactive(user.uid).catch((error) => {
          console.error('Failed to mark user inactive:', error);
        });
      }
      
      setIsConnected(false);
    };
  }, [user, userProfile, getUserColor]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      realtimeCursorService.cleanup();
      
      if (user) {
        realtimeCursorService.removePresence(user.uid).catch((error) => {
          console.error('Failed to remove presence:', error);
        });
      }
    };
  }, [user]);

  // Handle page visibility change to pause/resume heartbeat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!user || !userProfile) return;

      if (document.hidden) {
        realtimeCursorService.stopHeartbeat();
        realtimeCursorService.markInactive(user.uid).catch(console.error);
      } else {
        const userColor = getUserColor();
        realtimeCursorService.startHeartbeat(user.uid, userProfile.displayName, userColor);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, userProfile, getUserColor]);

  // Handle browser online/offline status changes (run once on mount, no dependencies)
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Browser is back online');
      isOnlineRef.current = true;
      setIsConnected(true);
      
      // Restart heartbeat when coming back online (use refs to get current values)
      const currentUser = userRef.current;
      const currentUserProfile = userProfileRef.current;
      if (currentUser && currentUserProfile) {
        const userColor = currentUser.uid ? generateUserColor(currentUser.uid) : '#999999';
        realtimeCursorService.startHeartbeat(currentUser.uid, currentUserProfile.displayName, userColor);
      }
    };

    const handleOffline = () => {
      console.log('📡 Browser is offline');
      isOnlineRef.current = false;
      setIsConnected(false);
      
      // Stop heartbeat when going offline
      realtimeCursorService.stopHeartbeat();
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty deps - only set up listeners once

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
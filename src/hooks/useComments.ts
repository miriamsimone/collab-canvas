import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Comment, CommentInput, UseCommentsState, UseCommentsActions } from '../types/comments';
import * as commentsService from '../services/commentsService';

export const useComments = (): UseCommentsState & UseCommentsActions => {
  const { user, userProfile } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  /**
   * Subscribe to real-time comments
   */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('📝 Subscribing to comments...');

    const unsubscribe = commentsService.subscribeToComments(
      (updatedComments) => {
        setComments(updatedComments);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Comments subscription error:', err);
        setError('Failed to load comments');
        setLoading(false);
      }
    );

    return () => {
      console.log('📝 Unsubscribing from comments');
      unsubscribe();
    };
  }, [user]);

  /**
   * Add a new comment
   */
  const addComment = useCallback(async (input: CommentInput): Promise<void> => {
    if (!user || !userProfile) {
      setError('You must be logged in to add comments');
      return;
    }

    try {
      setError(null);
      // Generate a color from user's display name if color not available
      const generateColor = (name: string): string => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
      };
      
      const authorColor = (userProfile as any).color || generateColor(userProfile.displayName || 'User');
      
      await commentsService.addComment(
        input,
        user.uid,
        userProfile.displayName || 'Anonymous',
        authorColor
      );
      setIsAddingComment(false);
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      setError(err.message || 'Failed to add comment');
      throw err;
    }
  }, [user, userProfile]);

  /**
   * Add a reply to a comment
   */
  const addReply = useCallback(async (commentId: string, text: string): Promise<void> => {
    if (!user || !userProfile) {
      setError('You must be logged in to reply');
      return;
    }

    try {
      setError(null);
      await commentsService.addReply(
        commentId,
        text,
        user.uid,
        userProfile.displayName || 'Anonymous'
      );
    } catch (err: any) {
      console.error('Failed to add reply:', err);
      setError(err.message || 'Failed to add reply');
      throw err;
    }
  }, [user, userProfile]);

  /**
   * Toggle resolved status
   */
  const toggleResolved = useCallback(async (commentId: string): Promise<void> => {
    if (!user) {
      setError('You must be logged in');
      return;
    }

    try {
      setError(null);
      await commentsService.toggleCommentResolved(commentId);
    } catch (err: any) {
      console.error('Failed to toggle resolved:', err);
      setError(err.message || 'Failed to toggle resolved');
      throw err;
    }
  }, [user]);

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    if (!user) {
      setError('You must be logged in');
      return;
    }

    try {
      setError(null);
      await commentsService.deleteComment(commentId);
      
      // Clear active comment if it was deleted
      if (activeCommentId === commentId) {
        setActiveCommentId(null);
      }
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      setError(err.message || 'Failed to delete comment');
      throw err;
    }
  }, [user, activeCommentId]);

  /**
   * Set active comment
   */
  const setActiveComment = useCallback((commentId: string | null) => {
    setActiveCommentId(commentId);
  }, []);

  /**
   * Start adding a new comment
   */
  const startAddingComment = useCallback(() => {
    setIsAddingComment(true);
    setActiveCommentId(null);
  }, []);

  /**
   * Cancel adding a new comment
   */
  const cancelAddingComment = useCallback(() => {
    setIsAddingComment(false);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    comments,
    loading,
    error,
    isAddingComment,
    activeCommentId,
    
    // Actions
    addComment,
    addReply,
    toggleResolved,
    deleteComment,
    setActiveComment,
    startAddingComment,
    cancelAddingComment,
    clearError,
  };
};


import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import type { Comment, CommentReply, CommentInput } from '../types/comments';

const COMMENTS_COLLECTION = 'canvasComments';
const CANVAS_ID = 'shared'; // Using same shared canvas as shapes

/**
 * Generate a unique comment ID
 */
export const generateCommentId = (): string => {
  return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a unique reply ID
 */
export const generateReplyId = (): string => {
  return `reply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Convert Firestore timestamp to number
 */
const timestampToNumber = (timestamp: any): number => {
  if (!timestamp) return Date.now();
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  return Date.now();
};

/**
 * Convert Firestore document to Comment object
 */
const firestoreToComment = (docId: string, data: any): Comment => {
  return {
    id: docId,
    canvasId: data.canvasId || CANVAS_ID,
    objectId: data.objectId,
    x: data.x || 0,
    y: data.y || 0,
    text: data.text || '',
    authorId: data.authorId || '',
    authorName: data.authorName || 'Unknown',
    authorColor: data.authorColor,
    timestamp: timestampToNumber(data.timestamp),
    resolved: data.resolved || false,
    replies: data.replies || [],
  };
};

/**
 * Add a new comment to the canvas
 */
export const addComment = async (
  input: CommentInput,
  authorId: string,
  authorName: string,
  authorColor?: string
): Promise<string> => {
  try {
    const commentData = {
      canvasId: CANVAS_ID,
      objectId: input.objectId || null,
      x: input.x,
      y: input.y,
      text: input.text,
      authorId,
      authorName,
      authorColor: authorColor || null,
      timestamp: serverTimestamp(),
      resolved: false,
      replies: [],
    };

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData);
    console.log('✅ Comment added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to add comment:', error);
    throw error;
  }
};

/**
 * Add a reply to an existing comment
 */
export const addReply = async (
  commentId: string,
  text: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    
    const reply: CommentReply = {
      id: generateReplyId(),
      userId,
      userName,
      text,
      timestamp: Date.now(),
    };

    // Get current replies and add new one
    // Note: In production, you'd want to use arrayUnion for atomic operations
    const commentDoc = await import('firebase/firestore').then(m => m.getDoc(commentRef));
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const currentReplies = commentDoc.data().replies || [];
    await updateDoc(commentRef, {
      replies: [...currentReplies, reply],
    });

    console.log('✅ Reply added to comment:', commentId);
  } catch (error) {
    console.error('❌ Failed to add reply:', error);
    throw error;
  }
};

/**
 * Toggle resolved status of a comment
 */
export const toggleCommentResolved = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    
    // Get current resolved status
    const commentDoc = await import('firebase/firestore').then(m => m.getDoc(commentRef));
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const currentResolved = commentDoc.data().resolved || false;
    
    await updateDoc(commentRef, {
      resolved: !currentResolved,
    });

    console.log('✅ Comment resolved status toggled:', commentId);
  } catch (error) {
    console.error('❌ Failed to toggle resolved:', error);
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await deleteDoc(commentRef);
    console.log('✅ Comment deleted:', commentId);
  } catch (error) {
    console.error('❌ Failed to delete comment:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time comments for the canvas
 */
export const subscribeToComments = (
  onUpdate: (comments: Comment[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('canvasId', '==', CANVAS_ID),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs.map((doc) => 
          firestoreToComment(doc.id, doc.data())
        );
        
        console.log(`📝 Comments updated: ${comments.length} total`);
        onUpdate(comments);
      },
      (error) => {
        console.error('❌ Comments subscription error:', error);
        onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Failed to subscribe to comments:', error);
    throw error;
  }
};

/**
 * Get comments for a specific object
 */
export const getCommentsForObject = (
  comments: Comment[],
  objectId: string
): Comment[] => {
  return comments.filter(comment => comment.objectId === objectId);
};

/**
 * Get unresolved comments
 */
export const getUnresolvedComments = (comments: Comment[]): Comment[] => {
  return comments.filter(comment => !comment.resolved);
};

/**
 * Count unresolved comments
 */
export const countUnresolvedComments = (comments: Comment[]): number => {
  return getUnresolvedComments(comments).length;
};


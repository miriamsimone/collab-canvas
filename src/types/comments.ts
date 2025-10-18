// Comment Types for Collaborative Comments Feature

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  canvasId: string;
  objectId?: string; // Optional: attach to specific shape
  x: number; // Canvas position
  y: number;
  text: string;
  authorId: string;
  authorName: string;
  authorColor?: string; // For avatar color
  timestamp: number;
  resolved: boolean;
  replies: CommentReply[];
  // For UI state (not stored in Firestore)
  isEditing?: boolean;
}

export interface CommentInput {
  text: string;
  x: number;
  y: number;
  objectId?: string;
}

export interface UseCommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  isAddingComment: boolean;
  activeCommentId: string | null;
}

export interface UseCommentsActions {
  addComment: (input: CommentInput) => Promise<void>;
  addReply: (commentId: string, text: string) => Promise<void>;
  toggleResolved: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  setActiveComment: (commentId: string | null) => void;
  startAddingComment: () => void;
  cancelAddingComment: () => void;
  clearError: () => void;
}


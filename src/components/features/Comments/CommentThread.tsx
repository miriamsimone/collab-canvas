import React, { useState } from 'react';
import type { Comment } from '../../../types/comments';
import './CommentThread.css';

interface CommentThreadProps {
  comment: Comment;
  currentUserId: string;
  onAddReply: (text: string) => Promise<void>;
  onToggleResolved: () => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  currentUserId,
  onAddReply,
  onToggleResolved,
  onDelete,
  onClose,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddReply(replyText.trim());
      setReplyText('');
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const isAuthor = comment.authorId === currentUserId;

  return (
    <div className="comment-thread">
      {/* Header */}
      <div className="comment-thread-header">
        <h3 className="comment-thread-title">Comment Thread</h3>
        <button
          onClick={onClose}
          className="comment-close-button"
          type="button"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Main comment */}
      <div className="comment-main">
        <div className="comment-author-row">
          <div 
            className="comment-avatar"
            style={{ backgroundColor: comment.authorColor || '#3B82F6' }}
          >
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
          <div className="comment-author-info">
            <div className="comment-author-name">{comment.authorName}</div>
            <div className="comment-timestamp">{formatTimestamp(comment.timestamp)}</div>
          </div>
        </div>
        
        <div className="comment-text">{comment.text}</div>

        {/* Actions */}
        <div className="comment-actions">
          <button
            onClick={onToggleResolved}
            className={`comment-action-button ${comment.resolved ? 'resolved' : ''}`}
            type="button"
          >
            {comment.resolved ? '✓ Resolved' : 'Resolve'}
          </button>
          
          {isAuthor && (
            <button
              onClick={onDelete}
              className="comment-action-button delete"
              type="button"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          <div className="comment-replies-title">
            {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
          </div>
          {comment.replies.map((reply) => (
            <div key={reply.id} className="comment-reply">
              <div className="comment-author-row">
                <div className="comment-avatar comment-avatar-small">
                  {reply.userName.charAt(0).toUpperCase()}
                </div>
                <div className="comment-author-info">
                  <div className="comment-author-name">{reply.userName}</div>
                  <div className="comment-timestamp">{formatTimestamp(reply.timestamp)}</div>
                </div>
              </div>
              <div className="comment-text comment-reply-text">{reply.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {!comment.resolved && (
        <form onSubmit={handleAddReply} className="comment-reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add a reply..."
            className="comment-reply-input"
            rows={2}
            disabled={isSubmitting}
          />
          <div className="comment-reply-actions">
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmitting}
              className="comment-reply-submit"
            >
              {isSubmitting ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};


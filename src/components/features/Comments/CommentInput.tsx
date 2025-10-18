import React, { useState } from 'react';
import './CommentInput.css';

interface CommentInputProps {
  x: number;
  y: number;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  x,
  y,
  onSubmit,
  onCancel,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Visual indicator circle at exact comment position */}
      <div 
        className="comment-pin-indicator"
        style={{ left: x, top: y }}
      >
        💬
      </div>
      
      {/* Input box offset from the indicator */}
      <div 
        className="comment-input-overlay"
        style={{ left: x + 40, top: y }}
      >
        <div className="comment-input-container">
          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input-textarea"
              rows={3}
              autoFocus
              disabled={isSubmitting}
            />
            <div className="comment-input-actions">
              <button
                type="button"
                onClick={onCancel}
                className="comment-input-button cancel"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className="comment-input-button submit"
              >
                {isSubmitting ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};


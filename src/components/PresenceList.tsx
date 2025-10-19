import React, { useState } from 'react';
import { type PresenceData, generateUserColor } from '../services/presenceService';

interface PresenceListProps {
  presenceData: Record<string, PresenceData>;
  currentUserId?: string;
  currentUserDisplayName?: string;
  isConnected: boolean;
  loading: boolean;
  onSignOut?: () => void;
}

export const PresenceList: React.FC<PresenceListProps> = ({
  presenceData,
  currentUserId,
  currentUserDisplayName,
  isConnected,
  loading,
  onSignOut
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter out current user and convert to array
  const otherUsers = Object.values(presenceData).filter(
    user => user.userId !== currentUserId
  );

  const totalUsers = otherUsers.length + (currentUserId ? 1 : 0);

  return (
    <div className="presence-list">
      {/* Presence Header */}
      <div 
        className="presence-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="presence-title">
          <div className={`presence-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {loading ? 'Connecting...' : isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <span className="user-count">
            {totalUsers} user{totalUsers !== 1 ? 's' : ''} online
          </span>
        </div>
        <button className="expand-toggle" type="button">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Presence List */}
      {isExpanded && (
        <div className="presence-users">
          {/* Current User */}
          {currentUserId && (
            <div className="presence-user current-user">
              <div 
                className="user-color" 
                style={{ backgroundColor: generateUserColor(currentUserId) }}
              ></div>
              <span className="user-name">{currentUserDisplayName || 'You'} (You)</span>
              <div className="user-status online">●</div>
            </div>
          )}

          {/* Other Users */}
          {otherUsers.map((user) => (
            <div key={user.userId} className="presence-user">
              <div 
                className="user-color" 
                style={{ backgroundColor: user.cursorColor }}
              ></div>
              <span className="user-name">{user.displayName}</span>
              <div className="user-status online">●</div>
            </div>
          ))}

          {/* Empty State */}
          {otherUsers.length === 0 && currentUserId && (
            <div className="presence-empty">
              <p>You're the only one here</p>
              <p className="empty-hint">Share the link to collaborate!</p>
            </div>
          )}

          {/* No Users State */}
          {!currentUserId && (
            <div className="presence-empty">
              <p>No one online</p>
            </div>
          )}

          {/* Sign Out Button */}
          {onSignOut && currentUserId && (
            <div className="presence-actions">
              <button 
                onClick={onSignOut} 
                className="presence-sign-out-button"
                type="button"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

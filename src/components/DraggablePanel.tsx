import React, { useState, useRef, useEffect } from 'react';

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  className?: string;
  defaultCollapsed?: boolean;
  panelId?: string;
  externalPosition?: { x: number; y: number } | null; // Position set externally (for tiled panels)
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  defaultPosition = { x: 0, y: 0 },
  className = '',
  defaultCollapsed = false,
  panelId = '',
  externalPosition = null,
  onPositionChange,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  const externalPositionRef = useRef<{x: number, y: number} | null>(null);

  // Update position when externally controlled (for locked panels)
  useEffect(() => {
    if (externalPosition && !isDragging) {
      // Only update if the position actually changed
      if (externalPosition.x !== position.x || externalPosition.y !== position.y) {
        setPosition(externalPosition);
      }
    }
  }, [externalPosition, isDragging]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start dragging if clicking on the panel header (but not the collapse button)
    const target = e.target as HTMLElement;
    if (!target.closest('.panel-header') || target.closest('.collapse-button')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Store initial drag data in ref to avoid closure issues
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };

    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragDataRef.current) return;

      const deltaX = moveEvent.clientX - dragDataRef.current.startX;
      const deltaY = moveEvent.clientY - dragDataRef.current.startY;

      let newX = dragDataRef.current.initialX + deltaX;
      let newY = dragDataRef.current.initialY + deltaY;

      // Constrain to viewport bounds
      const panel = panelRef.current;
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
      }

      const newPosition = { x: newX, y: newY };
      setPosition(newPosition);
      
      // Notify parent of position change for locked panel synchronization
      if (onPositionChange && panelId) {
        onPositionChange(panelId, newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragDataRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={panelRef}
      className={`draggable-panel ${className} ${isDragging ? 'dragging' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 1001 : 100,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div 
        className="panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
      >
        <h4>{title}</h4>
        <div className="panel-header-controls">
          <button
            className="collapse-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              {isCollapsed ? (
                // Expand icon (chevron down)
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                // Collapse icon (chevron up)
                <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
          <div className="drag-grip">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="2" cy="2" r="1"/>
              <circle cx="6" cy="2" r="1"/>
              <circle cx="10" cy="2" r="1"/>
              <circle cx="2" cy="6" r="1"/>
              <circle cx="6" cy="6" r="1"/>
              <circle cx="10" cy="6" r="1"/>
              <circle cx="2" cy="10" r="1"/>
              <circle cx="6" cy="10" r="1"/>
              <circle cx="10" cy="10" r="1"/>
            </svg>
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
};

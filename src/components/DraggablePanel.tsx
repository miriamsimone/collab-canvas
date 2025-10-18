import React, { useState, useRef } from 'react';

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  className?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  defaultPosition = { x: 0, y: 0 },
  className = '',
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start dragging if clicking on the panel header
    const target = e.target as HTMLElement;
    if (!target.closest('.panel-header')) {
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

      setPosition({ x: newX, y: newY });
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
      className={`draggable-panel ${className} ${isDragging ? 'dragging' : ''}`}
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
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

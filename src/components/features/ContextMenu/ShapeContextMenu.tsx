import React, { useEffect, useRef } from 'react';
import './ShapeContextMenu.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface ShapeContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * Context menu for shape operations (right-click menu)
 */
export const ShapeContextMenu: React.FC<ShapeContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners after a small delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust X if menu would go off right edge
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust Y if menu would go off bottom edge
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="shape-context-menu"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.separator && <div className="context-menu-separator" />}
          <button
            className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            type="button"
          >
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};


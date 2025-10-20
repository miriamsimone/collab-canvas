import type { Shape } from '../types/shapes';
import { generateShapeId } from '../types/shapes';

/**
 * Copy shapes to clipboard (localStorage-based for cross-tab support)
 */
export const copyShapesToClipboard = (shapes: Shape[]): void => {
  if (shapes.length === 0) {
    console.warn('No shapes to copy');
    return;
  }
  
  try {
    const clipboardData = {
      shapes,
      timestamp: Date.now(),
    };
    
    localStorage.setItem('collab-canvas-clipboard', JSON.stringify(clipboardData));
    console.log(`Copied ${shapes.length} shape(s) to clipboard`);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};

/**
 * Get shapes from clipboard
 */
export const getShapesFromClipboard = (): Shape[] | null => {
  try {
    const clipboardDataStr = localStorage.getItem('collab-canvas-clipboard');
    if (!clipboardDataStr) {
      return null;
    }
    
    const clipboardData = JSON.parse(clipboardDataStr);
    
    // Check if clipboard data is too old (more than 1 hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - clipboardData.timestamp > maxAge) {
      console.warn('Clipboard data is too old');
      return null;
    }
    
    return clipboardData.shapes;
  } catch (error) {
    console.error('Failed to get clipboard data:', error);
    return null;
  }
};

/**
 * Clear clipboard
 */
export const clearClipboard = (): void => {
  try {
    localStorage.removeItem('collab-canvas-clipboard');
  } catch (error) {
    console.error('Failed to clear clipboard:', error);
  }
};

/**
 * Duplicate shapes with offset
 * @param shapes Shapes to duplicate
 * @param offsetX X offset for duplicates (default 20px)
 * @param offsetY Y offset for duplicates (default 20px)
 * @returns New shapes with updated IDs and positions
 */
export const duplicateShapes = (
  shapes: Shape[], 
  offsetX: number = 20, 
  offsetY: number = 20
): Shape[] => {
  if (shapes.length === 0) {
    return [];
  }
  
  return shapes.map(shape => {
    const newShape = { ...shape };
    
    // Generate new ID
    newShape.id = generateShapeId(shape.type);
    
    // Apply offset to position
    newShape.x = shape.x + offsetX;
    newShape.y = shape.y + offsetY;
    
    // For lines, also offset the second point
    if (shape.type === 'line' && 'x2' in shape && 'y2' in shape) {
      (newShape as any).x2 = (shape as any).x2 + offsetX;
      (newShape as any).y2 = (shape as any).y2 + offsetY;
    }
    
    // Update timestamps
    newShape.createdAt = Date.now();
    newShape.updatedAt = Date.now();
    
    // Remove fields that shouldn't be duplicated
    // Audio recordings belong to the original shape
    delete (newShape as any).audioUrl;
    delete (newShape as any).audioDuration;
    delete (newShape as any).isRambleStart;
    
    // Locks don't transfer to duplicates
    delete (newShape as any).lockedBy;
    
    // Connections don't transfer to duplicates
    delete (newShape as any).connections;
    
    // Remove any undefined fields (Firestore doesn't accept undefined)
    Object.keys(newShape).forEach(key => {
      if ((newShape as any)[key] === undefined) {
        delete (newShape as any)[key];
      }
    });
    
    return newShape;
  });
};


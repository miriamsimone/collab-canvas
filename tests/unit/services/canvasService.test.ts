import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canvasService } from '../../../src/services/canvasService';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore');
vi.mock('../../../src/services/firebase', () => ({
  db: {},
}));

const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);

describe('CanvasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeSharedCanvas', () => {
    it('should return existing canvas if it exists', async () => {
      const mockCanvasData = {
        id: 'shared',
        name: 'Shared Canvas',
        createdAt: { toDate: () => new Date('2023-01-01') },
        updatedAt: { toDate: () => new Date('2023-01-02') },
        createdBy: 'user1',
        isActive: true,
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      } as any);

      const result = await canvasService.initializeSharedCanvas('user1');

      expect(result).toEqual({
        id: 'shared',
        name: 'Shared Canvas',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        createdBy: 'user1',
        isActive: true,
      });
    });

    it('should create new canvas if it does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any);

      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await canvasService.initializeSharedCanvas('user1');

      expect(result.id).toBe('shared');
      expect(result.name).toBe('Shared Canvas');
      expect(result.createdBy).toBe('user1');
      expect(result.isActive).toBe(true);
      expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('getSharedCanvas', () => {
    it('should return canvas if it exists', async () => {
      const mockCanvasData = {
        id: 'shared',
        name: 'Shared Canvas',
        createdAt: { toDate: () => new Date('2023-01-01') },
        updatedAt: { toDate: () => new Date('2023-01-02') },
        createdBy: 'user1',
        isActive: true,
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      } as any);

      const result = await canvasService.getSharedCanvas();

      expect(result).not.toBeNull();
      expect(result?.id).toBe('shared');
    });

    it('should return null if canvas does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await canvasService.getSharedCanvas();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      const result = await canvasService.getSharedCanvas();

      expect(result).toBeNull();
    });
  });

  describe('getSharedCanvasId', () => {
    it('should return the shared canvas ID', () => {
      expect(canvasService.getSharedCanvasId()).toBe('shared');
    });
  });
});

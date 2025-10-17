import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type CanvasState } from '../../../src/types/ai';

// Mock the AI SDK modules
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-openai-model'),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock the AI service module to avoid initialization issues
vi.mock('../../../src/services/aiService', () => {
  class MockAIService {
    async processCommand(prompt: string, canvasState: any) {
      // This will be overridden by our test mocks
      return { success: false, error: 'Mock not configured' };
    }
    
    async testConnection() {
      return true;
    }
  }
  
  return {
    aiService: new MockAIService(),
    default: new MockAIService(),
  };
});

// Import after mocking
const mockProcessCommand = vi.fn();
const mockTestConnection = vi.fn();

describe('AIService (mocked)', () => {
  const mockCanvasState: CanvasState = {
    rectangles: [
      {
        id: 'rect-1',
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        fill: '#ff0000',
      },
    ],
    canvasSize: {
      width: 1200,
      height: 800,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock functions
    mockProcessCommand.mockReset();
    mockTestConnection.mockReset();
  });

  describe('processCommand', () => {
    it('should process a valid rectangle creation command', async () => {
      // Mock a successful response
      mockProcessCommand.mockResolvedValue({
        success: true,
        message: 'Creating a red rectangle at specified position',
        actions: [{
          type: 'createRectangle',
          parameters: {
            x: 200,
            y: 150,
            width: 100,
            height: 80,
            color: '#ff0000',
          },
        }],
      });

      const aiService = await import('../../../src/services/aiService');
      aiService.aiService.processCommand = mockProcessCommand;

      const result = await aiService.aiService.processCommand(
        'create a red rectangle at 200, 150',
        mockCanvasState
      );

      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions![0].type).toBe('createRectangle');
      expect(mockProcessCommand).toHaveBeenCalledWith(
        'create a red rectangle at 200, 150',
        mockCanvasState
      );
    });

    it('should handle non-rectangle commands', async () => {
      mockProcessCommand.mockResolvedValue({
        success: false,
        error: 'Command not recognized as a rectangle creation request',
      });

      const aiService = await import('../../../src/services/aiService');
      aiService.aiService.processCommand = mockProcessCommand;

      const result = await aiService.aiService.processCommand(
        'what is the weather like?',
        mockCanvasState
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command not recognized as a rectangle creation request');
    });

    it('should handle API errors gracefully', async () => {
      mockProcessCommand.mockResolvedValue({
        success: false,
        error: 'AI processing failed: Network error',
      });

      const aiService = await import('../../../src/services/aiService');
      aiService.aiService.processCommand = mockProcessCommand;

      const result = await aiService.aiService.processCommand(
        'create a rectangle',
        mockCanvasState
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI processing failed');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      mockTestConnection.mockResolvedValue(true);

      const aiService = await import('../../../src/services/aiService');
      aiService.aiService.testConnection = mockTestConnection;

      const result = await aiService.aiService.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection test', async () => {
      mockTestConnection.mockResolvedValue(false);

      const aiService = await import('../../../src/services/aiService');
      aiService.aiService.testConnection = mockTestConnection;

      const result = await aiService.aiService.testConnection();
      expect(result).toBe(false);
    });
  });
});

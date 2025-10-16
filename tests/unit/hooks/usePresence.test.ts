import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePresence } from '../../../src/hooks/usePresence';
import { useAuth } from '../../../src/hooks/useAuth';

// Mock the useAuth hook
vi.mock('../../../src/hooks/useAuth');
const mockUseAuth = vi.mocked(useAuth);

// Mock the presence service
vi.mock('../../../src/services/presenceService', () => ({
  presenceService: {
    updateCursorPosition: vi.fn().mockResolvedValue(undefined),
    subscribeToPresence: vi.fn(() => vi.fn()), // Returns unsubscribe function
    startHeartbeat: vi.fn(),
    stopHeartbeat: vi.fn(),
    markInactive: vi.fn().mockResolvedValue(undefined),
    removePresence: vi.fn().mockResolvedValue(undefined),
  },
  generateUserColor: vi.fn(() => '#FF6B6B'),
}));

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state when no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      error: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => usePresence());

    expect(result.current.cursors).toEqual({});
    expect(result.current.isConnected).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should initialize with loading state when user exists', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id' } as any,
      userProfile: { uid: 'test-user-id', displayName: 'Test User' } as any,
      loading: false,
      error: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => usePresence());

    expect(result.current.loading).toBe(true);
  });

  it('should provide updateCursorPosition function', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id' } as any,
      userProfile: { uid: 'test-user-id', displayName: 'Test User' } as any,
      loading: false,
      error: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => usePresence());

    expect(typeof result.current.updateCursorPosition).toBe('function');
  });

  it('should provide clearError function', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      error: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
    });

    const { result } = renderHook(() => usePresence());

    expect(typeof result.current.clearError).toBe('function');
  });
});

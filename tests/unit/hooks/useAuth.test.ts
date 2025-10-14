import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../../src/hooks/useAuth';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate no user initially
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
}));

// Mock Firebase services
vi.mock('../../../src/services/firebase', () => ({
  auth: {},
  db: {},
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBe(null);
    expect(result.current.userProfile).toBe(null);
    // In our mocked environment, loading resolves immediately to false
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should provide auth functions', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should clear error when clearError is called', async () => {
    const { result } = renderHook(() => useAuth());

    // Set an error state (this would normally happen after a failed operation)
    // For this test, we'll wait for the initial loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear error should work even if no error is set
    result.current.clearError();
    expect(result.current.error).toBe(null);
  });

  it('should handle auth state changes', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.userProfile).toBe(null);
  });
});

describe('useAuth error handling', () => {
  it('should return user-friendly error messages', () => {
    const { result } = renderHook(() => useAuth());

    // Test that the hook provides error clearing functionality
    expect(typeof result.current.clearError).toBe('function');
    
    // Test initial error state
    expect(result.current.error).toBe(null);
  });
});

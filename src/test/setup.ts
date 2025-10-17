import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase modules for testing
vi.mock('../services/firebase', () => ({
  auth: {},
  db: {},
  rtdb: {
    // Mock RTDB instance with required internal methods for testing
    _checkNotDeleted: vi.fn(),
    _delegate: {}
  },
  SHARED_CANVAS_ID: 'shared'
}));

// Mock Firebase RTDB functions
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({ path: 'mocked-ref' })),
  set: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
  off: vi.fn(),
}));

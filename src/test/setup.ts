import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase modules for testing
vi.mock('../services/firebase', () => ({
  auth: {},
  db: {},
  SHARED_CANVAS_ID: 'shared'
}));

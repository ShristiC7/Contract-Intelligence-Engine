import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
  process.env.REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';
});

beforeEach(() => {
  // Clear any mocks before each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Cleanup after all tests
});
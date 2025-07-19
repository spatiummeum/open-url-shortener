// Jest setup file for backend tests
import { jest } from '@jest/globals';

// Mock nanoid to avoid ESM issues
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id-12345'),
}));

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Set environment variables for testing
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.BASE_URL = 'http://localhost:3002';
process.env.FRONTEND_URL = 'http://localhost:3003';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

export {};

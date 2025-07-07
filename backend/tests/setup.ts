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

// Set Stripe environment variables for testing
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_secret';

export {};

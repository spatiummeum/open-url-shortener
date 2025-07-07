import request from 'supertest';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import app from '../../app';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');
const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
} as any;

// Mock webhook handler
jest.mock('../../services/stripeService', () => ({
  handleWebhook: jest.fn(),
}));

import { handleWebhook } from '../../services/stripeService';

describe('Webhook Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => mockStripe);
    
    // Mock environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should process valid webhook', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123' } },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      (handleWebhook as jest.MockedFunction<typeof handleWebhook>)
        .mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid_signature')
        .send(Buffer.from('webhook_payload'))
        .expect(200);

      expect(response.body).toEqual({ received: true });
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
      expect(handleWebhook).toHaveBeenCalledWith(expect.objectContaining({
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: expect.objectContaining({
          object: expect.objectContaining({ id: 'cs_123' })
        })
      }));
    });

    it('should return 400 for invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature')
        .send(Buffer.from('webhook_payload'))
        .expect(400);

      expect(response.text).toContain('Webhook Error: Invalid signature');
    });

    it('should return 500 if webhook secret not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'some_signature')
        .send(Buffer.from('webhook_payload'))
        .expect(500);

      expect(response.text).toContain('Webhook secret not configured');
    });

    it('should handle webhook processing errors', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123' } },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      (handleWebhook as jest.MockedFunction<typeof handleWebhook>)
        .mockRejectedValue(new Error('Processing failed'));

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid_signature')
        .send(Buffer.from('webhook_payload'))
        .expect(500);

      expect(response.body).toEqual({ 
        error: 'Webhook processing failed' 
      });
    });
  });
});

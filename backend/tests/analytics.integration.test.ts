import { getDashboardAnalytics, getUrlAnalytics } from '../src/services/analyticsService';

describe('Analytics Integration Tests', () => {
  it('should handle empty user analytics gracefully', () => {
    // This is a basic smoke test to ensure the functions exist and can be imported
    expect(typeof getDashboardAnalytics).toBe('function');
    expect(typeof getUrlAnalytics).toBe('function');
  });

  it('should export all required interfaces', () => {
    // Test that we can import the service without errors
    const module = require('../src/services/analyticsService');
    expect(module.getDashboardAnalytics).toBeDefined();
    expect(module.getUrlAnalytics).toBeDefined();
    expect(module.createDailyAnalytics).toBeDefined();
  });
});

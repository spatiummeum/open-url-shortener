import axios from 'axios';

// Mock axios completely
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

// Mock the auth store
jest.mock('../../store/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      tokens: null,
      logout: jest.fn(),
      updateTokens: jest.fn(),
    })),
  },
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create axios instance with correct config', () => {
    // Import the service to trigger constructor
    require('../apiService');
    
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should have apiService instance', () => {
    const { apiService } = require('../apiService');
    expect(apiService).toBeDefined();
  });
});

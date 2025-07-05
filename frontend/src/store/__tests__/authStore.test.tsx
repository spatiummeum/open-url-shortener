import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import type { User, AuthTokens } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    // Clear localStorage mock calls
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'FREE',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
  };

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.tokens).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should login user successfully', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.login(mockUser, mockTokens);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.tokens).toEqual(mockTokens);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should logout user successfully', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First login
    act(() => {
      result.current.login(mockUser, mockTokens);
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    
    // Then logout
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.tokens).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should update user data', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First login
    act(() => {
      result.current.login(mockUser, mockTokens);
    });
    
    const updatedData = {
      name: 'Updated Name',
      plan: 'PRO' as const,
    };
    
    act(() => {
      result.current.updateUser(updatedData);
    });
    
    expect(result.current.user).toEqual({
      ...mockUser,
      ...updatedData,
    });
  });

  it('should not update user if no user is logged in', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const updatedData = {
      name: 'Updated Name',
    };
    
    act(() => {
      result.current.updateUser(updatedData);
    });
    
    expect(result.current.user).toBeNull();
  });

  it('should update tokens', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const newTokens: AuthTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
    
    act(() => {
      result.current.updateTokens(newTokens);
    });
    
    expect(result.current.tokens).toEqual(newTokens);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.isLoading).toBe(false);
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should maintain authentication state across hook renders', () => {
    const { result: result1 } = renderHook(() => useAuthStore());
    
    act(() => {
      result1.current.login(mockUser, mockTokens);
    });
    
    // Render a new hook instance
    const { result: result2 } = renderHook(() => useAuthStore());
    
    expect(result2.current.user).toEqual(mockUser);
    expect(result2.current.tokens).toEqual(mockTokens);
    expect(result2.current.isAuthenticated).toBe(true);
  });

  it('should handle multiple state updates correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setLoading(true);
      result.current.login(mockUser, mockTokens);
      result.current.updateUser({ name: 'New Name' });
      result.current.setLoading(false);
    });
    
    expect(result.current.user?.name).toBe('New Name');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});

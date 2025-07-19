import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Reset the store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide all required auth actions', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateTokens).toBe('function');
      expect(typeof result.current.updateUser).toBe('function');
      expect(typeof result.current.setLoading).toBe('function');
      expect(typeof result.current.checkAuth).toBe('function');
    });
  });

  describe('Login Functionality', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResponse = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      tokens: {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      },
    };

    it('should login successfully with valid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockLoginResponse),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login(mockCredentials);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCredentials),
        }
      );

      expect(result.current.user).toEqual(mockLoginResponse.user);
      expect(result.current.tokens).toEqual(mockLoginResponse.tokens);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockCredentials);
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockLoginResponse),
        });
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      const errorResponse = { error: 'Invalid credentials' };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce(errorResponse),
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          try {
            await result.current.login(mockCredentials);
          } catch (error) {
            // Loading should be false after error
            expect(result.current.isLoading).toBe(false);
            throw error;
          }
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network errors during login', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          try {
            await result.current.login(mockCredentials);
          } catch (error) {
            // Loading should be false after error
            expect(result.current.isLoading).toBe(false);
            throw error;
          }
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Logout Functionality', () => {
    it('should clear all auth state on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some initial state
      act(() => {
        result.current.updateUser({
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'FREE',
          isActive: true,
          isVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        });
        result.current.updateTokens({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should update tokens correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      act(() => {
        result.current.updateTokens(newTokens);
      });

      expect(result.current.tokens).toEqual(newTokens);
    });

    it('should update user correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      const newUser = {
        id: 'user456',
        email: 'updated@example.com',
        name: 'Updated User',
        plan: 'PRO' as const,
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      act(() => {
        result.current.updateUser(newUser);
      });

      expect(result.current.user).toEqual(newUser);
    });
  });

  describe('Loading State Management', () => {
    it('should update loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Authentication Check', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      plan: 'FREE',
      isActive: true,
      isVerified: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should return false when no tokens are present', async () => {
      const { result } = renderHook(() => useAuthStore());

      const isAuthenticated = await act(async () => {
        return await result.current.checkAuth();
      });

      expect(isAuthenticated).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should verify authentication with valid access token', async () => {
      // Mock successful /auth/me response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ user: mockUser }),
      });

      const { result } = renderHook(() => useAuthStore());

      // Set tokens first
      act(() => {
        result.current.updateTokens({
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
        });
      });

      const isAuthenticated = await act(async () => {
        return await result.current.checkAuth();
      });

      expect(isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            Authorization: 'Bearer valid-access-token',
          },
        }
      );
    });

    it('should refresh tokens when access token is expired', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      // Mock /auth/me failure (expired token)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock successful refresh
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(newTokens),
        })
        // Mock successful /auth/me with new token
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({ user: mockUser }),
        });

      const { result } = renderHook(() => useAuthStore());

      // Set initial tokens
      act(() => {
        result.current.updateTokens({
          accessToken: 'expired-access-token',
          refreshToken: 'valid-refresh-token',
        });
      });

      const isAuthenticated = await act(async () => {
        return await result.current.checkAuth();
      });

      expect(isAuthenticated).toBe(true);
      expect(result.current.tokens).toEqual(newTokens);
      expect(result.current.user).toEqual(mockUser);

      // Should have called /auth/me, /auth/refresh, then /auth/me again
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should logout when refresh token is also invalid', async () => {
      // Mock /auth/me failure and refresh failure
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const { result } = renderHook(() => useAuthStore());

      // Set initial tokens
      act(() => {
        result.current.updateTokens({
          accessToken: 'expired-access-token',
          refreshToken: 'expired-refresh-token',
        });
      });

      const isAuthenticated = await act(async () => {
        return await result.current.checkAuth();
      });

      expect(isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle network errors during auth check', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      // Set tokens first
      act(() => {
        result.current.updateTokens({
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
        });
      });

      const isAuthenticated = await act(async () => {
        return await result.current.checkAuth();
      });

      expect(isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
    });
  });

  describe('API Integration', () => {
    it('should use correct API URL from environment', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          user: {},
          tokens: { accessToken: 'token', refreshToken: 'refresh' },
        }),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login(mockCredentials);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        expect.any(Object)
      );
    });

    it('should send correct headers for API requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ user: {} }),
      });

      const { result } = renderHook(() => useAuthStore());

      // Set tokens
      act(() => {
        result.current.updateTokens({
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
        });
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'password',
          });
        })
      ).rejects.toThrow('Invalid JSON');
    });

    it('should handle missing error messages in API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'password',
          });
        })
      ).rejects.toThrow('Login failed');
    });
  });
});
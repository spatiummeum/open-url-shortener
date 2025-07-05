import { renderHook, act, waitFor } from '@testing-library/react';
import { useState, useCallback, useEffect } from 'react';

// Custom hook for URL shortening with React 19 features
function useUrlShortener() {
  const [urls, setUrls] = useState<Array<{id: string, originalUrl: string, shortCode: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Using useCallback with React 19 improvements
  const shortenUrl = useCallback(async (originalUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newUrl = {
        id: Math.random().toString(36).substr(2, 9),
        originalUrl,
        shortCode: Math.random().toString(36).substr(2, 8),
      };

      setUrls(prev => [...prev, newUrl]);
      return newUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to shorten URL';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteUrl = useCallback((id: string) => {
    setUrls(prev => prev.filter(url => url.id !== id));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    urls,
    isLoading,
    error,
    shortenUrl,
    deleteUrl,
    clearError,
  };
}

// Custom hook for local storage with React 19 features
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Tests
describe('useUrlShortener Hook', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useUrlShortener());

    expect(result.current.urls).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should shorten URL successfully', async () => {
    const { result } = renderHook(() => useUrlShortener());

    let shortenedUrl: any;

    await act(async () => {
      shortenedUrl = await result.current.shortenUrl('https://example.com');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.urls).toHaveLength(1);
    expect(result.current.urls[0]).toEqual(shortenedUrl);
    expect(result.current.urls[0].originalUrl).toBe('https://example.com');
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state correctly', async () => {
    const { result } = renderHook(() => useUrlShortener());

    act(() => {
      result.current.shortenUrl('https://example.com');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should delete URL', async () => {
    const { result } = renderHook(() => useUrlShortener());

    // First add a URL
    let shortenedUrl: any;
    await act(async () => {
      shortenedUrl = await result.current.shortenUrl('https://example.com');
    });

    expect(result.current.urls).toHaveLength(1);

    // Then delete it
    act(() => {
      result.current.deleteUrl(shortenedUrl.id);
    });

    expect(result.current.urls).toHaveLength(0);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useUrlShortener());

    // Use the clearError function that actually exists
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should add multiple URLs', async () => {
    const { result } = renderHook(() => useUrlShortener());

    await act(async () => {
      await result.current.shortenUrl('https://example1.com');
      await result.current.shortenUrl('https://example2.com');
    });

    expect(result.current.urls).toHaveLength(2);
    expect(result.current.urls[0].originalUrl).toBe('https://example1.com');
    expect(result.current.urls[1].originalUrl).toBe('https://example2.com');
  });
});

describe('useLocalStorage Hook', () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    jest.clearAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value from localStorage', () => {
    const storedValue = JSON.stringify('stored-value');
    localStorageMock.getItem.mockReturnValue(storedValue);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('new-value')
    );
  });

  it('should handle function updates', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(10));

    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(11);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'counter',
      JSON.stringify(11)
    );
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('should work with complex objects', () => {
    const complexObject = { id: 1, name: 'test', nested: { value: true } };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));

    const { result } = renderHook(() => useLocalStorage('complex', {}));

    expect(result.current[0]).toEqual(complexObject);

    const updatedObject = { ...complexObject, name: 'updated' };
    act(() => {
      result.current[1](updatedObject);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'complex',
      JSON.stringify(updatedObject)
    );
  });
});

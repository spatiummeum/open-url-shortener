import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../login/page';
import RegisterPage from '../register/page';

// Mock Next.js useRouter
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Link component from Next.js
jest.mock('next/link', () => {
  const MockLink = ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock apiService
const mockPost = jest.fn();
jest.mock('../../../src/services/apiService', () => ({
  apiService: {
    post: mockPost,
  },
}));

// Mock AuthStore
const mockUpdateUser = jest.fn();
const mockUpdateTokens = jest.fn();
jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: () => ({
    updateUser: mockUpdateUser,
    updateTokens: mockUpdateTokens,
  }),
}));

// Mock AuthDebug component
jest.mock('../../../src/components/AuthDebug', () => {
  return function MockAuthDebug() {
    return <div data-testid="auth-debug">AuthDebug Component</div>;
  };
});

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Navigation Improvements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockPost.mockClear();
    mockFetch.mockClear();
  });

  describe('Login Page Navigation', () => {
    it('should render Link components for navigation', () => {
      render(<LoginPage />);

      // Check for "Sign up" link
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/register');

      // Check for "Forgot password" link
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should use proper Next.js Link for register navigation', () => {
      render(<LoginPage />);

      const registerLink = screen.getByText(/sign up/i);
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    it('should use proper Next.js Link for forgot password navigation', () => {
      render(<LoginPage />);

      const forgotPasswordLink = screen.getByText(/forgot your password/i);
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
    });

    it('should navigate to dashboard after successful login using useRouter', async () => {
      const mockLoginResponse = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'FREE',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockPost.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginPage />);

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      expect(mockUpdateUser).toHaveBeenCalledWith(mockLoginResponse.user);
      expect(mockUpdateTokens).toHaveBeenCalledWith(mockLoginResponse.tokens);
    });

    it('should have proper styling for navigation links', () => {
      render(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /sign up/i });
      expect(registerLink).toHaveClass('text-blue-600', 'hover:text-blue-700', 'font-semibold');

      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i });
      expect(forgotPasswordLink).toHaveClass('text-blue-600', 'hover:text-blue-700');
    });
  });

  describe('Register Page Navigation', () => {
    it('should render link to login page', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in to your existing account/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should navigate to login page after successful registration using useRouter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'Registration successful' }),
      });

      render(<RegisterPage />);

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?message=Registration successful! Please log in.');
      });
    });

    it('should have proper styling for login link', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in to your existing account/i });
      expect(loginLink).toHaveClass('font-medium', 'text-blue-600', 'hover:text-blue-500');
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('should handle login errors properly', async () => {
      const errorMessage = 'Invalid credentials';
      mockPost.mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      render(<LoginPage />);

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: 'wrongpassword' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Should not navigate on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle registration validation errors', async () => {
      render(<RegisterPage />);

      // Fill in form with mismatched passwords
      fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
        target: { value: 'differentpassword' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      // Should not make API call or navigate on validation error
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle short password validation', async () => {
      render(<RegisterPage />);

      // Fill in form with short password
      fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: '12345' },
      });
      fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
        target: { value: '12345' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during login', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockPost.mockReturnValueOnce(promise);

      render(<LoginPage />);

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading state
      expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in.../i })).toBeDisabled();

      // Resolve the promise
      resolvePromise!({
        user: { id: 'user123' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      });

      await waitFor(() => {
        expect(screen.queryByText(/signing in.../i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state during registration', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      render(<RegisterPage />);

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
        target: { value: 'password123' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Should show loading state
      expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating account.../i })).toBeDisabled();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'Success' }),
      });

      await waitFor(() => {
        expect(screen.queryByText(/creating account.../i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility in login form', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Toggle button has no accessible name

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      fireEvent.click(toggleButton);

      // Password should now be visible
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle button again
      fireEvent.click(toggleButton);

      // Password should be hidden again
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint for login', async () => {
      const mockLoginResponse = {
        user: { id: 'user123' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      };

      mockPost.mockResolvedValueOnce(mockLoginResponse);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should call correct API endpoint for registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ message: 'Success' }),
      });

      render(<RegisterPage />);

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText(/john doe/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Test User',
              email: 'test@example.com',
              password: 'password123',
            }),
          }
        );
      });
    });
  });
});
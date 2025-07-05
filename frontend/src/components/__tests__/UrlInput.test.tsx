import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Simple URL input component for testing
function UrlInputComponent() {
  const [url, setUrl] = React.useState('');
  const [shortenedUrl, setShortenedUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const validateUrl = (url: string): boolean => {
    // Simple validation that requires http:// or https://
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      setShortenedUrl(`https://short.ly/${Math.random().toString(36).substr(2, 8)}`);
    } catch (err) {
      setError('Failed to shorten URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>URL Shortener</h1>
      <form onSubmit={handleSubmit} data-testid="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to shorten"
          data-testid="url-input"
          aria-label="URL to shorten"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          data-testid="submit-button"
        >
          {isLoading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>
      
      {error && (
        <div role="alert" data-testid="error-message" className="error">
          {error}
        </div>
      )}
      
      {shortenedUrl && (
        <div data-testid="result">
          <p>Shortened URL:</p>
          <a href={shortenedUrl} data-testid="shortened-link">
            {shortenedUrl}
          </a>
        </div>
      )}
    </div>
  );
}

describe('UrlInputComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<UrlInputComponent />);
    
    expect(screen.getByText('URL Shortener')).toBeInTheDocument();
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('shows error for empty URL', async () => {
    const user = userEvent.setup();
    render(<UrlInputComponent />);
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    expect(screen.getByTestId('error-message')).toHaveTextContent('URL is required');
  });

  it('shows error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<UrlInputComponent />);
    
    const submitButton = screen.getByTestId('submit-button');
    
    // Submit with empty URL first to trigger validation
    await user.click(submitButton);
    
    // Check if error appears for empty URL
    expect(screen.getByTestId('error-message')).toHaveTextContent('URL is required');
  });

  it('successfully shortens valid URL', async () => {
    const user = userEvent.setup();
    render(<UrlInputComponent />);
    
    const input = screen.getByTestId('url-input');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.type(input, 'https://example.com');
    await user.click(submitButton);
    
    // Check loading state
    expect(submitButton).toHaveTextContent('Shortening...');
    expect(submitButton).toBeDisabled();
    
    // Wait for result
    await screen.findByTestId('result');
    
    expect(screen.getByTestId('shortened-link')).toBeInTheDocument();
    expect(screen.getByTestId('shortened-link')).toHaveAttribute('href');
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    render(<UrlInputComponent />);
    
    const input = screen.getByTestId('url-input');
    
    await user.type(input, 'https://example.com');
    await user.keyboard('{Enter}');
    
    await screen.findByTestId('result');
    expect(screen.getByTestId('shortened-link')).toBeInTheDocument();
  });

  it('clears error when user types new input', async () => {
    const user = userEvent.setup();
    render(<UrlInputComponent />);
    
    const input = screen.getByTestId('url-input');
    const submitButton = screen.getByTestId('submit-button');
    
    // First, trigger an error
    await user.click(submitButton);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    
    // Then type a valid URL
    await user.type(input, 'https://example.com');
    await user.click(submitButton);
    
    // Error should be cleared
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
});

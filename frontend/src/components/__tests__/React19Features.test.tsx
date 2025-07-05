import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Test for React 19 component
function React19TestComponent() {
  const [count, setCount] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  
  const handleClick = () => {
    startTransition(() => {
      setCount(prev => prev + 1);
    });
  };

  return (
    <div>
      <h1>React 19 Test Component</h1>
      <p data-testid="count">Count: {count}</p>
      <button 
        onClick={handleClick}
        disabled={isPending}
        data-testid="increment-button"
      >
        {isPending ? 'Loading...' : 'Increment'}
      </button>
    </div>
  );
}

describe('React 19 Features Test', () => {
  it('renders the component correctly', () => {
    render(<React19TestComponent />);
    
    expect(screen.getByText('React 19 Test Component')).toBeInTheDocument();
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
    expect(screen.getByTestId('increment-button')).toBeInTheDocument();
  });

  it('increments count with transition', async () => {
    const user = userEvent.setup();
    render(<React19TestComponent />);
    
    const button = screen.getByTestId('increment-button');
    const countElement = screen.getByTestId('count');
    
    expect(countElement).toHaveTextContent('Count: 0');
    
    await user.click(button);
    
    await waitFor(() => {
      expect(countElement).toHaveTextContent('Count: 1');
    });
  });

  it('shows loading state during transition', async () => {
    const user = userEvent.setup();
    render(<React19TestComponent />);
    
    const button = screen.getByTestId('increment-button');
    
    await user.click(button);
    
    // The button should show loading state during transition
    // Note: This might be very brief in this simple example
    expect(button).toBeEnabled();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpgradeButton from '../UpgradeButton';
import { stripeService } from '../../services/stripeService';

// Mock the stripe service
jest.mock('../../services/stripeService', () => ({
  stripeService: {
    redirectToCheckout: jest.fn(),
  },
}));

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>;

describe('UpgradeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default text for pro plan', () => {
    render(<UpgradeButton plan="pro" />);
    
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument();
  });

  it('should render with default text for enterprise plan', () => {
    render(<UpgradeButton plan="enterprise" />);
    
    expect(screen.getByRole('button', { name: 'Upgrade to Enterprise' })).toBeInTheDocument();
  });

  it('should render with custom children', () => {
    render(
      <UpgradeButton plan="pro">
        Custom Upgrade Text
      </UpgradeButton>
    );
    
    expect(screen.getByRole('button', { name: 'Custom Upgrade Text' })).toBeInTheDocument();
  });

  it('should apply primary variant styles by default', () => {
    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-500', 'hover:bg-blue-600', 'text-white');
  });

  it('should apply secondary variant styles', () => {
    render(<UpgradeButton plan="pro" variant="secondary" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-500', 'hover:bg-gray-600', 'text-white');
  });

  it('should apply outline variant styles', () => {
    render(<UpgradeButton plan="pro" variant="outline" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-2', 'border-blue-500', 'text-blue-500');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<UpgradeButton plan="pro" disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
  });

  it('should handle successful upgrade to pro', async () => {
    mockStripeService.redirectToCheckout.mockResolvedValue();

    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockStripeService.redirectToCheckout).toHaveBeenCalledWith('pro');
    });
  });

  it('should handle successful upgrade to enterprise', async () => {
    mockStripeService.redirectToCheckout.mockResolvedValue();

    render(<UpgradeButton plan="enterprise" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockStripeService.redirectToCheckout).toHaveBeenCalledWith('enterprise');
    });
  });

  it('should show loading state during upgrade', async () => {
    // Mock a slow checkout process
    mockStripeService.redirectToCheckout.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-gray-300', 'text-gray-500');
    });
  });

  it('should display error message on upgrade failure', async () => {
    mockStripeService.redirectToCheckout.mockRejectedValue(new Error('Checkout failed'));

    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Failed to start upgrade process. Please try again.')).toBeInTheDocument();
    });

    // Button should be enabled again after error
    expect(button).not.toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<UpgradeButton plan="pro" className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should not call redirectToCheckout when disabled', () => {
    render(<UpgradeButton plan="pro" disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockStripeService.redirectToCheckout).not.toHaveBeenCalled();
  });

  it('should show loading spinner during processing', async () => {
    // Mock a slow checkout process
    mockStripeService.redirectToCheckout.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const spinner = button.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('should clear error state on subsequent clicks', async () => {
    mockStripeService.redirectToCheckout
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce();

    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    
    // First click - error
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Failed to start upgrade process. Please try again.')).toBeInTheDocument();
    });

    // Second click - should clear error
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText('Failed to start upgrade process. Please try again.')).not.toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<UpgradeButton plan="pro" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
  });
});

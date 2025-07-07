import { render, screen, fireEvent } from '@testing-library/react';
import PaymentStatus from '../PaymentStatus';

// Mock Next.js useSearchParams
const mockGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
  reload: jest.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('PaymentStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    mockLocation.href = '';
  });

  it('should not render when no payment parameter is present', () => {
    mockGet.mockReturnValue(null);

    const { container } = render(<PaymentStatus />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render success status', () => {
    mockGet.mockReturnValue('success');

    render(<PaymentStatus />);
    
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('Payment successful! Your subscription has been activated.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
  });

  it('should render canceled status', () => {
    mockGet.mockReturnValue('canceled');

    render(<PaymentStatus />);
    
    expect(screen.getByText('Payment Canceled')).toBeInTheDocument();
    expect(screen.getByText('Payment was canceled. You can try again anytime.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should render error status for unknown payment values', () => {
    mockGet.mockReturnValue('unknown');

    render(<PaymentStatus />);
    
    expect(screen.getByText('Payment Error')).toBeInTheDocument();
    expect(screen.getByText('There was an issue processing your payment. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    mockGet.mockReturnValue('success');

    render(<PaymentStatus onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate to dashboard when "Go to Dashboard" is clicked', () => {
    mockGet.mockReturnValue('success');

    render(<PaymentStatus />);
    
    const dashboardButton = screen.getByRole('button', { name: 'Go to Dashboard' });
    fireEvent.click(dashboardButton);

    expect(mockLocation.href).toBe('/dashboard');
  });

  it('should navigate to dashboard when "Try Again" is clicked', () => {
    mockGet.mockReturnValue('canceled');

    render(<PaymentStatus />);
    
    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(tryAgainButton);

    expect(mockLocation.href).toBe('/dashboard');
  });

  it('should display success icon for successful payment', () => {
    mockGet.mockReturnValue('success');

    render(<PaymentStatus />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('text-green-500');
  });

  it('should display warning icon for canceled payment', () => {
    mockGet.mockReturnValue('canceled');

    render(<PaymentStatus />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('text-yellow-500');
  });

  it('should display error icon for payment error', () => {
    mockGet.mockReturnValue('error');

    render(<PaymentStatus />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('text-red-500');
  });

  it('should apply correct background color for success status', () => {
    mockGet.mockReturnValue('success');

    render(<PaymentStatus />);
    
    const modal = screen.getByRole('dialog', { hidden: true });
    expect(modal).toHaveClass('border-green-200', 'bg-green-50');
  });

  it('should apply correct background color for canceled status', () => {
    mockGet.mockReturnValue('canceled');

    render(<PaymentStatus />);
    
    const modal = screen.getByRole('dialog', { hidden: true });
    expect(modal).toHaveClass('border-yellow-200', 'bg-yellow-50');
  });

  it('should apply correct background color for error status', () => {
    mockGet.mockReturnValue('error');

    render(<PaymentStatus />);
    
    const modal = screen.getByRole('dialog', { hidden: true });
    expect(modal).toHaveClass('border-red-200', 'bg-red-50');
  });

  it('should reload page after successful payment', () => {
    jest.useFakeTimers();
    mockGet.mockReturnValue('success');

    render(<PaymentStatus />);

    // Fast forward 3 seconds
    jest.advanceTimersByTime(3000);

    expect(mockLocation.reload).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should render modal overlay', () => {
    mockGet.mockReturnValue('success');

    render(<PaymentStatus />);
    
    const overlay = screen.getByRole('dialog', { hidden: true }).parentElement;
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });
});

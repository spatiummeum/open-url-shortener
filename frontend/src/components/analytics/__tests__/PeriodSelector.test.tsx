import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PeriodSelector from '../PeriodSelector';

describe('PeriodSelector', () => {
  const mockOnPeriodChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all period options', () => {
    render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    // Check that all period buttons are rendered
    expect(screen.getByRole('button', { name: 'Last Hour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 24h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 30 days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 90 days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 6 months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last year' })).toBeInTheDocument();
  });

  it('highlights the selected period', () => {
    render(
      <PeriodSelector
        selectedPeriod="7d"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const selectedButton = screen.getByRole('button', { name: 'Last 7 days' });
    expect(selectedButton).toHaveClass('bg-white', 'text-blue-600', 'shadow-sm');
  });

  it('applies hover classes to non-selected periods', () => {
    render(
      <PeriodSelector
        selectedPeriod="7d"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const nonSelectedButton = screen.getByRole('button', { name: 'Last Hour' });
    expect(nonSelectedButton).toHaveClass('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-200');
  });

  it('calls onPeriodChange when a period button is clicked', () => {
    render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const button = screen.getByRole('button', { name: 'Last 7 days' });
    fireEvent.click(button);

    expect(mockOnPeriodChange).toHaveBeenCalledWith('7d');
    expect(mockOnPeriodChange).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('uses default className when none provided', () => {
    const { container } = render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('inline-flex', 'bg-gray-100', 'rounded-lg', 'p-1');
  });

  it('renders correct number of period buttons', () => {
    render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
  });

  it('each button has correct styling classes', () => {
    render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('px-3', 'py-2', 'text-sm', 'font-medium', 'rounded-md', 'transition-all', 'duration-200');
    });
  });

  it('maintains accessibility with proper button roles', () => {
    render(
      <PeriodSelector
        selectedPeriod="1h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeVisible();
      expect(button).not.toBeDisabled();
    });
  });

  it('handles rapid clicks correctly', () => {
    render(
      <PeriodSelector
        selectedPeriod="24h"
        onPeriodChange={mockOnPeriodChange}
      />
    );

    const button = screen.getByRole('button', { name: 'Last 30 days' });
    
    // Multiple rapid clicks
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockOnPeriodChange).toHaveBeenCalledTimes(3);
    expect(mockOnPeriodChange).toHaveBeenCalledWith('30d');
  });
});

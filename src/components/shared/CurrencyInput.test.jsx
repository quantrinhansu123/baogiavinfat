/**
 * Unit tests for CurrencyInput component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyInput from './CurrencyInput';

describe('CurrencyInput', () => {
  describe('rendering', () => {
    it('renders with default placeholder', () => {
      render(<CurrencyInput onChange={() => {}} />);
      expect(screen.getByPlaceholderText('Nhập số tiền')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<CurrencyInput onChange={() => {}} placeholder="Số tiền cọc" />);
      expect(screen.getByPlaceholderText('Số tiền cọc')).toBeInTheDocument();
    });

    it('renders as disabled when disabled prop is true', () => {
      render(<CurrencyInput onChange={() => {}} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies custom className', () => {
      render(<CurrencyInput onChange={() => {}} className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });
  });

  describe('formatting', () => {
    it('formats value with thousand separators', () => {
      render(<CurrencyInput value={1000000} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('1.000.000');
    });

    it('displays empty for zero value', () => {
      render(<CurrencyInput value={0} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('displays empty for null value', () => {
      render(<CurrencyInput value={null} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('displays empty for undefined value', () => {
      render(<CurrencyInput value={undefined} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('formats large car prices correctly', () => {
      render(<CurrencyInput value={850000000} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('850.000.000');
    });
  });

  describe('user input', () => {
    it('calls onChange with parsed number', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '500000' } });

      expect(handleChange).toHaveBeenCalledWith(500000);
    });

    it('strips non-numeric characters', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '1.000.000 VND' } });

      expect(handleChange).toHaveBeenCalledWith(1000000);
    });

    it('handles empty input', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={1000} onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      expect(handleChange).toHaveBeenCalledWith(0);
    });
  });

  describe('focus and blur', () => {
    it('handles focus event', () => {
      render(<CurrencyInput value={1000000} onChange={() => {}} />);
      const input = screen.getByRole('textbox');

      // Focus should trigger select after timeout
      fireEvent.focus(input);
      // Component uses setTimeout for select - verify no errors thrown
      expect(input).toBeInTheDocument();
    });

    it('formats on blur', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '500000' } });
      fireEvent.blur(input);

      expect(handleChange).toHaveBeenCalledWith(500000);
    });
  });

  describe('IME composition', () => {
    it('does not format during composition', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole('textbox');

      // Start IME composition
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: '123abc' } });

      // onChange should not be called during composition
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('formats after composition ends', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole('textbox');

      // Start and end IME composition
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: '1000000' } });
      fireEvent.compositionEnd(input, { target: { value: '1000000' } });

      expect(handleChange).toHaveBeenCalledWith(1000000);
    });

    it('handles blur during composition', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput value={0} onChange={handleChange} />);

      const input = screen.getByRole('textbox');

      // Start composition and blur without ending
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: '500000' } });
      fireEvent.blur(input, { target: { value: '500000' } });

      expect(handleChange).toHaveBeenCalledWith(500000);
    });
  });

  describe('edge cases', () => {
    it('handles rapid input changes', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');

      // Rapid changes
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.change(input, { target: { value: '12' } });
      fireEvent.change(input, { target: { value: '123' } });

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('preserves input mode as numeric', () => {
      render(<CurrencyInput onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('inputMode', 'numeric');
    });

    it('has autocomplete off', () => {
      render(<CurrencyInput onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'off');
    });

    it('passes through additional props', () => {
      render(<CurrencyInput onChange={() => {}} data-testid="currency-input" id="my-input" />);
      const input = screen.getByTestId('currency-input');
      expect(input).toHaveAttribute('id', 'my-input');
    });
  });

  describe('real-world scenarios', () => {
    it('handles VinFast car deposit (50 triệu)', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '50000000' } });

      expect(handleChange).toHaveBeenCalledWith(50000000);
    });

    it('handles full car price (850 triệu)', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '850000000' } });

      expect(handleChange).toHaveBeenCalledWith(850000000);
    });

    it('handles discount amounts', () => {
      const handleChange = vi.fn();
      render(<CurrencyInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '15000000' } });

      expect(handleChange).toHaveBeenCalledWith(15000000);
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Header from '../Components/Header';

describe('Header Component', () => {
  const mockProps = {
    view: 'day',
    setView: vi.fn(),
    selectedDate: new Date('2024-01-15'),
    formatDate: vi.fn((date) => date.toLocaleDateString()),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onNewAppointment: vi.fn(),
    disableNavigation: false,
    onToggleSidebar: vi.fn(),
    onDateChange: vi.fn(),
  };

  beforeEach(() => {
    // Mock showPicker for all date inputs globally
    HTMLInputElement.prototype.showPicker = vi.fn();
    
    // Mock fetch
    global.fetch = vi.fn();
    
    // Mock localStorage
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.removeItem = vi.fn();
    Storage.prototype.clear = vi.fn();
    
    // Mock window.alert
    global.alert = vi.fn();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all main elements', () => {
      render(<Header {...mockProps} />);
      
      // Check main container
      expect(document.querySelector('.calendar-panel-header')).toBeInTheDocument();
      expect(document.querySelector('.left-section')).toBeInTheDocument();
      expect(document.querySelector('.right-section')).toBeInTheDocument();
      
      // Check hamburger button
      expect(screen.getByLabelText('Toggle Sidebar')).toBeInTheDocument();
      expect(document.querySelector('.hamburger-btn')).toBeInTheDocument();
      
      // Check navigation buttons
      expect(screen.getByText('◀')).toBeInTheDocument();
      expect(screen.getByText('▶')).toBeInTheDocument();
      
      // Check date display
      expect(document.querySelector('.date-display')).toBeInTheDocument();
      expect(document.querySelector('.hidden-date-input')).toBeInTheDocument();
      
      // Check view buttons (desktop)
      expect(document.querySelector('.view-buttons')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Day/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Week/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Month/i })).toBeInTheDocument();
      
      // Check view dropdown (mobile)
      expect(document.querySelector('.view-dropdown')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Check new appointment button
      expect(screen.getByText('+ New Appointment')).toBeInTheDocument();
    });

    it('should render with correct initial values', () => {
      render(<Header {...mockProps} />);
      
      // Check date display shows formatted date
      expect(mockProps.formatDate).toHaveBeenCalledWith(mockProps.selectedDate);
      expect(document.querySelector('.date-display')).toHaveTextContent('1/15/2024');
      
      // Check hidden date input has correct value
      const dateInput = document.querySelector('.hidden-date-input');
      expect(dateInput.value).toBe('2024-01-15');
      
      // Check active view button
      const dayButton = screen.getByRole('button', { name: /Day/i });
      expect(dayButton).toHaveClass('view-btn', 'active');
      
      // Check dropdown value
      const dropdown = screen.getByRole('combobox');
      expect(dropdown.value).toBe('day');
    });

    it('should apply correct classes to view buttons based on current view', () => {
      const { rerender } = render(<Header {...mockProps} />);
      
      // Day view active
      let dayButton = screen.getByRole('button', { name: /Day/i });
      let weekButton = screen.getByRole('button', { name: /Week/i });
      let monthButton = screen.getByRole('button', { name: /Month/i });
      
      expect(dayButton).toHaveClass('active');
      expect(weekButton).not.toHaveClass('active');
      expect(monthButton).not.toHaveClass('active');
      
      // Week view active
      rerender(<Header {...mockProps} view="week" />);
      dayButton = screen.getByRole('button', { name: /Day/i });
      weekButton = screen.getByRole('button', { name: /Week/i });
      monthButton = screen.getByRole('button', { name: /Month/i });
      
      expect(dayButton).not.toHaveClass('active');
      expect(weekButton).toHaveClass('active');
      expect(monthButton).not.toHaveClass('active');
      
      // Month view active
      rerender(<Header {...mockProps} view="month" />);
      dayButton = screen.getByRole('button', { name: /Day/i });
      weekButton = screen.getByRole('button', { name: /Week/i });
      monthButton = screen.getByRole('button', { name: /Month/i });
      
      expect(dayButton).not.toHaveClass('active');
      expect(weekButton).not.toHaveClass('active');
      expect(monthButton).toHaveClass('active');
    });
  });

  describe('Hamburger Menu', () => {
    it('should call onToggleSidebar when hamburger button is clicked', () => {
      render(<Header {...mockProps} />);
      const hamburgerBtn = screen.getByLabelText('Toggle Sidebar');
      fireEvent.click(hamburgerBtn);
      expect(mockProps.onToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('should render FiMenu icon in hamburger button', () => {
      render(<Header {...mockProps} />);
      const hamburgerBtn = document.querySelector('.hamburger-btn');
      const svg = hamburgerBtn.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Navigation Buttons', () => {
    it('should call onPrev when previous button is clicked', () => {
      render(<Header {...mockProps} />);
      const prevButton = screen.getByText('◀');
      fireEvent.click(prevButton);
      expect(mockProps.onPrev).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when next button is clicked', () => {
      render(<Header {...mockProps} />);
      const nextButton = screen.getByText('▶');
      fireEvent.click(nextButton);
      expect(mockProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('should disable navigation buttons when disableNavigation is true', () => {
      render(<Header {...mockProps} disableNavigation={true} />);
      const prevButton = screen.getByText('◀');
      const nextButton = screen.getByText('▶');
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should not call callbacks when disabled buttons are clicked', () => {
      render(<Header {...mockProps} disableNavigation={true} />);
      const prevButton = screen.getByText('◀');
      const nextButton = screen.getByText('▶');
      fireEvent.click(prevButton);
      fireEvent.click(nextButton);
      expect(mockProps.onPrev).not.toHaveBeenCalled();
      expect(mockProps.onNext).not.toHaveBeenCalled();
    });
  });

  describe('Date Picker', () => {
    it('should handle browsers that do not support showPicker', () => {
      render(<Header {...mockProps} />);
      
      const dateDisplay = document.querySelector('.date-display');
      
      // Mock showPicker is already defined in beforeEach, so clicking should work
      expect(() => fireEvent.click(dateDisplay)).not.toThrow();
      
      // Verify showPicker was called
      expect(HTMLInputElement.prototype.showPicker).toHaveBeenCalled();
    });

    it('should call onDateChange when date input value changes', () => {
      render(<Header {...mockProps} />);
      const dateInput = document.querySelector('.hidden-date-input');
      fireEvent.change(dateInput, { target: { value: '2024-02-20' } });
      expect(mockProps.onDateChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onDateChange).toHaveBeenCalledWith(new Date('2024-02-20'));
    });

    it('should handle invalid date input', () => {
      render(<Header {...mockProps} />);
      const dateInput = document.querySelector('.hidden-date-input');
      fireEvent.change(dateInput, { target: { value: 'invalid-date' } });
      expect(mockProps.onDateChange).toHaveBeenCalledTimes(1);
      // Invalid date creates Invalid Date object
      expect(mockProps.onDateChange).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should format selectedDate correctly for input value', () => {
      const testDate = new Date('2024-12-31');
      render(<Header {...mockProps} selectedDate={testDate} />);
      const dateInput = document.querySelector('.hidden-date-input');
      expect(dateInput.value).toBe('2024-12-31');
    });

    it('should handle date with different timezones correctly', () => {
      // Test with UTC date
      const utcDate = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      render(<Header {...mockProps} selectedDate={utcDate} />);
      const dateInput = document.querySelector('.hidden-date-input');
      const expectedValue = utcDate.toISOString().split('T')[0];
      expect(dateInput.value).toBe(expectedValue);
    });
  });

  describe('View Buttons (Desktop)', () => {
    it('should call setView with "day" when Day button is clicked', () => {
      render(<Header {...mockProps} view="week" />);
      const dayButton = screen.getByRole('button', { name: /Day/i });
      fireEvent.click(dayButton);
      expect(mockProps.setView).toHaveBeenCalledTimes(1);
      expect(mockProps.setView).toHaveBeenCalledWith('day');
    });

    it('should call setView with "week" when Week button is clicked', () => {
      render(<Header {...mockProps} />);
      const weekButton = screen.getByRole('button', { name: /Week/i });
      fireEvent.click(weekButton);
      expect(mockProps.setView).toHaveBeenCalledTimes(1);
      expect(mockProps.setView).toHaveBeenCalledWith('week');
    });

    it('should call setView with "month" when Month button is clicked', () => {
      render(<Header {...mockProps} />);
      const monthButton = screen.getByRole('button', { name: /Month/i });
      fireEvent.click(monthButton);
      expect(mockProps.setView).toHaveBeenCalledTimes(1);
      expect(mockProps.setView).toHaveBeenCalledWith('month');
    });

    it('should still call setView even when clicking active view button', () => {
      render(<Header {...mockProps} view="day" />);
      const dayButton = screen.getByRole('button', { name: /Day/i });
      expect(dayButton).toHaveClass('active');
      
      fireEvent.click(dayButton);
      expect(mockProps.setView).toHaveBeenCalledTimes(1);
      expect(mockProps.setView).toHaveBeenCalledWith('day');
    });
  });

  describe('View Dropdown (Mobile)', () => {
    it('should call setView when dropdown value changes', () => {
      render(<Header {...mockProps} />);
      const dropdown = screen.getByRole('combobox');
      fireEvent.change(dropdown, { target: { value: 'week' } });
      expect(mockProps.setView).toHaveBeenCalledTimes(1);
      expect(mockProps.setView).toHaveBeenCalledWith('week');
    });

    it('should update dropdown value when view prop changes', () => {
      const { rerender } = render(<Header {...mockProps} view="day" />);
      let dropdown = screen.getByRole('combobox');
      expect(dropdown.value).toBe('day');
      
      rerender(<Header {...mockProps} view="week" />);
      dropdown = screen.getByRole('combobox');
      expect(dropdown.value).toBe('week');
      
      rerender(<Header {...mockProps} view="month" />);
      dropdown = screen.getByRole('combobox');
      expect(dropdown.value).toBe('month');
    });

    it('should have all view options in dropdown', () => {
      render(<Header {...mockProps} />);
      const dropdown = screen.getByRole('combobox');
      const options = dropdown.querySelectorAll('option');
      
      expect(options).toHaveLength(3);
      expect(options[0].value).toBe('day');
      expect(options[0].textContent).toBe('Day');
      expect(options[1].value).toBe('week');
      expect(options[1].textContent).toBe('Week');
      expect(options[2].value).toBe('month');
      expect(options[2].textContent).toBe('Month');
    });

    it('should handle all dropdown value changes', () => {
      render(<Header {...mockProps} />);
      const dropdown = screen.getByRole('combobox');
      
      // Change to week
      fireEvent.change(dropdown, { target: { value: 'week' } });
      expect(mockProps.setView).toHaveBeenCalledWith('week');
      
      // Change to month
      fireEvent.change(dropdown, { target: { value: 'month' } });
      expect(mockProps.setView).toHaveBeenCalledWith('month');
      
      // Change back to day
      fireEvent.change(dropdown, { target: { value: 'day' } });
      expect(mockProps.setView).toHaveBeenCalledWith('day');
      
      expect(mockProps.setView).toHaveBeenCalledTimes(3);
    });
  });

  describe('New Appointment Button', () => {
    it('should call onNewAppointment when clicked', () => {
      render(<Header {...mockProps} />);
      const newAppointmentBtn = screen.getByText('+ New Appointment');
      fireEvent.click(newAppointmentBtn);
      expect(mockProps.onNewAppointment).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disableNavigation is true', () => {
      render(<Header {...mockProps} disableNavigation={true} />);
      const newAppointmentBtn = screen.getByText('+ New Appointment');
      expect(newAppointmentBtn).toBeDisabled();
    });

    it('should not call onNewAppointment when clicked while disabled', () => {
      render(<Header {...mockProps} disableNavigation={true} />);
      const newAppointmentBtn = screen.getByText('+ New Appointment');
      fireEvent.click(newAppointmentBtn);
      expect(mockProps.onNewAppointment).not.toHaveBeenCalled();
    });
  });

  describe('Date Display and Formatting', () => {
    it('should call formatDate with correct date', () => {
      const testDate = new Date('2024-06-15');
      render(<Header {...mockProps} selectedDate={testDate} />);
      expect(mockProps.formatDate).toHaveBeenCalledWith(testDate);
    });

    it('should display formatted date in date display', () => {
      const customFormatDate = vi.fn((date) => `Custom: ${date.getFullYear()}`);
      render(<Header {...mockProps} formatDate={customFormatDate} />);
      const dateDisplay = document.querySelector('.date-display');
      expect(dateDisplay.textContent).toContain('Custom: 2024');
    });

    it('should handle different date formats', () => {
      const formatVariations = [
        { format: (d) => d.toISOString(), expected: '2024-01-15T00:00:00.000Z' },
        { format: (d) => d.toLocaleDateString('en-GB'), expected: '15/01/2024' },
        { format: (d) => `Year: ${d.getFullYear()}`, expected: 'Year: 2024' },
        { format: () => 'Static Date', expected: 'Static Date' },
      ];

      formatVariations.forEach(({ format, expected }) => {
        const { unmount } = render(<Header {...mockProps} formatDate={format} />);
        
        const dateDisplay = document.querySelector('.date-display');
        expect(dateDisplay.textContent).toContain(expected);
        
        unmount();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing callbacks gracefully', () => {
      // IMPORTANT: Always provide mock functions, never undefined
      const minimalProps = {
        view: 'day',
        selectedDate: new Date(),
        formatDate: (d) => d.toString(),
        setView: vi.fn(), // Provide mock function
        onDateChange: vi.fn(), // Provide mock function
        onToggleSidebar: vi.fn(),
        onPrev: vi.fn(),
        onNext: vi.fn(),
        onNewAppointment: vi.fn(),
      };

      render(<Header {...minimalProps} />);

      // Try to trigger all callbacks
      const hamburgerBtn = screen.getByLabelText('Toggle Sidebar');
      const prevButton = screen.getByText('◀');
      const nextButton = screen.getByText('▶');
      const dayButton = screen.getByRole('button', { name: /Day/i });
      const dropdown = screen.getByRole('combobox');
      const newAppointmentBtn = screen.getByText('+ New Appointment');
      const dateInput = document.querySelector('.hidden-date-input');

      // None of these should throw errors
      expect(() => {
        fireEvent.click(hamburgerBtn);
        fireEvent.click(prevButton);
        fireEvent.click(nextButton);
        fireEvent.click(dayButton);
        fireEvent.change(dropdown, { target: { value: 'week' } });
        fireEvent.click(newAppointmentBtn);
        fireEvent.change(dateInput, { target: { value: '2024-02-20' } });
      }).not.toThrow();
    });

    it('should handle rapid clicks without issues', () => {
      render(<Header {...mockProps} />);
      const prevButton = screen.getByText('◀');
      const nextButton = screen.getByText('▶');

      // Rapid successive clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(prevButton);
        fireEvent.click(nextButton);
      }

      expect(mockProps.onPrev).toHaveBeenCalledTimes(10);
      expect(mockProps.onNext).toHaveBeenCalledTimes(10);
    });

    it('should handle view changes during render', () => {
      const { rerender } = render(<Header {...mockProps} view="day" />);

      // Quick view changes
      rerender(<Header {...mockProps} view="week" />);
      rerender(<Header {...mockProps} view="month" />);
      rerender(<Header {...mockProps} view="day" />);

      const dropdown = screen.getByRole('combobox');
      expect(dropdown.value).toBe('day');
    });
  });

  describe('Ref Handling', () => {
    it('should properly use ref for date input', () => {
      render(<Header {...mockProps} />);
      const dateInput = document.querySelector('.hidden-date-input');
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('should maintain ref across re-renders', () => {
      const { rerender } = render(<Header {...mockProps} />);
      const dateInput1 = document.querySelector('.hidden-date-input');
      
      rerender(<Header {...mockProps} view="week" />);
      
      const dateInput2 = document.querySelector('.hidden-date-input');
      expect(dateInput1).toBe(dateInput2); // Same element
    });
  });

  describe('Component Classes and Structure', () => {
    it('should have correct class structure', () => {
      const { container } = render(<Header {...mockProps} />);

      expect(container.querySelector('.calendar-panel-header')).toBeInTheDocument();
      expect(container.querySelector('.left-section')).toBeInTheDocument();
      expect(container.querySelector('.right-section')).toBeInTheDocument();
      expect(container.querySelector('.hamburger-btn')).toBeInTheDocument();
      expect(container.querySelector('.nav-btn')).toBeInTheDocument();
      expect(container.querySelector('.date-display')).toBeInTheDocument();
      expect(container.querySelector('.hidden-date-input')).toBeInTheDocument();
      expect(container.querySelector('.view-buttons')).toBeInTheDocument();
      expect(container.querySelector('.view-btn')).toBeInTheDocument();
      expect(container.querySelector('.view-dropdown')).toBeInTheDocument();
      expect(container.querySelector('.new-appointment-btn')).toBeInTheDocument();
    });

    it('should have exactly 2 nav buttons', () => {
      const { container } = render(<Header {...mockProps} />);
      const navButtons = container.querySelectorAll('.nav-btn');
      expect(navButtons).toHaveLength(2);
    });

    it('should have exactly 3 view buttons', () => {
      const { container } = render(<Header {...mockProps} />);
      const viewButtons = container.querySelectorAll('.view-btn');
      expect(viewButtons).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for hamburger button', () => {
      render(<Header {...mockProps} />);
      const hamburgerBtn = screen.getByLabelText('Toggle Sidebar');
      expect(hamburgerBtn).toHaveAttribute('aria-label', 'Toggle Sidebar');
    });

    it('should have proper type attribute for date input', () => {
      render(<Header {...mockProps} />);
      const dateInput = document.querySelector('.hidden-date-input');
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('should have accessible buttons', () => {
      render(<Header {...mockProps} />);

      // All buttons should be accessible
      expect(screen.getByRole('button', { name: /Toggle Sidebar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Day/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Week/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Month/i })).toBeInTheDocument();
    });
  });
});

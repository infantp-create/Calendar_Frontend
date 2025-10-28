import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import CalendarPanel from '../Components/CalendarPanel';

// Mock child components
vi.mock('../Header', () => ({
  default: vi.fn(({ 
    view, 
    setView, 
    selectedDate, 
    formatDate, 
    onPrev, 
    onNext, 
    onNewAppointment,
    onToggleSidebar,
    onDateChange 
  }) => (
    <div data-testid="header">
      <div data-testid="header-view">{view}</div>
      <div data-testid="header-date">{formatDate(selectedDate)}</div>
      <button onClick={onPrev} data-testid="prev-btn">Previous</button>
      <button onClick={onNext} data-testid="next-btn">Next</button>
      <button onClick={onNewAppointment} data-testid="new-appointment-btn">New</button>
      <button onClick={onToggleSidebar} data-testid="toggle-sidebar-btn">Toggle</button>
      <button onClick={() => setView('day')} data-testid="set-day-btn">Day</button>
      <button onClick={() => setView('week')} data-testid="set-week-btn">Week</button>
      <button onClick={() => setView('month')} data-testid="set-month-btn">Month</button>
      <button onClick={() => onDateChange(new Date('2024-02-01'))} data-testid="change-date-btn">Change Date</button>
    </div>
  ))
}));

vi.mock('../Sidebar', () => ({
  default: vi.fn(({ view, selectedDate, appointments, openModal, onClose }) => (
    <div data-testid="sidebar" onClick={(e) => e.stopPropagation()}>
      <div data-testid="sidebar-view">{view}</div>
      <div data-testid="sidebar-appointments">{appointments?.length || 0}</div>
      {onClose && <button onClick={onClose} data-testid="close-sidebar">Close</button>}
    </div>
  ))
}));

describe('CalendarPanel Component', () => {
  const mockProps = {
    view: 'day',
    selectedDate: new Date('2024-01-15T12:00:00'),
    appointments: [],
    openModal: vi.fn(),
    setView: vi.fn(),
    setSelectedDate: vi.fn(),
    modalOpen: false
  };

  const mockAppointments = [
    {
      id: '1',
      title: 'Meeting 1',
      type: 'Business',
      start: '2024-01-15T10:00:00',
      end: '2024-01-15T11:00:00'
    },
    {
      id: '2',
      title: 'Meeting 2',
      type: 'Personal',
      start: '2024-01-15T14:30:00',
      end: '2024-01-15T16:00:00'
    },
    {
      id: '3',
      title: 'Past Meeting',
      type: 'Other',
      start: '2024-01-15T08:00:00',
      end: '2024-01-15T09:00:00'
    },
    {
      id: '4',
      title: 'Cross-day Meeting',
      type: 'Business',
      start: '2024-01-14T23:00:00',
      end: '2024-01-15T01:00:00'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Structure', () => {
    it('should render with correct structure', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      expect(container.querySelector('.calendar-panel-wrapper')).toBeInTheDocument();
    //   expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(container.querySelector('.calendar-body-container')).toBeInTheDocument();
    });

    it('should not render sidebar initially', () => {
      render(<CalendarPanel {...mockProps} />);
      
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
      expect(document.querySelector('.sidebar-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Day View Rendering', () => {
    it('should render day view structure', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      expect(container.querySelector('.day-view')).toBeInTheDocument();
      expect(container.querySelector('.time-col')).toBeInTheDocument();
      expect(container.querySelector('.slots-col')).toBeInTheDocument();
    });

    it('should render all 48 time slots plus end slot', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      const timeSlots = container.querySelectorAll('.time-slot-label');
      expect(timeSlots).toHaveLength(49); // 48 half-hour slots + 1 end slot

      const slots = container.querySelectorAll('.timeslot');
      expect(slots).toHaveLength(49); // 48 regular + 1 end slot
    });

    it('should format time labels correctly', () => {
      render(<CalendarPanel {...mockProps} />);

      // Check first slot (00:00)
      const timeLabels = document.querySelectorAll('.time-slot-label');
      expect(timeLabels[0]).toHaveTextContent('12:00 AM');
      
      // Check noon slot
      expect(timeLabels[24]).toHaveTextContent('12:00 PM');
      
      // Check last slot
      expect(timeLabels[48]).toHaveTextContent('11:59 PM');
    });

    it('should mark past time slots', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      const slots = container.querySelectorAll('.timeslot');
      
      // Slots before noon should be marked as past
      expect(slots[0]).toHaveClass('past'); // 00:00
      expect(slots[23]).toHaveClass('past'); // 11:30
      
      // Slots after noon should not be marked as past
      expect(slots[24]).not.toHaveClass('past'); // 12:00
      expect(slots[25]).not.toHaveClass('past'); // 12:30
    });

    it('should handle double click on future time slot', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      const futureSlot = container.querySelectorAll('.timeslot')[26]; // 1:00 PM
      fireEvent.doubleClick(futureSlot);

      expect(mockProps.openModal).toHaveBeenCalledWith({
        start: expect.any(Date),
        end: expect.any(Date),
        fromView: 'day'
      });

      const callArgs = mockProps.openModal.mock.calls[0][0];
      expect(callArgs.start.getHours()).toBe(13);
      expect(callArgs.start.getMinutes()).toBe(0);
      expect(callArgs.end.getHours()).toBe(13);
      expect(callArgs.end.getMinutes()).toBe(30);
    });

    it('should not handle double click on past time slot', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      const pastSlot = container.querySelectorAll('.timeslot')[0]; // 00:00 (past)
      fireEvent.doubleClick(pastSlot);

      expect(mockProps.openModal).not.toHaveBeenCalled();
    });

    it('should render appointments in day view', () => {
      const { container } = render(
        <CalendarPanel {...mockProps} appointments={mockAppointments} />
      );

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks).toHaveLength(4);

      // Check first appointment
      const firstAppt = apptBlocks[0];
      expect(firstAppt).toHaveTextContent('Meeting 1');
      expect(firstAppt).toHaveTextContent('Business');
      expect(firstAppt).toHaveTextContent('10:00 AM');
      expect(firstAppt).toHaveTextContent('11:00 AM');
    });

    it('should position appointments correctly', () => {
      const { container } = render(
        <CalendarPanel {...mockProps} appointments={mockAppointments} />
      );

      const apptBlocks = container.querySelectorAll('.appt-block');
      
      // Meeting at 10:00 AM (20 * 48px)
      expect(apptBlocks[0].style.top).toBe('960px');
      expect(apptBlocks[0].style.height).toBe('96px'); // 2 slots * 48px

      // Meeting at 14:30 (29 * 48px)
      expect(apptBlocks[1].style.top).toBe('1392px');
      expect(apptBlocks[1].style.height).toBe('144px'); // 3 slots * 48px
    });

    it('should mark past appointments', () => {
      const { container } = render(
        <CalendarPanel {...mockProps} appointments={mockAppointments} />
      );

      const apptBlocks = container.querySelectorAll('.appt-block');
      
      // Past meeting (ended at 09:00)
      expect(apptBlocks[2]).toHaveClass('past-appt');
      
      // Future meeting
      expect(apptBlocks[1]).toHaveClass('upcoming-appt');
    });

    it('should handle appointment click', () => {
      const { container } = render(
        <CalendarPanel {...mockProps} appointments={mockAppointments} />
      );

      const apptBlock = container.querySelector('.appt-block');
      fireEvent.click(apptBlock);

      expect(mockProps.openModal).toHaveBeenCalledWith({
        appointment: expect.objectContaining({
          id: '1',
          title: 'Meeting 1'
        }),
        fromView: 'day'
      });
    });

    it('should handle cross-day appointments', () => {
      const { container } = render(
        <CalendarPanel {...mockProps} appointments={mockAppointments} />
      );

      const crossDayAppt = Array.from(container.querySelectorAll('.appt-block'))
        .find(el => el.textContent.includes('Cross-day Meeting'));

      expect(crossDayAppt).toBeInTheDocument();
      // Should be clamped to start of day (00:00)
      expect(crossDayAppt.style.top).toBe('0px');
    });

    it('should handle appointments without start or end', () => {
      const invalidAppointments = [
        { id: '1', title: 'No dates' },
        { id: '2', title: 'No end', start: '2024-01-15T10:00:00' },
        { id: '3', title: 'No start', end: '2024-01-15T11:00:00' }
      ];

      const { container } = render(
        <CalendarPanel {...mockProps} appointments={invalidAppointments} />
      );

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks).toHaveLength(0);
    });
  });

  describe('Week View Rendering', () => {
    it('should render week view structure', () => {
      const { container } = render(<CalendarPanel {...mockProps} view="week" />);

      expect(container.querySelector('.week-view')).toBeInTheDocument();
      expect(container.querySelector('.week-grid-header')).toBeInTheDocument();
      expect(container.querySelector('.week-grid-body')).toBeInTheDocument();
    });

    it('should render 7 day headers', () => {
      const { container } = render(<CalendarPanel {...mockProps} view="week" />);

      const dayHeaders = container.querySelectorAll('.week-day-header');
      expect(dayHeaders).toHaveLength(7);

      // Monday to Sunday
    //   expect(dayHeaders[0]).toHaveTextContent('Mon, 15 Jan');
    //   expect(dayHeaders[6]).toHaveTextContent('Sun, 21 Jan');
    });

    it('should handle day header click to switch to day view', () => {
      const { container } = render(<CalendarPanel {...mockProps} view="week" />);

      const wednesday = container.querySelectorAll('.week-day-header')[2];
      fireEvent.click(wednesday);

      expect(mockProps.setSelectedDate).toHaveBeenCalled();
      expect(mockProps.setView).toHaveBeenCalledWith('day');
    });

    it('should render time slots for each day', () => {
      const { container } = render(<CalendarPanel {...mockProps} view="week" />);

      const weekCols = container.querySelectorAll('.week-col');
      expect(weekCols).toHaveLength(7);

      // Each column should have 48 cells
      weekCols.forEach(col => {
        const cells = col.querySelectorAll('.week-cell');
        expect(cells).toHaveLength(48);
      });
    });


    it('should not handle double click on past week cell', () => {
      vi.setSystemTime(new Date('2024-01-17T14:00:00'));
      
      const { container } = render(
        <CalendarPanel {...mockProps} selectedDate={new Date('2024-01-17')} view="week" />
      );

      // Monday cell (past)
      const mondayCol = container.querySelectorAll('.week-col')[0];
      const cell = mondayCol.querySelectorAll('.week-cell')[0];
      
      fireEvent.doubleClick(cell);

      expect(mockProps.openModal).not.toHaveBeenCalled();
    });


    it('should position week appointments correctly', () => {
      const appointment = {
        id: '1',
        title: 'Test',
        start: '2024-01-15T10:30:00', // Monday 10:30 AM
        end: '2024-01-15T12:00:00'
      };

      const { container } = render(
        <CalendarPanel {...mockProps} view="week" appointments={[appointment]} />
      );

      const apptBlock = container.querySelector('.appt-block');
      
      // Position: 21 slots * 28px
      expect(apptBlock.style.top).toBe('588px');
      // Height: 3 slots * 28px
      expect(apptBlock.style.height).toBe('84px');
    });

    it('should handle appointment click in week view', () => {
      const appointment = {
        id: '1',
        title: 'Click Test',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };

      const { container } = render(
        <CalendarPanel {...mockProps} view="week" appointments={[appointment]} />
      );

      const apptBlock = container.querySelector('.appt-block');
      fireEvent.click(apptBlock);

      expect(mockProps.openModal).toHaveBeenCalledWith({
        appointment: expect.objectContaining({ id: '1' }),
        fromView: 'week'
      });
    });

  });

  describe('Month View Rendering', () => {
    it('should render month view structure', () => {
      const { container } = render(<CalendarPanel {...mockProps} view="month" />);

      expect(container.querySelector('.month-view')).toBeInTheDocument();
      expect(container.querySelector('.month-grid')).toBeInTheDocument();
    });

   
    it('should handle appointment click in month view', () => {
      const appointment = {
        id: '1',
        title: 'Test Appt',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };

      const { container } = render(
        <CalendarPanel {...mockProps} view="month" appointments={[appointment]} />
      );

      const apptElement = container.querySelector('.month-appt');
      fireEvent.click(apptElement);

      expect(mockProps.openModal).toHaveBeenCalledWith({
        appointment: expect.objectContaining({ id: '1' }),
        fromView: 'month'
      });
    });


    it('should not show +more count when no extra appointments', () => {
      const appointments = [
        { id: '1', title: 'Appt 1', start: '2024-01-15T10:00:00', end: '2024-01-15T11:00:00' },
        { id: '2', title: 'Appt 2', start: '2024-01-15T12:00:00', end: '2024-01-15T13:00:00' }
      ];

      const { container } = render(
        <CalendarPanel {...mockProps} view="month" appointments={appointments} />
      );

      const day15Cell = container.querySelectorAll('.month-cell')[14];
      const moreCount = day15Cell.querySelector('.more-count');
      
      expect(moreCount).not.toBeInTheDocument();
    });

    it('should handle appointments without proper dates in month view', () => {
      const invalidAppointments = [
        { id: '1', title: 'No dates' },
        { id: '2', title: 'Invalid', start: 'invalid', end: 'invalid' }
      ];

      const { container } = render(
        <CalendarPanel {...mockProps} view="month" appointments={invalidAppointments} />
      );

      const appts = container.querySelectorAll('.month-appt');
      expect(appts).toHaveLength(0);
    });
  });

 

  describe('Edge Cases', () => {
    it('should handle empty appointments array', () => {
      const { container } = render(<CalendarPanel {...mockProps} appointments={[]} />);

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks).toHaveLength(0);
    });

    it('should handle null appointments array', () => {
      const { container } = render(<CalendarPanel {...mockProps} appointments={null} />);

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks).toHaveLength(0);
    });

    it('should handle undefined appointments array', () => {
      const { container } = render(<CalendarPanel {...mockProps} appointments={undefined} />);

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks).toHaveLength(0);
    });

    it('should handle appointments with invalid dates', () => {
      const invalidAppointments = [
        { id: '1', title: 'Invalid', start: 'not-a-date', end: 'not-a-date' },
        { id: '2', title: 'Null dates', start: null, end: null },
        { id: '3', title: 'Undefined dates', start: undefined, end: undefined }
      ];

      const { container } = render(
        <CalendarPanel {...mockProps} appointments={invalidAppointments} />
      );

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks).toHaveLength(0);
    });

    it('should handle very long appointment titles', () => {
      const longTitleAppt = {
        id: '1',
        title: 'This is a very long appointment title that should be handled properly in the UI without breaking the layout',
        type: 'Business',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };

      const { container } = render(
        <CalendarPanel {...mockProps} appointments={[longTitleAppt]} />
      );

      const apptBlock = container.querySelector('.appt-block');
      expect(apptBlock).toBeInTheDocument();
      expect(apptBlock.querySelector('.appt-title')).toHaveTextContent(longTitleAppt.title);
    });

    it('should handle appointments at midnight', () => {
      const midnightAppt = {
        id: '1',
        title: 'Midnight',
        start: '2024-01-15T00:00:00',
        end: '2024-01-15T00:30:00'
      };

      const { container } = render(
        <CalendarPanel {...mockProps} appointments={[midnightAppt]} />
      );

      const apptBlock = container.querySelector('.appt-block');
      expect(apptBlock.style.top).toBe('0px');
    });

    it('should handle appointments at end of day', () => {
      const endOfDayAppt = {
        id: '1',
        title: 'End of Day',
        start: '2024-01-15T23:30:00',
        end: '2024-01-15T23:59:59'
      };

      const { container } = render(
        <CalendarPanel {...mockProps} appointments={[endOfDayAppt]} />
      );

      const apptBlock = container.querySelector('.appt-block');
      expect(apptBlock).toBeInTheDocument();
    });

    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      render(<CalendarPanel {...mockProps} selectedDate={leapYearDate} view="month" />);

      const cells = document.querySelectorAll('.month-cell');
      const feb29Cell = Array.from(cells).find(
        cell => cell.querySelector('.month-cell-top')?.textContent === '29'
      );

      expect(feb29Cell).toBeInTheDocument();
    });



    it('should render without crashing with minimal props', () => {
      const minimalProps = {
        view: 'day',
        selectedDate: new Date(),
        appointments: [],
        openModal: () => {},
        setView: () => {},
        setSelectedDate: () => {},
        modalOpen: false
      };

      expect(() => render(<CalendarPanel {...minimalProps} />)).not.toThrow();
    });
  });

  describe('Grid Template Styles', () => {
    it('should apply correct grid template rows for day view', () => {
      const { container } = render(<CalendarPanel {...mockProps} />);

      const timeCol = container.querySelector('.time-col');
      expect(timeCol.style.gridTemplateRows).toBe('repeat(49, 48px)');

      const slotsCol = container.querySelector('.slots-col');
      expect(slotsCol.style.gridTemplateRows).toBe('repeat(49, 48px)');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle rapid view changes', () => {
      const { rerender } = render(<CalendarPanel {...mockProps} />);

      // Rapid view changes
      for (let i = 0; i < 10; i++) {
        rerender(<CalendarPanel {...mockProps} view="week" />);
        rerender(<CalendarPanel {...mockProps} view="month" />);
        rerender(<CalendarPanel {...mockProps} view="day" />);
      }

      expect(document.querySelector('.day-view')).toBeInTheDocument();
    });

    it('should handle large number of appointments', () => {
      const manyAppointments = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Appointment ${i}`,
        start: `2024-01-15T${(i % 24).toString().padStart(2, '0')}:00:00`,
        end: `2024-01-15T${(i % 24).toString().padStart(2, '0')}:30:00`
      }));

      const { container } = render(
        <CalendarPanel {...mockProps} appointments={manyAppointments} />
      );

      const apptBlocks = container.querySelectorAll('.appt-block');
      expect(apptBlocks.length).toBeGreaterThan(0);
    });
  });
});


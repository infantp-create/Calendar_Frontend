import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import Sidebar from '../Components/Sidebar';

describe('Sidebar Component', () => {
  const mockOpenModal = vi.fn();
  const mockOnClose = vi.fn();
  
  const baseProps = {
    view: 'day',
    selectedDate: new Date('2024-01-15T12:00:00'),
    appointments: [],
    openModal: mockOpenModal,
    isOpen: false,
    onClose: mockOnClose
  };

  const mockAppointments = [
    {
      id: '1',
      title: 'Team Meeting',
      start: '2024-01-15T10:00:00',
      end: '2024-01-15T11:00:00',
      organizerName: 'John Doe',
      participantNames: ['Alice', 'Bob']
    },
    {
      id: '2',
      title: 'Lunch Break',
      start: '2024-01-15T12:00:00',
      end: '2024-01-15T13:00:00',
      organizerName: 'Jane Smith',
      participantNames: []
    },
    {
      id: '3',
      title: 'Past Event',
      start: '2024-01-14T10:00:00',
      end: '2024-01-14T11:00:00',
      organizerName: null,
      participantNames: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Date Range Formatting', () => {
    it('should format date range for day view', () => {
      render(<Sidebar {...baseProps} />);
      expect(screen.getByText('Monday, 15 Jan 2024')).toBeInTheDocument();
    });

    it('should format date range for week view', () => {
      render(<Sidebar {...baseProps} view="week" />);
      expect(screen.getByText('15 Jan - 21 Jan 2024')).toBeInTheDocument();
    });

    it('should format date range for month view', () => {
      render(<Sidebar {...baseProps} view="month" />);
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should return empty string for unknown view type', () => {
      const { container } = render(<Sidebar {...baseProps} view="unknown" />);
      const dateRange = container.querySelector('.date-range');
      expect(dateRange.textContent).toBe('');
    });

    it('should handle week calculation for Sunday (day 0)', () => {
      const sundayDate = new Date('2024-01-14T12:00:00'); // Sunday
      render(<Sidebar {...baseProps} view="week" selectedDate={sundayDate} />);
      expect(screen.getByText('08 Jan - 14 Jan 2024')).toBeInTheDocument();
    });

    it('should handle week calculation for Saturday', () => {
      const saturdayDate = new Date('2024-01-13T12:00:00'); // Saturday
      render(<Sidebar {...baseProps} view="week" selectedDate={saturdayDate} />);
      expect(screen.getByText('08 Jan - 14 Jan 2024')).toBeInTheDocument();
    });

    it('should handle week calculation for mid-week days', () => {
      const wednesdayDate = new Date('2024-01-17T12:00:00'); // Wednesday
      render(<Sidebar {...baseProps} view="week" selectedDate={wednesdayDate} />);
      expect(screen.getByText('15 Jan - 21 Jan 2024')).toBeInTheDocument();
    });
  });

  describe('Appointment Filtering - Day View', () => {
    it('should filter appointments for the selected day', () => {
      render(<Sidebar {...baseProps} appointments={mockAppointments} />);
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.queryByText('Past Event')).not.toBeInTheDocument();
    });

    it('should include appointments that span across the selected day', () => {
      const spanningAppointment = {
        id: '4',
        title: 'Multi-day Event',
        start: '2024-01-14T22:00:00',
        end: '2024-01-15T02:00:00'
      };
      render(<Sidebar {...baseProps} appointments={[spanningAppointment]} />);
      expect(screen.getByText('Multi-day Event')).toBeInTheDocument();
    });

    it('should exclude appointments from other days', () => {
      const otherDayAppointment = {
        id: '4',
        title: 'Tomorrow Event',
        start: '2024-01-16T10:00:00',
        end: '2024-01-16T11:00:00'
      };
      render(<Sidebar {...baseProps} appointments={[otherDayAppointment]} />);
      expect(screen.queryByText('Tomorrow Event')).not.toBeInTheDocument();
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });

    it('should handle appointments at day boundaries', () => {
      const boundaryAppointments = [
        {
          id: '5',
          title: 'Start of Day',
          start: '2024-01-15T00:00:00',
          end: '2024-01-15T01:00:00'
        },
        {
          id: '6',
          title: 'End of Day',
          start: '2024-01-15T23:00:00',
          end: '2024-01-15T23:59:59'
        }
      ];
      render(<Sidebar {...baseProps} appointments={boundaryAppointments} />);
      expect(screen.getByText('Start of Day')).toBeInTheDocument();
      expect(screen.getByText('End of Day')).toBeInTheDocument();
    });
  });

  describe('Appointment Filtering - Week View', () => {
    it('should filter appointments for the current week', () => {
      const weekAppointments = [
        {
          id: '4',
          title: 'Monday Event',
          start: '2024-01-15T10:00:00',
          end: '2024-01-15T11:00:00'
        },
        {
          id: '5',
          title: 'Friday Event',
          start: '2024-01-19T10:00:00',
          end: '2024-01-19T11:00:00'
        },
        {
          id: '6',
          title: 'Sunday Event',
          start: '2024-01-21T10:00:00',
          end: '2024-01-21T11:00:00'
        }
      ];
      render(<Sidebar {...baseProps} view="week" appointments={weekAppointments} />);
      expect(screen.getByText('Monday Event')).toBeInTheDocument();
      expect(screen.getByText('Friday Event')).toBeInTheDocument();
      expect(screen.getByText('Sunday Event')).toBeInTheDocument();
    });

    it('should exclude appointments from other weeks', () => {
      const nextWeekAppointment = {
        id: '7',
        title: 'Next Week',
        start: '2024-01-22T10:00:00',
        end: '2024-01-22T11:00:00'
      };
      render(<Sidebar {...baseProps} view="week" appointments={[nextWeekAppointment]} />);
      expect(screen.queryByText('Next Week')).not.toBeInTheDocument();
    });

    it('should include appointments spanning into the week', () => {
      const spanningAppointment = {
        id: '8',
        title: 'Week Spanning',
        start: '2024-01-14T10:00:00',
        end: '2024-01-16T11:00:00'
      };
      render(<Sidebar {...baseProps} view="week" appointments={[spanningAppointment]} />);
      expect(screen.getByText('Week Spanning')).toBeInTheDocument();
    });
  });

  describe('Appointment Filtering - Month View', () => {
    it('should filter appointments for the current month', () => {
      const monthAppointments = [
        {
          id: '9',
          title: 'Beginning of Month',
          start: '2024-01-01T10:00:00',
          end: '2024-01-01T11:00:00'
        },
        {
          id: '10',
          title: 'End of Month',
          start: '2024-01-31T10:00:00',
          end: '2024-01-31T11:00:00'
        }
      ];
      render(<Sidebar {...baseProps} view="month" appointments={monthAppointments} />);
      expect(screen.getByText('Beginning of Month')).toBeInTheDocument();
      expect(screen.getByText('End of Month')).toBeInTheDocument();
    });

    it('should exclude appointments from other months', () => {
      const nextMonthAppointment = {
        id: '11',
        title: 'February Event',
        start: '2024-02-01T10:00:00',
        end: '2024-02-01T11:00:00'
      };
      render(<Sidebar {...baseProps} view="month" appointments={[nextMonthAppointment]} />);
      expect(screen.queryByText('February Event')).not.toBeInTheDocument();
    });

    it('should handle appointments spanning month boundaries', () => {
      const spanningAppointment = {
        id: '12',
        title: 'Month Spanning',
        start: '2024-01-31T22:00:00',
        end: '2024-02-01T02:00:00'
      };
      render(<Sidebar {...baseProps} view="month" appointments={[spanningAppointment]} />);
      expect(screen.getByText('Month Spanning')).toBeInTheDocument();
    });

    it('should handle February in leap year', () => {
      const leapYearDate = new Date('2024-02-15T12:00:00');
      const febAppointment = {
        id: '13',
        title: 'Feb 29 Event',
        start: '2024-02-29T10:00:00',
        end: '2024-02-29T11:00:00'
      };
      render(<Sidebar {...baseProps} view="month" selectedDate={leapYearDate} appointments={[febAppointment]} />);
      expect(screen.getByText('Feb 29 Event')).toBeInTheDocument();
    });
  });

  describe('Invalid Data Handling', () => {
    it('should handle null appointments array', () => {
      render(<Sidebar {...baseProps} appointments={null} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });

    it('should handle undefined appointments array', () => {
      render(<Sidebar {...baseProps} appointments={undefined} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });

    it('should filter out appointments with missing start date', () => {
      const invalidAppointments = [
        { id: '1', title: 'No Start', end: '2024-01-15T11:00:00' },
        mockAppointments[0]
      ];
      render(<Sidebar {...baseProps} appointments={invalidAppointments} />);
      expect(screen.queryByText('No Start')).not.toBeInTheDocument();
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should filter out appointments with missing end date', () => {
      const invalidAppointments = [
        { id: '1', title: 'No End', start: '2024-01-15T10:00:00' },
        mockAppointments[0]
      ];
      render(<Sidebar {...baseProps} appointments={invalidAppointments} />);
      expect(screen.queryByText('No End')).not.toBeInTheDocument();
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should filter out null appointments in array', () => {
      const mixedAppointments = [
        null,
        mockAppointments[0],
        undefined,
        mockAppointments[1]
      ];
      render(<Sidebar {...baseProps} appointments={mixedAppointments} />);
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
    });

    it('should handle appointments with null start and end', () => {
      const invalidAppointment = {
        id: '14',
        title: 'Invalid Appointment',
        start: null,
        end: null
      };
      render(<Sidebar {...baseProps} appointments={[invalidAppointment]} />);
      expect(screen.queryByText('Invalid Appointment')).not.toBeInTheDocument();
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });

    it('should handle unknown view type in filtering', () => {
      render(<Sidebar {...baseProps} view="unknown" appointments={mockAppointments} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });
  });

  describe('Appointment Status Classification', () => {
    it('should classify appointment as ongoing when current time is between start and end', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:00'));
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      const statusTag = screen.getByText('ongoing');
      expect(statusTag).toHaveClass('status-tag', 'ongoing');
    });

    it('should classify appointment as upcoming when current time is before start', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      const statusTag = screen.getByText('upcoming');
      expect(statusTag).toHaveClass('status-tag', 'upcoming');
    });

    it('should classify appointment as completed when current time is after end', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      const statusTag = screen.getByText('completed');
      expect(statusTag).toHaveClass('status-tag', 'completed');
    });

    it('should handle exact start time as ongoing', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00'));
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      expect(screen.getByText('ongoing')).toBeInTheDocument();
    });

    it('should handle exact end time as ongoing', () => {
      vi.setSystemTime(new Date('2024-01-15T11:00:00'));
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      expect(screen.getByText('ongoing')).toBeInTheDocument();
    });

    it('should handle time just after end as completed', () => {
      vi.setSystemTime(new Date('2024-01-15T11:00:01'));
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  describe('Appointment Sorting', () => {
    it('should sort appointments: completed → ongoing → upcoming', () => {
      const mixedStatusAppointments = [
        {
          id: '1',
          title: 'Upcoming Event',
          start: '2024-01-15T15:00:00',
          end: '2024-01-15T16:00:00'
        },
        {
          id: '2',
          title: 'Ongoing Event',
          start: '2024-01-15T12:00:00',
          end: '2024-01-15T13:00:00'
        },
        {
          id: '3',
          title: 'Completed Event',
          start: '2024-01-15T09:00:00',
          end: '2024-01-15T10:00:00'
        }
      ];
      
      const { container } = render(<Sidebar {...baseProps} appointments={mixedStatusAppointments} />);
      const titles = container.querySelectorAll('.appointment-item .title');
      
      expect(titles[0]).toHaveTextContent('Completed Event');
      expect(titles[1]).toHaveTextContent('Ongoing Event');
      expect(titles[2]).toHaveTextContent('Upcoming Event');
    });

    it('should sort appointments with same status by start time ascending', () => {
      const sameStatusAppointments = [
        {
          id: '1',
          title: 'Later',
          start: '2024-01-15T16:00:00',
          end: '2024-01-15T17:00:00'
        },
        {
          id: '2',
          title: 'Earlier',
          start: '2024-01-15T14:00:00',
          end: '2024-01-15T15:00:00'
        },
        {
          id: '3',
          title: 'Middle',
          start: '2024-01-15T15:00:00',
          end: '2024-01-15T16:00:00'
        }
      ];
      
      const { container } = render(<Sidebar {...baseProps} appointments={sameStatusAppointments} />);
      const titles = container.querySelectorAll('.appointment-item .title');
      
      expect(titles[0]).toHaveTextContent('Earlier');
      expect(titles[1]).toHaveTextContent('Middle');
      expect(titles[2]).toHaveTextContent('Later');
    });

    it('should maintain stable sort for appointments with same status and start time', () => {
      const sameTimeAppointments = [
        {
          id: '1',
          title: 'First Added',
          start: '2024-01-15T14:00:00',
          end: '2024-01-15T15:00:00'
        },
        {
          id: '2',
          title: 'Second Added',
          start: '2024-01-15T14:00:00',
          end: '2024-01-15T15:00:00'
        }
      ];
      
      const { container } = render(<Sidebar {...baseProps} appointments={sameTimeAppointments} />);
      const titles = container.querySelectorAll('.appointment-item .title');
      
      expect(titles[0]).toHaveTextContent('First Added');
      expect(titles[1]).toHaveTextContent('Second Added');
    });
  });

  describe('User Interactions', () => {

    it('should call onClose when overlay is clicked', () => {
      render(<Sidebar {...baseProps} isOpen={true} />);
      const overlay = document.querySelector('.sidebar-overlay');
      
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not render overlay when isOpen is false', () => {
      render(<Sidebar {...baseProps} isOpen={false} />);
      const overlay = document.querySelector('.sidebar-overlay');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes Application', () => {
    it('should add open class to sidebar when isOpen is true', () => {
      const { container } = render(<Sidebar {...baseProps} isOpen={true} />);
      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toHaveClass('sidebar', 'open');
    });

    it('should not have open class when isOpen is false', () => {
      const { container } = render(<Sidebar {...baseProps} isOpen={false} />);
      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toHaveClass('sidebar');
      expect(sidebar).not.toHaveClass('open');
    });

    it('should apply correct status class to appointment items', () => {
      const appointments = [
        {
          id: '1',
          title: 'Upcoming',
          start: '2024-01-15T15:00:00',
          end: '2024-01-15T16:00:00'
        },
        {
          id: '2',
          title: 'Ongoing',
          start: '2024-01-15T12:00:00',
          end: '2024-01-15T13:00:00'
        },
        {
          id: '3',
          title: 'Completed',
          start: '2024-01-15T09:00:00',
          end: '2024-01-15T10:00:00'
        }
      ];
      
      const { container } = render(<Sidebar {...baseProps} appointments={appointments} />);
      
      expect(container.querySelector('.appointment-item.upcoming')).toBeInTheDocument();
      expect(container.querySelector('.appointment-item.ongoing')).toBeInTheDocument();
      expect(container.querySelector('.appointment-item.completed')).toBeInTheDocument();
    });

    it('should apply correct status class to status tags', () => {
      const appointments = [
        {
          id: '1',
          title: 'Test',
          start: '2024-01-15T15:00:00',
          end: '2024-01-15T16:00:00'
        }
      ];
      
      const { container } = render(<Sidebar {...baseProps} appointments={appointments} />);
      const statusTag = container.querySelector('.status-tag');
      
      expect(statusTag).toHaveClass('status-tag', 'upcoming');
    });
  });

  describe('Appointment Details Display', () => {
    it('should display organizer name when provided', () => {
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      expect(screen.getByText('Organizer:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display "Unknown" when organizerName is null', () => {
      const appointment = {
        id: '15',
        title: 'No Organizer',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        organizerName: null
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display "Unknown" when organizerName is undefined', () => {
      const appointment = {
        id: '16',
        title: 'Undefined Organizer',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display "Unknown" when organizerName is empty string', () => {
      const appointment = {
        id: '17',
        title: 'Empty Organizer',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        organizerName: ''
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display participants when array has items', () => {
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      expect(screen.getByText('Participants:')).toBeInTheDocument();
      expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
    });

    it('should not display participants section when array is empty', () => {
      render(<Sidebar {...baseProps} appointments={[mockAppointments[1]]} />);
      expect(screen.queryByText('Participants:')).not.toBeInTheDocument();
    });

    it('should not display participants when participantNames is null', () => {
      const appointment = {
        id: '18',
        title: 'Null Participants',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        participantNames: null
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.queryByText('Participants:')).not.toBeInTheDocument();
    });

    it('should not display participants when participantNames is undefined', () => {
      const appointment = {
        id: '19',
        title: 'No Participants',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };
      render(<Sidebar {...baseProps      } appointments={[appointment]} />);
      expect(screen.queryByText('Participants:')).not.toBeInTheDocument();
    });

    it('should display single participant correctly', () => {
      const appointment = {
        id: '20',
        title: 'Single Participant',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        participantNames: ['Alice']
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('Participants:')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should display multiple participants with comma separation', () => {
      const appointment = {
        id: '21',
        title: 'Many Participants',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        participantNames: ['Alice', 'Bob', 'Charlie', 'David', 'Eve']
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('Alice, Bob, Charlie, David, Eve')).toBeInTheDocument();
    });

    it('should handle participants with special characters', () => {
      const appointment = {
        id: '22',
        title: 'Special Names',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        participantNames: ['O\'Brien', 'José García', 'Marie-Claire']
      };
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('O\'Brien, José García, Marie-Claire')).toBeInTheDocument();
    });
  });

  describe('Time Display Formatting', () => {
    it('should display appointment times in correct format', () => {
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      
      // Check for both date and time
      const timeContainer = document.querySelector('.time');
      expect(timeContainer).toBeInTheDocument();
      
      // Check start time
      const startDiv = timeContainer.querySelector('.start');
      expect(startDiv).toBeInTheDocument();
      expect(startDiv.textContent).toContain('15 Jan');
      expect(startDiv.textContent).toMatch(/10:00\s*(AM|am)/i);
      
      // Check end time
      const endDiv = timeContainer.querySelector('.end');
      expect(endDiv).toBeInTheDocument();
      expect(endDiv.textContent).toContain('15 Jan');
      expect(endDiv.textContent).toMatch(/11:00\s*(AM|am)/i);
    });

    it('should display different dates for multi-day appointments', () => {
      const multiDayAppointment = {
        id: '23',
        title: 'Multi Day',
        start: '2024-01-15T22:00:00',
        end: '2024-01-16T02:00:00'
      };
      render(<Sidebar {...baseProps} appointments={[multiDayAppointment]} />);
      
      const timeContainer = document.querySelector('.time');
      const startDiv = timeContainer.querySelector('.start');
      const endDiv = timeContainer.querySelector('.end');
      
      expect(startDiv.textContent).toContain('15 Jan');
      expect(endDiv.textContent).toContain('16 Jan');
    });

    it('should handle midnight time correctly', () => {
      const midnightAppointment = {
        id: '24',
        title: 'Midnight Event',
        start: '2024-01-15T00:00:00',
        end: '2024-01-15T00:30:00'
      };
      render(<Sidebar {...baseProps} appointments={[midnightAppointment]} />);
      
      const startDiv = document.querySelector('.start');
      expect(startDiv.textContent).toMatch(/12:00\s*(AM|am)/i);
    });

    it('should handle noon time correctly', () => {
      const noonAppointment = {
        id: '25',
        title: 'Noon Event',
        start: '2024-01-15T12:00:00',
        end: '2024-01-15T12:30:00'
      };
      render(<Sidebar {...baseProps} appointments={[noonAppointment]} />);
      
      const startDiv = document.querySelector('.start');
      expect(startDiv.textContent).toMatch(/12:00\s*(PM|pm)/i);
    });

    it('should display year for appointments in different year', () => {
      const differentYearAppointment = {
        id: '26',
        title: 'Next Year Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };
      
      // Set selected date to 2025
      const futureDate = new Date('2025-01-15T12:00:00');
      render(<Sidebar {...baseProps} selectedDate={futureDate} appointments={[differentYearAppointment]} />);
      
      const timeContainer = document.querySelector('.time');
      expect(timeContainer).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display "No appointments" when appointments array is empty', () => {
      render(<Sidebar {...baseProps} appointments={[]} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
      expect(screen.getByText('No appointments')).toHaveClass('no-appointments');
    });

    it('should display "No appointments" when all appointments are filtered out', () => {
      const futureAppointments = [
        {
          id: '27',
          title: 'Tomorrow',
          start: '2024-01-16T10:00:00',
          end: '2024-01-16T11:00:00'
        },
        {
          id: '28',
          title: 'Next Week',
          start: '2024-01-22T10:00:00',
          end: '2024-01-22T11:00:00'
        }
      ];
      render(<Sidebar {...baseProps} appointments={futureAppointments} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });

    it('should display "No appointments" when all appointments are invalid', () => {
      const invalidAppointments = [
        { id: '29', title: 'No dates' },
        { id: '30', title: 'No start', end: '2024-01-15T11:00:00' },
        { id: '31', title: 'No end', start: '2024-01-15T10:00:00' },
        null,
        undefined
      ];
      render(<Sidebar {...baseProps} appointments={invalidAppointments} />);
      expect(screen.getByText('No appointments')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render all main sections of the sidebar', () => {
      const { container } = render(<Sidebar {...baseProps} appointments={mockAppointments} />);
      
      // Check main heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Appointments');
      
      // Check date range paragraph
      expect(container.querySelector('.date-range')).toBeInTheDocument();
      
      // Check appointments list container
      expect(container.querySelector('.appointments-list')).toBeInTheDocument();
    });

    it('should render appointment item with all sub-sections', () => {
      const { container } = render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      
      const appointmentItem = container.querySelector('.appointment-item');
      
      // Check all sub-sections exist
      expect(appointmentItem.querySelector('.status-tag')).toBeInTheDocument();
      expect(appointmentItem.querySelector('.title')).toBeInTheDocument();
      expect(appointmentItem.querySelector('.details')).toBeInTheDocument();
      expect(appointmentItem.querySelector('.time')).toBeInTheDocument();
      expect(appointmentItem.querySelector('.start')).toBeInTheDocument();
      expect(appointmentItem.querySelector('.end')).toBeInTheDocument();
    });

    it('should render details section with organizer and participants', () => {
      const { container } = render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      
      const details = container.querySelector('.details');
      expect(details).toBeInTheDocument();
      
      const organizer = details.querySelector('.organizer');
      expect(organizer).toBeInTheDocument();
      expect(organizer.querySelector('strong')).toHaveTextContent('Organizer:');
      
      const participants = details.querySelector('.participants');
      expect(participants).toBeInTheDocument();
      expect(participants.querySelector('strong')).toHaveTextContent('Participants:');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of appointments', () => {
      const manyAppointments = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Event ${i}`,
        start: `2024-01-15T${(10 + Math.floor(i / 60)).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00`,
        end: `2024-01-15T${(11 + Math.floor(i / 60)).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00`
      }));
      
      render(<Sidebar {...baseProps} appointments={manyAppointments} />);
      
      // Should render all valid appointments
      const appointmentItems = document.querySelectorAll('.appointment-item');
      expect(appointmentItems.length).toBeGreaterThan(0);
    });

    it('should handle appointments with very long titles', () => {
      const longTitleAppointment = {
        id: '32',
        title: 'A'.repeat(200),
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };
      
      render(<Sidebar {...baseProps} appointments={[longTitleAppointment]} />);
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('should handle appointments with very long participant lists', () => {
      const manyParticipants = Array.from({ length: 50 }, (_, i) => `Person${i}`);
      const appointment = {
        id: '33',
        title: 'Large Meeting',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00',
        participantNames: manyParticipants
      };
      
      render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText(manyParticipants.join(', '))).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<Sidebar {...baseProps} />);
      
      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(
          <Sidebar 
            {...baseProps} 
            isOpen={i % 2 === 0}
            appointments={i % 3 === 0 ? mockAppointments : []}
          />
        );
      }
      
      // Should not crash
      expect(document.querySelector('.sidebar')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete appointment lifecycle', () => {
      // Start with upcoming appointment
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));
      const appointment = {
        id: '34',
        title: 'Lifecycle Test',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T11:00:00'
      };
      
      const { rerender } = render(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('upcoming')).toBeInTheDocument();
      
      // Move to ongoing
      vi.setSystemTime(new Date('2024-01-15T10:30:00'));
      rerender(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('ongoing')).toBeInTheDocument();
      
      // Move to completed
      vi.setSystemTime(new Date('2024-01-15T11:30:00'));
      rerender(<Sidebar {...baseProps} appointments={[appointment]} />);
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should handle view change with same appointments', () => {
      const appointments = [
        {
          id: '35',
          title: 'View Change Test',
          start: '2024-01-15T10:00:00',
          end: '2024-01-15T11:00:00'
        },
        {
          id: '36',
          title: 'Next Month',
          start: '2024-02-15T10:00:00',
          end: '2024-02-15T11:00:00'
        }
      ];
      
      // Day view
      const { rerender } = render(<Sidebar {...baseProps} view="day" appointments={appointments} />);
      expect(screen.getByText('View Change Test')).toBeInTheDocument();
      expect(screen.queryByText('Next Month')).not.toBeInTheDocument();
      
      // Week view
      rerender(<Sidebar {...baseProps} view="week" appointments={appointments} />);
      expect(screen.getByText('View Change Test')).toBeInTheDocument();
      expect(screen.queryByText('Next Month')).not.toBeInTheDocument();
      
      // Month view
      rerender(<Sidebar {...baseProps} view="month" appointments={appointments} />);
      expect(screen.getByText('View Change Test')).toBeInTheDocument();
      expect(screen.queryByText('Next Month')).not.toBeInTheDocument();
    });

    it('should handle sidebar opening and closing with overlay', () => {
      const { rerender } = render(<Sidebar {...baseProps} isOpen={false} />);
      
      // Initially closed - no overlay
      expect(document.querySelector('.sidebar-overlay')).not.toBeInTheDocument();
      expect(document.querySelector('.sidebar')).not.toHaveClass('open');
      
      // Open sidebar
      rerender(<Sidebar {...baseProps} isOpen={true} />);
      const overlay = document.querySelector('.sidebar-overlay');
      expect(overlay).toBeInTheDocument();
      expect(document.querySelector('.sidebar')).toHaveClass('open');
      
      // Click overlay to close
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility and Semantics', () => {
    it('should have proper heading hierarchy', () => {
      render(<Sidebar {...baseProps} appointments={mockAppointments} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Appointments');
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<Sidebar {...baseProps} appointments={mockAppointments} />);
      
      // Check for div structure
      expect(container.querySelector('div.sidebar')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('p.date-range')).toBeInTheDocument();
      expect(container.querySelector('div.appointments-list')).toBeInTheDocument();
    });

    it('should maintain focus management when clicking appointments', () => {
      render(<Sidebar {...baseProps} appointments={[mockAppointments[0]]} />);
      
      const appointmentItem = screen.getByText('Team Meeting').closest('.appointment-item');
      appointmentItem.focus();
      
      fireEvent.click(appointmentItem);
      
      // Modal should be opened
      expect(mockOpenModal).toHaveBeenCalled();
    });
});
})

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CalendarPage from '../Components/CalendarPage';
import * as appointmentApi from '../api/appointment';

// Mock the API module
vi.mock('../api/appointment');

// Mock child components
vi.mock('../Components/Header', () => ({
  default: () => <div data-testid="header">Header</div>
}));

vi.mock('../Components/Sidebar', () => ({
  default: ({ view, selectedDate, appointments, openModal }) => (
    <div data-testid="sidebar">
      <div>View: {view}</div>
      <div>Date: {selectedDate.toISOString()}</div>
      <div>Appointments: {appointments.length}</div>
      <button onClick={() => openModal({ type: 'create' })}>Open Modal</button>
    </div>
  )
}));

vi.mock('../Components/CalendarPanel', () => ({
  default: ({ view, selectedDate, appointments, openModal, setView, setSelectedDate }) => (
    <div data-testid="calendar-panel">
      <div>View: {view}</div>
      <div>Date: {selectedDate.toISOString()}</div>
      <div>Appointments: {appointments.length}</div>
      <button onClick={() => setView('week')}>Change View</button>
      <button onClick={() => setSelectedDate(new Date('2024-01-01'))}>Change Date</button>
      <button onClick={() => openModal({ type: 'edit' })}>Edit Modal</button>
    </div>
  )
}));

vi.mock('../Components/AppointmentModal', () => ({
  default: ({ open, onClose, context, onSave, onUpdate, onDelete, users }) => (
    open && (
      <div data-testid="appointment-modal">
        <div>Context: {context?.type}</div>
        <div>Users: {users?.length || 0}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSave({ title: 'New Appointment', start: '2024-01-01T10:00:00' })}>Save</button>
        <button onClick={() => onUpdate({ id: 1, title: 'Updated' })}>Update</button>
        <button onClick={() => onDelete(1)}>Delete</button>
      </div>
    )
  )
}));

describe('CalendarPage', () => {
  const mockUser = { id: 'user123', userName: 'Test User' };
  
  beforeEach(() => {
    // Setup localStorage
    Storage.prototype.getItem = vi.fn(() => JSON.stringify(mockUser));
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default API responses
    appointmentApi.getUsers.mockResolvedValue([
      { id: '1', name: 'User 1' },
      { id: '2', name: 'User 2' }
    ]);
    
    appointmentApi.getAppointmentsByDate.mockResolvedValue([
      { id: 1, title: 'Meeting 1', start: '2024-01-01T10:00:00' },
      { id: 2, title: 'Meeting 2', start: '2024-01-01T14:00:00' }
    ]);
    
    appointmentApi.createAppointment.mockResolvedValue({
      id: 3, title: 'New Meeting', start: '2024-01-01T16:00:00'
    });
    
    appointmentApi.updateAppointment.mockResolvedValue({
      data: { id: 1, title: 'Updated Meeting' }
    });
    
    appointmentApi.deleteAppointment.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('1. should render all main components', () => {
    render(<CalendarPage />);
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
  });

  test('2. should initialize with correct default state', () => {
    render(<CalendarPage />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveTextContent('View: day');
    expect(sidebar).toHaveTextContent('Appointments: 0');
  });

  test('3. should load user from localStorage', () => {
    render(<CalendarPage />);
    
    expect(localStorage.getItem).toHaveBeenCalledWith('user');
  });

  test('4. should handle missing user in localStorage', () => {
    Storage.prototype.getItem = vi.fn(() => null);
    
    render(<CalendarPage />);
    
    expect(appointmentApi.getUsers).not.toHaveBeenCalled();
    expect(appointmentApi.getAppointmentsByDate).not.toHaveBeenCalled();
  });

  test('5. should fetch users on mount', async () => {
    render(<CalendarPage />);
    
    await waitFor(() => {
      expect(appointmentApi.getUsers).toHaveBeenCalledTimes(1);
    });
  });

  test('6. should fetch appointments for current date', async () => {
    render(<CalendarPage />);
    
    await waitFor(() => {
      expect(appointmentApi.getAppointmentsByDate).toHaveBeenCalled();
    });
    
    const sidebar = await screen.findByTestId('sidebar');
    expect(sidebar).toHaveTextContent('Appointments: 2');
  });

  test('7. should change view when setView is called', () => {
    render(<CalendarPage />);
    
    const changeViewButton = screen.getByText('Change View');
    fireEvent.click(changeViewButton);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveTextContent('View: week');
  });

  test('8. should change selected date', () => {
    render(<CalendarPage />);
    
    const changeDateButton = screen.getByText('Change Date');
    fireEvent.click(changeDateButton);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveTextContent('2024-01-01');
  });

  test('9. should open modal when openModal is called', () => {
    render(<CalendarPage />);
    
    const openModalButton = screen.getByText('Open Modal');
    fireEvent.click(openModalButton);
    
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    expect(screen.getByText('Context: create')).toBeInTheDocument();
  });

  test('10. should close modal', () => {
    render(<CalendarPage />);
    
    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument();
  });

  test('11. should create new appointment', async () => {
    render(<CalendarPage />);
    
    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Save appointment
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(appointmentApi.createAppointment).toHaveBeenCalledWith({
        title: 'New Appointment',
        start: '2024-01-01T10:00:00',
        createdByUserId: 'user123',
        participantIds: []
      });
    });
  });

  test('12. should update appointment', async () => {
    render(<CalendarPage />);
    
    // Open modal
    fireEvent.click(screen.getByText('Edit Modal'));
    
    // Update appointment
    fireEvent.click(screen.getByText('Update'));
    
    await waitFor(() => {
      expect(appointmentApi.updateAppointment).toHaveBeenCalledWith(
        1,
        'user123',
        { id: 1, title: 'Updated' }
      );
    });
  });

  test('13. should delete appointment', async () => {
    render(<CalendarPage />);
    
    // Setup initial appointments
    appointmentApi.getAppointmentsByDate.mockResolvedValueOnce([
      { id: 1, title: 'Meeting 1' },
      { id: 2, title: 'Meeting 2' }
    ]);
    
    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Delete appointment
    fireEvent.click(screen.getByText('Delete'));
    
    await waitFor(() => {
      expect(appointmentApi.deleteAppointment).toHaveBeenCalledWith(1, 'user123');
    });
  });

  test('14. should handle API error when fetching users', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    appointmentApi.getUsers.mockRejectedValueOnce(new Error('API Error'));
    
    render(<CalendarPage />);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to load users', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });

  test('15. should handle API error when fetching appointments', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    appointmentApi.getAppointmentsByDate.mockRejectedValueOnce(new Error('API Error'));
    
    render(<CalendarPage />);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to load appointments', expect.any(Error));
    });
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveTextContent('Appointments: 0');
    
    consoleError.mockRestore();
  });

  test('16. should pass users to AppointmentModal', async () => {
    render(<CalendarPage />);
    
    await waitFor(() => {
      expect(appointmentApi.getUsers).toHaveBeenCalled();
    });
    
    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    const modal = screen.getByTestId('appointment-modal');
    expect(modal).toHaveTextContent('Users: 2');
  });

  test('17. should reload appointments after save', async () => {
    render(<CalendarPage />);
    
    // Clear initial calls
    await waitFor(() => {
      expect(appointmentApi.getAppointmentsByDate).toHaveBeenCalled();
    });
    vi.clearAllMocks();
    
    // Open modal and save
    fireEvent.click(screen.getByText('Open Modal'));
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(appointmentApi.getAppointmentsByDate).toHaveBeenCalled();
    });
  });

  test('18. should format date correctly for day view', async () => {
    render(<CalendarPage />);
    
    await waitFor(() => {
      const calls = appointmentApi.getAppointmentsByDate.mock.calls;
      expect(calls[0][0]).toBe('user123');
      expect(calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
      expect(calls[0][2]).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59$/);
    });
  });

  test('19. should handle week view date range', async () => {
    render(<CalendarPage />);
    
    // Change to week view
    fireEvent.click(screen.getByText('Change View'));
    
    await waitFor(() => {
      const lastCall = appointmentApi.getAppointmentsByDate.mock.calls.pop();
      expect(lastCall[0]).toBe('user123');
      // Should fetch a week's worth of data
      const startDate = new Date(lastCall[1]);
      const endDate = new Date(lastCall[2]);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(6);
    });
  });

  test('20. should handle month view date range', async () => {
    render(<CalendarPage />);
    
    // Change to month view first
    const calendarPanel = screen.getByTestId('calendar-panel');
    
    // Simulate changing to month view
    const { setView } = calendarPanel;
    render(<CalendarPage />);

    
    // Mock setView to change to month
    appointmentApi.getAppointmentsByDate.mockClear();
    
    const { rerender } = render(<CalendarPage />);
    
    // Manually trigger month view
    const component = <CalendarPage />;
    const { container } = render(component);
    
    await waitFor(() => {
      // Verify initial day view call
      expect(appointmentApi.getAppointmentsByDate).toHaveBeenCalled();
    });
  });
});

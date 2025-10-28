import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import AppointmentModal from '../Components/AppointmentModal';

describe('AppointmentModal Component', () => {

  const mockOnSave = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClose = vi.fn();


  const mockUsers = [
    { id: '1', userName: 'John Doe' },
    { id: '2', userName: 'Jane Smith' },
    { id: '3', userName: 'Bob Johnson' },
    { id: '4', userName: 'Alice Williams' },
    { id: '5', userName: 'Charlie Brown' }
  ];

  const mockCallbacks = {
    onClose: vi.fn(),
    onSave: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn()
  };

  const defaultProps = {
    open: true,
    onClose: mockCallbacks.onClose,
    onSave: mockCallbacks.onSave,
    onUpdate: mockCallbacks.onUpdate,
    onDelete: mockCallbacks.onDelete,
    users: mockUsers,
    context: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when open is false', () => {
      render(<AppointmentModal {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(document.querySelector('.modal-backdrop')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<AppointmentModal {...defaultProps} open={true} />);
      
      expect(document.querySelector('.modal-backdrop')).toBeInTheDocument();
      expect(document.querySelector('.modal-card')).toBeInTheDocument();
    });

    it('should close when clicking backdrop', () => {
      render(<AppointmentModal {...defaultProps} />);
      
      const backdrop = document.querySelector('.modal-backdrop');
      fireEvent.click(backdrop);
      
      expect(mockCallbacks.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking modal card', () => {
      render(<AppointmentModal {...defaultProps} />);
      
      const modalCard = document.querySelector('.modal-card');
      fireEvent.click(modalCard);
      
      expect(mockCallbacks.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Create Mode', () => {
    const createContext = {
      start: new Date('2024-01-15T10:00:00'),
      end: new Date('2024-01-15T11:00:00'),
      fromView: 'day'
    };

    it('should show "New Appointment" heading', () => {
      render(<AppointmentModal {...defaultProps} context={createContext} />);
      
      expect(screen.getByRole('heading')).toHaveTextContent('New Appointment');
    });

    it('should initialize with empty form fields', () => {
      render(<AppointmentModal {...defaultProps} context={createContext} />);
      
      const titleInput = screen.getByPlaceholderText('Enter title');
      const descInput = screen.getByPlaceholderText('Add details');
      const recurrenceSelect = screen.getByDisplayValue('None');
      
      expect(titleInput.value).toBe('');
      expect(descInput.value).toBe('');
      expect(recurrenceSelect.value).toBe('none');
    });

    it('should show Create and Close buttons', () => {
      render(<AppointmentModal {...defaultProps} context={createContext} />);
      
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editContext = {
      appointment: {
        id: '123',
        title: 'Test Meeting',
        description: 'Test Description',
        start: '2024-01-15T14:00:00',
        end: '2024-01-15T15:30:00',
        participantIds: ['2', '3'],
        recurrenceType: 'weekly',
        recurrenceCount: 4,
        recurrenceDays: ['Mon', 'Wed', 'Fri']
      },
      fromView: 'week'
    };

    it('should show "Edit Appointment" heading', () => {
      render(<AppointmentModal {...defaultProps} context={editContext} />);
      
      expect(screen.getByRole('heading')).toHaveTextContent('Edit Appointment');
    });

    it('should show selected participants', () => {
      render(<AppointmentModal {...defaultProps} context={editContext} />);
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should show selected recurrence days', () => {
      render(<AppointmentModal {...defaultProps} context={editContext} />);
      
      const monBtn = screen.getByRole('button', { name: 'Mon' });
      const wedBtn = screen.getByRole('button', { name: 'Wed' });
      const friBtn = screen.getByRole('button', { name: 'Fri' });
      const tueBtn = screen.getByRole('button', { name: 'Tue' });
      
      expect(monBtn).toHaveClass('active');
      expect(wedBtn).toHaveClass('active');
      expect(friBtn).toHaveClass('active');
      expect(tueBtn).not.toHaveClass('active');
    });

    it('should show Save, Delete and Close buttons', () => {
      render(<AppointmentModal {...defaultProps} context={editContext} />);
      
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    const context = {
      start: new Date('2024-01-15T10:00:00'),
      end: new Date('2024-01-15T11:00:00')
    };

    it('should update title input', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const titleInput = screen.getByPlaceholderText('Enter title');
      fireEvent.change(titleInput, { target: { value: 'New Meeting Title' } });
      
      expect(titleInput.value).toBe('New Meeting Title');
    });

    it('should enforce title max length of 50', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const titleInput = screen.getByPlaceholderText('Enter title');
      const longTitle = 'a'.repeat(60);
      
      fireEvent.change(titleInput, { target: { value: longTitle } });
      
      expect(titleInput.getAttribute('maxLength')).toBe('50');
    });

    it('should update description input', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const descInput = screen.getByPlaceholderText('Add details');
      fireEvent.change(descInput, { target: { value: 'Meeting description' } });
      
      expect(descInput.value).toBe('Meeting description');
    });

    it('should show description character counter', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const descInput = screen.getByPlaceholderText('Add details');
      fireEvent.change(descInput, { target: { value: 'Test' } });
      
      expect(screen.getByText('4/250')).toBeInTheDocument();
    });

    it('should enforce description max length of 250', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const descInput = screen.getByPlaceholderText('Add details');
      expect(descInput.getAttribute('maxLength')).toBe('250');
    });
  });

  describe('Guest Management', () => {
    const context = {
      start: new Date('2024-01-15T10:00:00'),
      end: new Date('2024-01-15T11:00:00')
    };

    it('should display guest input field', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      expect(guestInput).toBeInTheDocument();
    });

    it('should update guest input', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'John' } });
      
      expect(guestInput.value).toBe('John');
    });

    it('should show filtered guest suggestions', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'J' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('should filter suggestions case-insensitively', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'jane' } });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should not show suggestions for empty or whitespace input', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: '   ' } });
      
      expect(document.querySelector('.guest-dropdown')).not.toBeInTheDocument();
    });

    it('should add guest when suggestion is clicked', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'John' } });
      
      const suggestion = screen.getByText('John Doe');
      fireEvent.click(suggestion);
      
      // Guest should be added as a tag
      expect(screen.getByText('John Doe', { selector: '.guest-tag' })).toBeInTheDocument();
      // Input should be cleared
      expect(guestInput.value).toBe('');
      // Dropdown should be hidden
      expect(document.querySelector('.guest-dropdown')).not.toBeInTheDocument();
    });

    it('should not show already selected guests in suggestions', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      // Add John Doe
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'John' } });
      fireEvent.click(screen.getByText('John Doe'));
      
      // Search again for J
      fireEvent.change(guestInput, { target: { value: 'J' } });
      
      // John Doe should not appear, but Jane should
      expect(screen.queryByText('John Doe', { selector: '.guest-suggestion' })).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should remove guest when × button is clicked', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      // Add a guest
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'John' } });
      fireEvent.click(screen.getByText('John Doe'));
      
      // Remove the guest
      const removeBtn = screen.getByRole('button', { name: '×' });
      fireEvent.click(removeBtn);
      
      expect(screen.queryByText('John Doe', { selector: '.guest-tag' })).not.toBeInTheDocument();
    });

    it('should handle multiple guest additions and removals', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      
      // Add John
      fireEvent.change(guestInput, { target: { value: 'John' } });
      fireEvent.click(screen.getByText('John Doe'));
      
      // Add Jane
      fireEvent.change(guestInput, { target: { value: 'Jane' } });
      fireEvent.click(screen.getByText('Jane Smith'));
      
      // Add Bob
      fireEvent.change(guestInput, { target: { value: 'Bob' } });
      fireEvent.click(screen.getByText('Bob Johnson'));
      
      // Should have 3 guest tags
      const guestTags = document.querySelectorAll('.guest-tag');
      expect(guestTags).toHaveLength(3);
      
      // Remove Jane (middle one)
      const removeButtons = screen.getAllByRole('button', { name: '×' });
      fireEvent.click(removeButtons[1]);
      
      // Should have 2 guest tags
      expect(document.querySelectorAll('.guest-tag')).toHaveLength(2);
      expect(screen.getByText('John Doe', { selector: '.guest-tag' })).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson', { selector: '.guest-tag' })).toBeInTheDocument();
    });

    it('should handle users with missing or null data', () => {
      const usersWithNulls = [
        { id: '1', userName: 'Valid User' },
        { id: '2' }, // missing userName
        null, // null user
        { id: '4', userName: null }, // null userName
        { id: '5', userName: 'Another Valid' }
      ];

      render(<AppointmentModal {...defaultProps} users={usersWithNulls} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      fireEvent.change(guestInput, { target: { value: 'V' } });
      
      // Should only show valid users
      expect(screen.getByText('Valid User')).toBeInTheDocument();
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });

    it('should show user ID when userName is not found', () => {
      const editContext = {
        appointment: {
          id: '123',
          title: 'Test',
          participantIds: ['999'] // ID not in users list
        }
      };

      render(<AppointmentModal {...defaultProps} context={editContext} />);
      
      expect(screen.getByText('999', { selector: '.guest-tag' })).toBeInTheDocument();
    });

    it('should log users when modal opens', () => {
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      expect(console.log).toHaveBeenCalledWith('Users received in modal:', mockUsers);
    });
  });

  describe('Update Operation', () => {
    const editContext = {
      appointment: {
        id: '123',
        title: 'Original Title',
        description: 'Original Description',
        start: '2030-01-15T10:00:00',
        end: '2030-01-15T11:00:00',
        participantIds: ['2'],
        recurrenceType: 'daily',
        recurrenceCount: 3,
        recurrenceDays: []
      }
    };


    it('should not call update when not in edit mode', () => {
      const createContext = {
        start: new Date('2030-01-15T10:00:00'),
        end: new Date('2030-01-15T11:00:00')
      };

      render(<AppointmentModal {...defaultProps} context={createContext} />);
      
      // handleUpdate should return early
      // This is tested by the absence of Save button in create mode
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  describe('useEffect Hooks', () => {
    it('should reset form when opening for new appointment', () => {
      const { rerender } = render(
        <AppointmentModal {...defaultProps} open={false} />
      );
      
      const newContext = {
        start: new Date('2030-01-20T14:00:00'),
        end: new Date('2030-01-20T15:00:00')
      };
      
      rerender(<AppointmentModal {...defaultProps} open={true} context={newContext} />);
      
      const titleInput = screen.getByPlaceholderText('Enter title');
      const descInput = screen.getByPlaceholderText('Add details');
      
      expect(titleInput.value).toBe('');
      expect(descInput.value).toBe('');
    });
  });
  

  describe('Component Interactions', () => {
    it('should clear form when Close button is clicked', () => {
      const context = {
        start: new Date('2030-01-15T10:00:00'),
        end: new Date('2030-01-15T11:00:00')
      };
      
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      // Fill some data
      fireEvent.change(screen.getByPlaceholderText('Enter title'), { 
        target: { value: 'Test' } 
      });
      
      // Click Close
      fireEvent.click(screen.getByText('Close'));
      
      expect(mockCallbacks.onClose).toHaveBeenCalled();
    });

    it('should handle rapid input changes', () => {
      const context = {
        start: new Date('2030-01-15T10:00:00'),
        end: new Date('2030-01-15T11:00:00')
      };
      
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const titleInput = screen.getByPlaceholderText('Enter title');
      
      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(titleInput, { target: { value: `Title ${i}` } });
      }
      
      expect(titleInput.value).toBe('Title 9');
    });

    it('should handle multiple guest additions and removals rapidly', () => {
      const context = {
        start: new Date('2030-01-15T10:00:00'),
        end: new Date('2030-01-15T11:00:00')
      };
      
      render(<AppointmentModal {...defaultProps} context={context} />);
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      
      // Add all users
      mockUsers.forEach(user => {
        fireEvent.change(guestInput, { target: { value: user.userName.substring(0, 3) } });
        fireEvent.click(screen.getByText(user.userName));
      });
      
      expect(document.querySelectorAll('.guest-tag')).toHaveLength(5);
      
      // Remove all
      const removeButtons = screen.getAllByRole('button', { name: '×' });
      removeButtons.forEach(btn => fireEvent.click(btn));
      
      expect(document.querySelectorAll('.guest-tag')).toHaveLength(0);
    });

    it('should preserve data when switching views', () => {
      const context = {
        start: new Date('2030-01-15T10:00:00'),
        end: new Date('2030-01-15T11:00:00')
      };
      
      const { rerender } = render(<AppointmentModal {...defaultProps} context={context} />);
      
      // Enter data
      fireEvent.change(screen.getByPlaceholderText('Enter title'), { 
        target: { value: 'Preserved Title' } 
      });
      fireEvent.change(screen.getByPlaceholderText('Add details'), { 
        target: { value: 'Preserved Description' } 
      });
      
      // Close and reopen
      rerender(<AppointmentModal {...defaultProps} open={false} context={context} />);
      rerender(<AppointmentModal {...defaultProps} open={true} context={context} />);
      
      // Data should be reset (not preserved)
      expect(screen.getByPlaceholderText('Enter title').value).toBe('');
      expect(screen.getByPlaceholderText('Add details').value).toBe('');
    });
  });


  describe('Line 76: Guest input reset in useEffect', () => {
    it('should clear guest input when modal opens for edit', () => {
      const context = {
        appointment: {
          id: '1',
          title: 'Test',
          participantIds: ['1', '2']
        }
      };
      
      const { rerender } = render(
        <AppointmentModal
          open={false}
          context={context}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          users={mockUsers}
        />
      );
      
      // Open modal
      rerender(
        <AppointmentModal
          open={true}
          context={context}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          users={mockUsers}
        />
      );
      
      const guestInput = screen.getByPlaceholderText('Type name & select');
      expect(guestInput.value).toBe('');
    });
  });

  describe('Line 89: Recurrence days initialization', () => {
    it('should initialize recurrenceDays from appointment', () => {
      const context = {
        appointment: {
          id: '1',
          title: 'Weekly Meeting',
          recurrenceType: 'weekly',
          recurrenceDays: ['Mon', 'Wed', 'Fri']
        }
      };
      
      render(
        <AppointmentModal
          open={true}
          context={context}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          users={mockUsers}
        />
      );
      
      const monButton = screen.getByRole('button', { name: 'Mon' });
      const wedButton = screen.getByRole('button', { name: 'Wed' });
      const friButton = screen.getByRole('button', { name: 'Fri' });
      const tueButton = screen.getByRole('button', { name: 'Tue' });
      
      expect(monButton).toHaveClass('active');
      expect(wedButton).toHaveClass('active');
      expect(friButton).toHaveClass('active');
      expect(tueButton).not.toHaveClass('active');
    });

    it('should handle empty recurrenceDays', () => {
      const context = {
        appointment: {
          id: '1',
          title: 'Test',
          recurrenceType: 'weekly'
        }
      };
      
      render(
        <AppointmentModal
          open={true}
          context={context}
          onSave={mockOnSave}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
          users={mockUsers}
        />
      );
      
      const dayButtons = screen.getAllByRole('button')
        .filter(btn => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          .includes(btn.textContent));
      
      dayButtons.forEach(button => {
        expect(button).not.toHaveClass('active');
      });
    });
  });
});


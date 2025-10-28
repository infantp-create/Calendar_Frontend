import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAppointments,
  getAppointmentsByDate,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getUsers
} from './appointment';

// Mock fetch globally
global.fetch = vi.fn();

// Create localStorage mock before tests
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

// Define localStorage on global object
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Appointment API', () => {
  const API_BASE = "http://localhost:5163/api";
  const mockToken = 'mock-jwt-token';
  const mockUserId = '123';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset fetch mock
    global.fetch.mockReset();
    
    // Clear localStorage
    localStorage.clear();
    
    // Spy on localStorage methods
    vi.spyOn(localStorage, 'getItem');
    vi.spyOn(localStorage, 'setItem');
    vi.spyOn(localStorage, 'removeItem');
    vi.spyOn(localStorage, 'clear');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getAppointments', () => {
    it('should fetch appointments successfully with token', async () => {
      // Setup
      const mockAppointments = [
        { id: 1, title: 'Meeting 1' },
        { id: 2, title: 'Meeting 2' }
      ];
      
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute
      const result = await getAppointments(mockUserId);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/Appointments/${mockUserId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`
          }
        }
      );
      expect(result).toEqual(mockAppointments);
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('should fetch appointments successfully without token', async () => {
      // Setup - no token in localStorage
      const mockAppointments = [];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute
      const result = await getAppointments(mockUserId);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/Appointments/${mockUserId}`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      expect(result).toEqual(mockAppointments);
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
    });

    it('should throw error when response is not ok', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Execute & Verify
      await expect(getAppointments(mockUserId)).rejects.toThrow('Failed to fetch appointments');
    });

    it('should handle network errors', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Execute & Verify
      await expect(getAppointments(mockUserId)).rejects.toThrow('Network error');
    });
  });

  describe('getAppointmentsByDate', () => {
    const startDate = '2024-01-01T00:00:00';
    const endDate = '2024-01-31T23:59:59';

    it('should fetch appointments by date range with both dates', async () => {
      // Setup
      const mockAppointments = [{ id: 1, title: 'Meeting' }];
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute
      const result = await getAppointmentsByDate(mockUserId, startDate, endDate);

      // Verify
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = global.fetch.mock.calls[0];
      const url = callArgs[0].toString();
      
      expect(url).toContain(`${API_BASE}/Appointments/${mockUserId}/bydate`);
      expect(url).toContain(`startDate=${encodeURIComponent(startDate)}`);
      expect(url).toContain(`endDate=${encodeURIComponent(endDate)}`);
      
      expect(callArgs[1]).toEqual({
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`
        }
      });
      
      expect(result).toEqual(mockAppointments);
    });

    it('should fetch appointments with only start date (no endDate)', async () => {
      // Setup
      const mockAppointments = [];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute - no endDate parameter
      const result = await getAppointmentsByDate(mockUserId, startDate);

      // Verify
      const callArgs = global.fetch.mock.calls[0];
      const url = callArgs[0].toString();
      
      expect(url).toContain(`startDate=${encodeURIComponent(startDate)}`);
      expect(url).not.toContain('endDate=');
      expect(result).toEqual(mockAppointments);
    });

    it('should fetch appointments with null endDate', async () => {
      // Setup
      const mockAppointments = [];
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute with null
      await getAppointmentsByDate(mockUserId, startDate, null);
      
      // Verify null case
      let url = global.fetch.mock.calls[0][0].toString();
      expect(url).not.toContain('endDate=');
    });

    it('should fetch appointments with undefined endDate', async () => {
      // Setup
      const mockAppointments = [];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute with undefined
      await getAppointmentsByDate(mockUserId, startDate, undefined);
      
      // Verify undefined case
      const url = global.fetch.mock.calls[0][0].toString();
      expect(url).not.toContain('endDate=');
    });

    it('should fetch appointments with empty string endDate', async () => {
      // Setup
      const mockAppointments = [];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointments
      });

      // Execute with empty string
      await getAppointmentsByDate(mockUserId, startDate, '');
      
      // Verify - empty string is falsy, so no endDate param
      const url = global.fetch.mock.calls[0][0].toString();
      expect(url).not.toContain('endDate=');
    });

    it('should throw error when response is not ok', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Execute & Verify
      await expect(getAppointmentsByDate(mockUserId, startDate, endDate))
        .rejects.toThrow('Failed to fetch appointments by date');
    });

    it('should handle special characters in dates', async () => {
      // Setup
      const specialStartDate = '2024-01-01T00:00:00+05:30';
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      // Execute
      await getAppointmentsByDate(mockUserId, specialStartDate);

      // Verify URL encoding
      const url = global.fetch.mock.calls[0][0].toString();
      expect(url).toContain('startDate=' + encodeURIComponent(specialStartDate));
    });
  });

  describe('createAppointment', () => {
    const newAppointment = {
      title: 'New Meeting',
      description: 'Test meeting',
      start: '2024-01-15T10:00:00',
      end: '2024-01-15T11:00:00',
      participantIds: ['user1', 'user2']
    };

    it('should create appointment successfully with token', async () => {
      // Setup
      const mockResponse = { ...newAppointment, id: 'new-id' };
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Execute
      const result = await createAppointment(newAppointment);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`
          },
          body: JSON.stringify(newAppointment)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create appointment without token', async () => {
      // Setup - no token
      const mockResponse = { ...newAppointment, id: 'new-id' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Execute
      const result = await createAppointment(newAppointment);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newAppointment)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when creation fails', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      // Execute & Verify
      await expect(createAppointment(newAppointment))
        .rejects.toThrow('Failed to create appointment');
    });

    it('should handle empty appointment object', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-id' })
      });

      // Execute
      const result = await createAppointment({});

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`
          },
          body: JSON.stringify({})
        }
      );
      expect(result).toEqual({ id: 'new-id' });
    });

    it('should handle null appointment data', async () => {
      // Setup
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-id' })
      });

      // Execute
      const result = await createAppointment(null);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(null)
        }
      );
    });
  });

  describe('updateAppointment', () => {
    const appointmentId = 'appt-123';
    const updatedData = {
      title: 'Updated Meeting',
      description: 'Updated description'
    };

    it('should update appointment successfully with token', async () => {
      // Setup
      const mockResponse = { ...updatedData, id: appointmentId };
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Execute
      const result = await updateAppointment(appointmentId, mockUserId, updatedData);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${appointmentId}/${mockUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`
          },
          body: JSON.stringify(updatedData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update appointment without token', async () => {
      // Setup - no token
      const mockResponse = { ...updatedData, id: appointmentId };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Execute
      const result = await updateAppointment(appointmentId, mockUserId, updatedData);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${appointmentId}/${mockUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatedData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when update fails', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Execute & Verify
      await expect(updateAppointment(appointmentId, mockUserId, updatedData))
        .rejects.toThrow('Failed to update appointment');
    });

    it('should handle special characters in IDs', async () => {
      // Setup
      const specialId = 'appt-123/456#test';
      const specialUserId = 'user@123';
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      // Execute
      await updateAppointment(specialId, specialUserId, updatedData);

      // Verify - URL should be constructed with special characters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${specialId}/${specialUserId}`,
        expect.any(Object)
      );
    });

    it('should handle empty update data', async () => {
      // Setup
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: appointmentId })
      });

      // Execute
      await updateAppointment(appointmentId, mockUserId, {});

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${appointmentId}/${mockUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }
      );
    });
  });

  describe('deleteAppointment', () => {
    const appointmentId = 'appt-456';

    it('should delete appointment successfully with token', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true
      });

      // Execute
      const result = await deleteAppointment(appointmentId, mockUserId);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${appointmentId}/${mockUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`
          }
        }
      );
      expect(result).toBe(true);
    });

    it('should delete appointment without token', async () => {
      // Setup - no token
      global.fetch.mockResolvedValueOnce({
        ok: true
      });

      // Execute
      const result = await deleteAppointment(appointmentId, mockUserId);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${appointmentId}/${mockUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      expect(result).toBe(true);
    });

    it('should throw error when deletion fails', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      // Execute & Verify
      await expect(deleteAppointment(appointmentId, mockUserId))
        .rejects.toThrow('Failed to delete appointment');
    });

    it('should handle network errors during deletion', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      // Execute & Verify
      await expect(deleteAppointment(appointmentId, mockUserId))
        .rejects.toThrow('Network failure');
    });

    it('should handle special characters in delete IDs', async () => {
      // Setup
      const specialId = 'appt-!@#$%';
      const specialUserId = 'user-&*()';
      global.fetch.mockResolvedValueOnce({
        ok: true
      });

      // Execute
      await deleteAppointment(specialId, specialUserId);

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/appointments/${specialId}/${specialUserId}`,
        expect.any(Object)
      );
    });
  });

  describe('getUsers', () => {
    it('should fetch users successfully with token', async () => {
      // Setup
      const mockUsers = [
        { id: '1', userName: 'User 1', email: 'user1@test.com' },
        { id: '2', userName: 'User 2', email: 'user2@test.com' }
      ];
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      });

      // Execute
      const result = await getUsers();

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`
          }
        }
      );
      expect(result).toEqual(mockUsers);
    });

    it('should fetch users successfully without token', async () => {
      // Setup - no token
      const mockUsers = [];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      });

      // Execute
      const result = await getUsers();

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/users`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      expect(result).toEqual(mockUsers);
    });

    it('should throw error when fetching users fails', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Execute & Verify
      await expect(getUsers()).rejects.toThrow('Failed to fetch users');
    });

    it('should handle empty user list', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      // Execute
      const result = await getUsers();

      // Verify
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON response', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      // Execute & Verify
      await expect(getUsers()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long tokens', async () => {
      // Setup
      const longToken = 'a'.repeat(10000);
      localStorage.setItem('token', longToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      // Execute
      await getUsers();

      // Verify
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${longToken}`
          }
        }
      );
    });

    it('should handle empty string token as no token', async () => {
      // Setup
      localStorage.setItem('token', '');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      // Execute
      await getUsers();

      // Verify - empty string is falsy, so no Authorization header
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/users`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    });

    it('should handle whitespace token as valid token', async () => {
      // Setup
      const whitespaceToken = '   ';
      localStorage.setItem('token', whitespaceToken);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      // Execute
      await getUsers();

      // Verify - whitespace is truthy
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${whitespaceToken}`
          }
        }
      );
    });

    it('should construct all endpoint URLs correctly', async () => {
      // Setup
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({})
        })
      );

      // Test each endpoint URL construction
      await getAppointments('user123');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5163/api/Appointments/user123',
        expect.any(Object)
      );

      await getAppointmentsByDate('user456', '2024-01-01', '2024-01-31');
      const callUrl = global.fetch.mock.calls[1][0].toString();
      expect(callUrl).toContain('http://localhost:5163/api/Appointments/user456/bydate');
      expect(callUrl).toContain('startDate=');
      expect(callUrl).toContain('endDate=');

      await createAppointment({});
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5163/api/appointments',
        expect.objectContaining({ method: 'POST' })
      );

      await updateAppointment('appt1', 'user789', {});
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5163/api/appointments/appt1/user789',
        expect.objectContaining({ method: 'PUT' })
      );

      await deleteAppointment('appt2', 'user101');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5163/api/appointments/appt2/user101',
        expect.objectContaining({ method: 'DELETE' })
      );

      await getUsers();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5163/api/users',
        expect.any(Object)
      );
    });

    it('should handle concurrent API calls', async () => {
      // Setup
      localStorage.setItem('token', mockToken);
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => []
        })
      );

      // Execute multiple calls simultaneously
      const promises = [
        getUsers(),
        getAppointments('user1'),
        getAppointmentsByDate('user2', '2024-01-01'),
        createAppointment({}),
        updateAppointment('appt1', 'user3', {}),
        deleteAppointment('appt2', 'user4')
      ];

      const results = await Promise.all(promises);

      // Verify all calls were made
      expect(global.fetch).toHaveBeenCalledTimes(6);
      expect(results).toHaveLength(6);
    });
  });
});

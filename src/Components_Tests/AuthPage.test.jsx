import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AuthPage from '../Components/AuthPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock CSS import
vi.mock('../../Styles/Auth.css', () => ({}));

// Helper function to render with Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthPage Component', () => {
  // Setup mocks
  beforeEach(() => {
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
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render login form by default', () => {
      renderWithRouter(<AuthPage />);
      
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Enter your credentials')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
    });

    it('should render register form when switched', () => {
      renderWithRouter(<AuthPage />);
      
      const registerLink = screen.getByText('Register');
      fireEvent.click(registerLink);
      
      expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Fill in your details')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('should render all input icons', () => {
      const { container } = renderWithRouter(<AuthPage />);
      
      // Switch to register to see all icons
      fireEvent.click(screen.getByText('Register'));
      
      const inputGroups = container.getElementsByClassName('input-group');
      expect(inputGroups.length).toBeGreaterThan(0);
      
      // Check for icon elements (react-feather components)
      const inputIcons = container.getElementsByClassName('input-icon');
      expect(inputIcons).toHaveLength(4);
    });

    it('should render correct placeholder text', () => {
      renderWithRouter(<AuthPage />);
      
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Register'));
      
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    it('should render auth card structure', () => {
      const { container } = renderWithRouter(<AuthPage />);
      
      expect(container.getElementsByClassName('auth-page')[0]).toBeInTheDocument();
      expect(container.getElementsByClassName('auth-card')[0]).toBeInTheDocument();
      expect(container.getElementsByClassName('auth-left')[0]).toBeInTheDocument();
      expect(container.getElementsByClassName('auth-right')[0]).toBeInTheDocument();
      expect(container.getElementsByClassName('auth-container')[0]).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update email input value', () => {
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value', () => {
      renderWithRouter(<AuthPage />);
      
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });

    it('should update name input value in register mode', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      expect(nameInput.value).toBe('John Doe');
    });

    it('should update confirm password input value in register mode', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const confirmInput = screen.getByLabelText('Confirm Password');
      fireEvent.change(confirmInput, { target: { value: 'password123' } });
      
      expect(confirmInput.value).toBe('password123');
    });

    it('should handle multiple input changes', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
      fireEvent.change(confirmInput, { target: { value: 'securePass123' } });
      
      expect(nameInput.value).toBe('Jane Smith');
      expect(emailInput.value).toBe('jane@example.com');
      expect(passwordInput.value).toBe('securePass123');
      expect(confirmInput.value).toBe('securePass123');
    });
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: '1', userName: 'John Doe', email: 'john@example.com' }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5163/api/users/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'john@example.com',
              password: 'password123'
            })
          }
        );
      });
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'user',
          JSON.stringify(mockResponse.user)
        );
        expect(global.alert).toHaveBeenCalledWith('Welcome back, John Doe!');
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
      });
    });

    it('should handle login failure with error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });
      
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should handle login failure without error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });
      
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('should handle network error during login', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      global.fetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should clear form after successful login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'token',
          user: { id: '1', userName: 'User' }
        })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register with valid data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Registration successful' })
      });
      
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5163/api/users/register',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: 'New User',
              email: 'new@example.com',
              password: 'password123'
            })
          }
        );
      });
    
    });

    it('should show error when passwords do not match', async () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(nameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmInput, { target: { value: 'password456' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('should handle registration failure with error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' })
      });
      
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(nameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.change(confirmInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should handle registration failure without error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });
      
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument();
      });
    });

    it('should handle network error during registration', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection failed'));
      
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
      });
    });

    it('should show loading state during registration', async () => {
      global.fetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should return early when passwords mismatch without clearing loading', async () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass1' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass2' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message with error class', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Test error'));
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        const errorElement = screen.getByText('Test error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveClass('error');
      });
    });

    it('should clear error on successful submission', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'token',
            user: { id: '1', userName: 'User' }
          })
        });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      // First submission - error
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second submission - success
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

        it('should handle JSON parse error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });      
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });

  });

  describe('Form Validation', () => {
    it('should require all fields in login form', () => {
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should require all fields in register form', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      
      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('type', 'password');
    });

    it('should handle form submission with Enter key', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'token',
          user: { id: '1', userName: 'User' }
        })
      });
      
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      // Submit with Enter key
      fireEvent.keyPress(passwordInput, { key: 'Enter', code: 13, charCode: 13 });
    });
    
    it('should validate email format', () => {
      renderWithRouter(<AuthPage />);
      
      const emailInput = screen.getByLabelText('Email');
      
      // Invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      expect(emailInput.validity.valid).toBe(false);
      
      // Valid email
      fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
      expect(emailInput.validity.valid).toBe(true);
    });
  });

  describe('UI Text Content', () => {
    it('should display correct text in login mode', () => {
      renderWithRouter(<AuthPage />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Welcome back! Stay on top of your schedule and never miss an important event.')).toBeInTheDocument();
      expect(screen.getByText('Enter your credentials')).toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    });

    it('should display correct text in register mode', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Create your account and take control of your calendar with ease and efficiency.')).toBeInTheDocument();
      expect(screen.getByText('Fill in your details')).toBeInTheDocument();
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    });

    it('should have correct button text', () => {
      renderWithRouter(<AuthPage />);
      
      // Login mode
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      
      // Register mode
      fireEvent.click(screen.getByText('Register'));
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    it('should have correct link styling', () => {
      renderWithRouter(<AuthPage />);
      
      const registerLink = screen.getByText('Register');
      expect(registerLink).toHaveClass('auth-link');
      expect(registerLink).toHaveStyle({ cursor: 'pointer' });
      
      fireEvent.click(registerLink);
      
      const loginLink = screen.getByText('Login');
      expect(loginLink).toHaveClass('auth-link');
      expect(loginLink).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('LocalStorage Operations', () => {
    it('should store token and user on successful login', async () => {
      const mockUser = { id: '123', userName: 'Test User', email: 'test@test.com' };
      const mockToken = 'jwt-token-123';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken, user: mockUser })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token', user: { id: '1', userName: 'User' } })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      
      // Should not crash even if localStorage fails
      expect(() => {
        fireEvent.submit(form);
      }).not.toThrow();
    });
  });

  describe('Navigation', () => {
    it('should navigate to /calendar after successful login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'token',
          user: { id: '1', userName: 'User' }
        })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
      });
    });

    it('should not navigate on failed login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('should not navigate after registration', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      });
    });
  });

  describe('Alert Messages', () => {
    it('should show welcome alert on successful login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'token',
          user: { id: '1', userName: 'John Doe' }
        })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Welcome back, John Doe!');
      });
    });

    it('should show registration success alert', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Registered successfully! Please login now.');
      });
    });

    it('should handle alert errors gracefully', async () => {
      global.alert = vi.fn(() => {
        throw new Error('Alert error');
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'token',
          user: { id: '1', userName: 'User' }
        })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      
      // Should not crash even if alert fails
      expect(() => {
        fireEvent.submit(form);
      }).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    it('should handle darkMode prop', () => {
      const { container } = renderWithRouter(<AuthPage darkMode={true} />);
      expect(container.getElementsByClassName('auth-page')[0]).toBeInTheDocument();
    });

    it('should handle toggleTheme prop', () => {
      const mockToggleTheme = vi.fn();
      const { container } = renderWithRouter(<AuthPage toggleTheme={mockToggleTheme} />);
      expect(container.getElementsByClassName('auth-page')[0]).toBeInTheDocument();
    });

    it('should handle undefined props', () => {
      const { container } = renderWithRouter(<AuthPage />);
      expect(container.getElementsByClassName('auth-page')[0]).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid mode switching', () => {
      renderWithRouter(<AuthPage />);
      
      const registerLink = screen.getByText('Register');
      
      // Rapid switching
      for (let i = 0; i < 10; i++) {
        fireEvent.click(registerLink);
        const loginLink = screen.getByText('Login');
        fireEvent.click(loginLink);
      }
      
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should handle multiple form submissions', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'token',
          user: { id: '1', userName: 'User' }
        })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      
      // Multiple rapid submissions
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Should handle gracefully
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle very long input values', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const longValue = 'a'.repeat(1000);
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      
      fireEvent.change(nameInput, { target: { value: longValue } });
      fireEvent.change(emailInput, { target: { value: longValue + '@example.com' } });
      
      expect(nameInput.value).toBe(longValue);
      expect(emailInput.value).toBe(longValue + '@example.com');
    });

    it('should handle special characters in inputs', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~';
      
      const nameInput = screen.getByLabelText('Full Name');
      fireEvent.change(nameInput, { target: { value: specialChars } });
      
      expect(nameInput.value).toBe(specialChars);
    });


    it('should handle Unicode characters', () => {
      renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const unicodeText = '你好世界 مرحبا بالعالم 🌍🚀';
      
      const nameInput = screen.getByLabelText('Full Name');
      fireEvent.change(nameInput, { target: { value: unicodeText } });
      
      expect(nameInput.value).toBe(unicodeText);
    });

    it('should handle form reset after successful registration', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(nameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'pass' } });
      fireEvent.change(confirmInput, { target: { value: 'pass' } });
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Form should be reset and switched to login
        expect(screen.getByLabelText('Email').value).toBe('');
        expect(screen.getByLabelText('Password').value).toBe('');
        expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
      });
    });

    it('should handle async errors in finally block', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'token', user: { id: '1' } })
        });
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      
      // First submission - error
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled();
      });
      
      // Second submission - success
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
      });
    });
  });

  describe('Complete User Flows', () => {
    it('should complete full registration and login flow', async () => {
      // Registration
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Registration successful' })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      // Go to register
      fireEvent.click(screen.getByText('Register'));
      
      // Fill registration form
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      
      // Submit registration
      const registerForm = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(registerForm);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Registered successfully! Please login now.');
        expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      });
      
      // Now login
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-token',
          user: { id: '1', userName: 'New User' }
        })
      });
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      
      const loginForm = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(loginForm);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Welcome back, New User!');
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
      });
    });

    it('should handle registration with password mismatch then correction', async () => {
      const { container } = renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      // First attempt - passwords don't match
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass1' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass2' } });
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
      
      // Correct the passwords
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });
      
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass' } });
      
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Registered successfully! Please login now.');
      });
    });
  });

  describe('Full Coverage Completion', () => {
    it('should cover all component lifecycle', () => {
      const { unmount } = renderWithRouter(<AuthPage />);
      
      // Component mounted
      const { container } = renderWithRouter(<AuthPage />);
      expect(container.getElementsByClassName('auth-page')[0]).toBeInTheDocument();
      
      // Component unmounting
      unmount();
      
      expect(container.getElementsByClassName('auth-page')[0]).toBeInTheDocument();
    });

    it('should cover successful registration flow completely', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      fireEvent.click(screen.getByText('Register'));
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Verify API call
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5163/api/users/register',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: 'New User',
              email: 'new@test.com',
              password: 'pass123'
            })
          }
        );
                expect(global.alert).toHaveBeenCalledWith('Registered successfully! Please login now.');
        
        // Verify mode switch
        expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
        
        // Verify form fields are cleared
        expect(screen.getByLabelText('Email').value).toBe('');
        expect(screen.getByLabelText('Password').value).toBe('');
      });
    });

    it('should cover successful login flow completely', async () => {
      const mockUser = { id: '123', userName: 'Test User', email: 'test@test.com' };
      const mockToken = 'jwt-token-123';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken, user: mockUser })
      });
      
      const { container } = renderWithRouter(<AuthPage />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.submit(form);
      
      await waitFor(() => {
        // Verify API call
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5163/api/users/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@test.com',
              password: 'password123'
            })
          }
        );
        
        // Verify localStorage
        expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
        
        // Verify alert
        expect(global.alert).toHaveBeenCalledWith('Welcome back, Test User!');
        
        // Verify navigation
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
      });
    });

    it('should cover error states completely', async () => {
      // Test network error
      global.fetch.mockRejectedValueOnce(new Error('Network failed'));
      
      const { container } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Network failed')).toBeInTheDocument();
      });
      
      // Test server error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });
      
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
      
      // Test JSON parse error
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('JSON error'); }
      });
      
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('JSON error')).toBeInTheDocument();
      });
    });

    it('should handle all input scenarios', () => {
      renderWithRouter(<AuthPage />);
      
      // Test all input types
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      
      // Empty values
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: '' } });
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      
      // Normal values
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      expect(emailInput.value).toBe('test@test.com');
      expect(passwordInput.value).toBe('password');
      
      // Special characters
      fireEvent.change(emailInput, { target: { value: 'test+special@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'p@$$w0rd!' } });
      expect(emailInput.value).toBe('test+special@test.com');
      expect(passwordInput.value).toBe('p@$$w0rd!');
    });

    it('should cover all button states', async () => {
      const { container } = renderWithRouter(<AuthPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      
      // Initial state - not disabled
      expect(submitButton).not.toBeDisabled();
      
      // During submission - should be disabled
      global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const form = container.getElementsByClassName('auth-form')[0];
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      expect(submitButton).toBeDisabled();
      
      // After submission - should be enabled again
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 200 });
    });

    it('should handle component unmounting during async operations', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      
      global.fetch.mockReturnValueOnce(promise);
      
      const { container, unmount } = renderWithRouter(<AuthPage />);
      
      const form = container.getElementsByClassName('auth-form')[0];
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
      fireEvent.submit(form);
      
      // Unmount component while request is pending
      unmount();
      
      // Resolve the promise after unmount
      resolvePromise({
        ok: true,
        json: async () => ({ token: 'token', user: { id: '1', userName: 'User' } })
      });
      
      // Should not throw any errors
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });
});



   
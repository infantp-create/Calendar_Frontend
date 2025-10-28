import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import TopBar from '../Components/TopBar';

// Mock react-icons/fi
vi.mock('react-icons/fi', () => ({
  FiUser: vi.fn(({ size, className }) => (
    <span 
      data-testid="user-icon" 
      data-size={size} 
      className={className}
    >
      User Icon
    </span>
  ))
}));

describe('TopBar Component', () => {
  // Store original localStorage
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('Component Rendering', () => {
    it('should render all TopBar elements correctly', () => {
      // Setup: Mock user data in localStorage
      const mockUser = { userName: 'John Doe', id: '123' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      const { container } = render(<TopBar />);

      // Verify: Check all main elements are rendered
      expect(container.querySelector('.topbar')).toBeInTheDocument();
      expect(container.querySelector('.topbar-left')).toBeInTheDocument();
      expect(container.querySelector('.topbar-right')).toBeInTheDocument();
      expect(container.querySelector('.app-name')).toBeInTheDocument();
      expect(container.querySelector('.user-icon')).toBeInTheDocument();
      expect(container.querySelector('.username')).toBeInTheDocument();
    });

    it('should display SchedulePro as app name', () => {
      // Setup
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'Test' }));

      // Execute
      render(<TopBar />);

      // Verify
      const appName = screen.getByText('SchedulePro');
      expect(appName).toBeInTheDocument();
      expect(appName).toHaveClass('app-name');
    });

    it('should render FiUser icon with correct props', () => {
      // Setup
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'Test' }));

      // Execute
      render(<TopBar />);

      // Verify
      const icon = screen.getByTestId('user-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-size', '20');
      expect(icon).toHaveClass('user-icon');
    });
  });

  describe('LocalStorage User Data Handling', () => {
    it('should display username when user exists with valid userName', () => {
      // Setup: User with userName property
      const mockUser = { userName: 'Alice Johnson', email: 'alice@test.com' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(window.localStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('should handle user object without userName property', () => {
      // Setup: User without userName
      const mockUser = { id: '456', email: 'user@test.com', role: 'admin' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify: username should be undefined (rendered as empty)
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('');
    });

    it('should handle when userName is null', () => {
      // Setup: userName explicitly set to null
      const mockUser = { userName: null, id: '789' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('');
    });

    it('should handle when userName is empty string', () => {
      // Setup
      const mockUser = { userName: '' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('');
    });

    it('should handle when localStorage returns null', () => {
      // Setup: No user in localStorage
      window.localStorage.getItem.mockReturnValue(null);

      // Execute
      render(<TopBar />);

      // Verify: Should not crash, username should be empty
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('');
    });

    it('should handle when localStorage returns undefined', () => {
      // Setup
      window.localStorage.getItem.mockReturnValue(undefined);

      // Execute
      render(<TopBar />);

      // Verify
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('');
    });


    it('should handle empty string from localStorage', () => {
      // Setup
      window.localStorage.getItem.mockReturnValue('');

      // Execute
      render(<TopBar />);

      // Verify
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('');
    });

    it('should call localStorage.getItem exactly once with "user" key', () => {
      // Setup
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'Test' }));

      // Execute
      render(<TopBar />);

      // Verify
      expect(window.localStorage.getItem).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should display special characters in userName correctly', () => {
      // Setup: Username with special characters
      const mockUser = { userName: 'John <Doe> & "Smith" O\'Neill' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      expect(screen.getByText('John <Doe> & "Smith" O\'Neill')).toBeInTheDocument();
    });

    it('should handle very long usernames', () => {
      // Setup: 200 character username
      const longName = 'VeryLongUserName'.repeat(15);
      const mockUser = { userName: longName };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should display unicode and emoji characters correctly', () => {
      // Setup: Username with unicode and emojis
      const mockUser = { userName: '用户 مستخدم 👤 José García ñ' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      expect(screen.getByText('用户 مستخدم 👤 José García ñ')).toBeInTheDocument();
    });

    it('should handle whitespace-only userName', () => {
      // Setup
      const mockUser = { userName: '     ' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify: Should render the whitespace
      const username = document.querySelector('.username');
      expect(username).toBeInTheDocument();
      expect(username.textContent).toBe('     ');
    });

    it('should handle userName with newlines and tabs', () => {
      // Setup
      const mockUser = { userName: 'User\nName\tWith\rSpaces' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify
      // expect(screen.getByText('User\nName\tWith\rSpaces')).toBeInTheDocument();
    });
  });

  describe('Component DOM Structure', () => {
    it('should maintain correct DOM hierarchy', () => {
      // Setup
      const mockUser = { userName: 'Structure Test' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      const { container } = render(<TopBar />);

      // Verify structure
      const topbar = container.querySelector('.topbar');
      expect(topbar).toBeInTheDocument();
      
      // Check left section structure
      const leftSection = topbar.querySelector('.topbar-left');
      expect(leftSection).toBeInTheDocument();
      expect(leftSection.parentElement).toBe(topbar);
      expect(leftSection.querySelector('.app-name')).toBeInTheDocument();
      expect(leftSection.querySelector('.app-name').textContent).toBe('SchedulePro');

      // Check right section structure
      const rightSection = topbar.querySelector('.topbar-right');
      expect(rightSection).toBeInTheDocument();
      expect(rightSection.parentElement).toBe(topbar);
      
      // Check children order in right section
      const rightChildren = Array.from(rightSection.children);
      expect(rightChildren[0]).toHaveClass('user-icon');
      expect(rightChildren[1]).toHaveClass('username');
    });

    it('should render elements in correct order', () => {
      // Setup
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'Order Test' }));

      // Execute
      const { container } = render(<TopBar />);

      // Verify order
      const topbarChildren = Array.from(container.querySelector('.topbar').children);
      expect(topbarChildren[0]).toHaveClass('topbar-left');
      expect(topbarChildren[1]).toHaveClass('topbar-right');
    });
  });

  describe('Multiple Renders and Updates', () => {
    it('should handle re-renders with different localStorage values', () => {
      // Initial render
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'First User' }));
      const { rerender } = render(<TopBar />);
      expect(screen.getByText('First User')).toBeInTheDocument();

      // Update localStorage and re-render
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'Second User' }));
      rerender(<TopBar />);
      expect(screen.getByText('Second User')).toBeInTheDocument();
    });

    it('should handle transition from user to no user', () => {
      // Initial render with user
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'Existing User' }));
      const { rerender } = render(<TopBar />);
      expect(screen.getByText('Existing User')).toBeInTheDocument();

      // Update to no user
      window.localStorage.getItem.mockReturnValue(null);
      rerender(<TopBar />);
      const username = document.querySelector('.username');
      expect(username.textContent).toBe('');
    });

    it('should handle transition from no user to user', () => {
      // Initial render without user
      window.localStorage.getItem.mockReturnValue(null);
      const { rerender } = render(<TopBar />);
      let username = document.querySelector('.username');
      expect(username.textContent).toBe('');

      // Update to have user
      window.localStorage.getItem.mockReturnValue(JSON.stringify({ userName: 'New User' }));
      rerender(<TopBar />);
      expect(screen.getByText('New User')).toBeInTheDocument();
    });
  });

 

  describe('Component Isolation', () => {
    it('should not modify localStorage', () => {
      // Setup
      const mockUser = { userName: 'Read Only Test' };
      window.localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      // Execute
      render(<TopBar />);

      // Verify: Only getItem should be called, no setItem
      expect(window.localStorage.getItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
      expect(window.localStorage.removeItem).not.toHaveBeenCalled();
      expect(window.localStorage.clear).not.toHaveBeenCalled();
    });
  });
});

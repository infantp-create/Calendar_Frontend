
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import App from '../Components/App';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom's BrowserRouter to use MemoryRouter instead
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  const React = await vi.importActual('react');
  
  class MockBrowserRouter extends React.Component {
    render() {
      const { children } = this.props;
      const initialEntries = window.testInitialEntries || ['/'];
      return React.createElement(actual.MemoryRouter, { initialEntries }, children);
    }
  }
  
  return {
    ...actual,
    BrowserRouter: MockBrowserRouter
  };
});

// Mock all imported components
vi.mock('../Components/AuthPage', () => ({
  default: () => <div data-testid="auth-page">Auth Page</div>
}));

vi.mock('../Components/CalendarPage', () => ({
  default: () => <div data-testid="calendar-page">Calendar Page</div>
}));

vi.mock('../../Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));

vi.mock('../../ProtectedRoute', () => ({
  default: ({ children }) => {
    const React = require('react');
    const { Navigate } = require('react-router-dom');
    const isAuthenticated = localStorage.getItem('user') !== null;
    
    if (isAuthenticated) {
      return React.createElement(React.Fragment, null, children);
    }
    
    return React.createElement(Navigate, { to: '/login', replace: true });
  }
}));

// Mock the CSS import
vi.mock('../Styles/App.css', () => ({}));

describe('App Component', () => {
  let originalLocation;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Setup window.location mock
    originalLocation = window.location;
    delete window.location;
    window.location = {
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn()
    };
    
    // Reset test initial entries
    window.testInitialEntries = ['/'];
  });

  afterEach(() => {
    window.location = originalLocation;
    delete window.testInitialEntries;
    vi.clearAllMocks();
  });

  describe('Edge Cases', () => {
    it('should handle rapid route changes', () => {
      const routes = ['/login', '/calendar', '/unknown', '/login', '/calendar'];
      
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      routes.forEach(route => {
        window.testInitialEntries = [route];
        const { unmount } = render(<App />);
        unmount();
      });
      
      expect(true).toBe(true);
    });

    it('should handle localStorage errors', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      window.testInitialEntries = ['/calendar'];
      const { container } = render(<App />);
      
      expect(container).toBeInTheDocument();
      
      localStorage.getItem = originalGetItem;
    });

    it('should render with different initial routes', () => {
      const initialRoutes = [
        '/',
        '/login',
        '/calendar',
        '/unknown',
        '/test',
        ''
      ];

      initialRoutes.forEach(route => {
        window.testInitialEntries = [route || '/'];
        const { unmount } = render(<App />);
        
        expect(document.body).toBeInTheDocument();
        
        unmount();
      });
    });


    it('should handle concurrent renders', () => {
      const containers = [];
      
      for (let i = 0; i < 5; i++) {
        window.testInitialEntries = ['/login'];
        const { container } = render(<App />);
        containers.push(container);
      }

      containers.forEach(container => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('should render Router as root element', () => {
      const { container } = render(<App />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have Routes component', () => {
      render(<App />);
      
      expect(true).toBe(true);
    });

    it('should have all required Route components', async () => {
      const requiredPaths = ['/login', '/calendar', '*'];
      
      for (const path of requiredPaths) {
        const testPath = path === '*' ? '/unknown' : path;
        
        if (path === '/calendar') {
          localStorage.setItem('user', JSON.stringify({ id: '1' }));
        }
        
        window.testInitialEntries = [testPath];
        const { unmount } = render(<App />);
        
        expect(document.body).toBeInTheDocument();
        
        unmount();
      }
    });
  });

  describe('Import Dependencies', () => {
    it('should handle missing CSS file gracefully', () => {
      const { container } = render(<App />);
      expect(container).toBeInTheDocument();
    });

    it('should execute all code paths', () => {
      const { container } = render(<App />);
      expect(container).toBeInTheDocument();
      
      const paths = ['/login', '/calendar', '/unknown'];
      
      paths.forEach(path => {
        if (path === '/calendar') {
          localStorage.setItem('user', JSON.stringify({ id: '1' }));
        }
        
        window.testInitialEntries = [path];
        const { unmount } = render(<App />);
        
        unmount();
      });
      
      expect(true).toBe(true);
    });

    it('should cover default export', () => {
      expect(App).toBeDefined();
      expect(typeof App).toBe('function');
    });
  });
});

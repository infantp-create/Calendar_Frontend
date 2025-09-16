import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";          // Login/Register page
import CalendarPage from "./CalendarPage";  // Calendar dashboard page
import { isTokenValid } from "../utils/helper"; // Token validation function

function App() {
  // State for dark/light mode
  const [darkMode, setDarkMode] = useState(true);

  // Toggle theme function
  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className={darkMode ? "dark-mode" : "light-mode"}>
      <Router>
        <Routes>
          {/* Public route: Login/Register */}
          <Route
            path="/login"
            element={<AuthPage darkMode={darkMode} toggleTheme={toggleTheme} />}
          />

          {/* Protected route: Calendar 
              - if token is valid → show CalendarPage
              - if not → redirect to /login */}
          <Route
            path="/calendar"
            element={isTokenValid() ? <CalendarPage /> : <Navigate to="/login" replace />}
          />

          {/* Fallback route: 
              - if token is valid → go to /calendar
              - else → go to /login */}
          <Route
            path="*"
            element={<Navigate to={isTokenValid() ? "/calendar" : "/login"} replace />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

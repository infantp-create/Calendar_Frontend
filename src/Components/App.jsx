import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../Components/AuthPage";          // Login/Register page
import CalendarPage from "../Components/CalendarPage";  // Calendar dashboard page
import Layout from "../Layout";
import ProtectedRoute from "../ProtectedRoute"; // the wrapper
import "../Styles/App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login/Register page */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected routes */}
        <Route element={<Layout />}>
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback route → redirect to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

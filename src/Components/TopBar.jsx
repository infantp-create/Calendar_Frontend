import React, { useState } from "react";
import { FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "../styles/TopBar.sass";

export default function TopBar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const username = user?.userName;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="topbar">
      {/* Left - App Name */}
      <div className="topbar-left">
        <div className="app-name">SchedulePro</div>
      </div>

      {/* Right - User */}
      <div className="topbar-right" onClick={() => setShowLogoutModal(true)} style={{ cursor: "pointer" }}>
        <FiUser size={20} className="user-icon" />
        <span className="username">{username}</span>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Log out?</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-buttons">
              <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


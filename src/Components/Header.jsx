import React, { useRef } from "react";
import "../styles/Header.sass";
import { FiMenu } from "react-icons/fi";

const Header = ({
  view,
  setView,
  selectedDate,
  formatDate,
  onPrev,
  onNext,
  onNewAppointment,
  disableNavigation,
  onToggleSidebar,
  onDateChange,
}) => {
  const dateInputRef = useRef(null);

  const handleDateClick = () => {
    dateInputRef.current.showPicker(); // Native date picker
  };

  return (
    <div className="calendar-panel-header">
      <div className="left-section">
        {/* Hamburger menu - only visible in mobile */}
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FiMenu size={20} />
        </button>

        {/* Prev / Date / Next */}
        <button className="nav-btn" onClick={onPrev} disabled={disableNavigation}>
          ◀
        </button>

        {/* Date Display with Date Picker */}
        <div className="date-display" onClick={handleDateClick}>
          {formatDate(selectedDate)}
          <input
            ref={dateInputRef}
            type="date"
            className="hidden-date-input"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => onDateChange(new Date(e.target.value))}
          />
        </div>

        <button className="nav-btn" onClick={onNext} disabled={disableNavigation}>
          ▶
        </button>
      </div>

      <div className="right-section">
        {/* Desktop: Buttons */}
        <div className="view-buttons">
          <button
            className={`view-btn ${view === "day" ? "active" : ""}`}
            onClick={() => setView("day")}
          >
            Day
          </button>
          <button
            className={`view-btn ${view === "week" ? "active" : ""}`}
            onClick={() => setView("week")}
          >
            Week
          </button>
          <button
            className={`view-btn ${view === "month" ? "active" : ""}`}
            onClick={() => setView("month")}
          >
            Month
          </button>
        </div>

        {/* Mobile: Dropdown */}
        <select
          className="view-dropdown"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>

        <button
          className="new-appointment-btn"
          onClick={onNewAppointment}
          disabled={disableNavigation}
        >
          + New Appointment
        </button>
      </div>
    </div>
  );
};

export default Header;


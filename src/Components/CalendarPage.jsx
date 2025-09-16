import { useState } from "react";
import "../Styles/Calendar.css";

function CalendarPage() {
  const [view, setView] = useState("month");

  const appointments = [
    { id: 1, title: "Team Meeting", time: "10:00 AM", date: "2025-09-17" },
    { id: 2, title: "Doctor Appointment", time: "2:30 PM", date: "2025-09-18" },
    { id: 3, title: "Project Review", time: "4:00 PM", date: "2025-09-20" },
  ];

  return (
    <div className="calendar-page">
      {/* Left Side - Appointments */}
      <div className="appointments">
        <h2>Your Appointments</h2>
        <ul>
          {appointments.map((a) => (
            <li key={a.id}>
              <strong>{a.title}</strong> <br />
              <span>{a.date} - {a.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Side - Calendar */}
      <div className="calendar-view">
        <div className="calendar-header">
          <h2>Calendar</h2>
          <div className="view-switch">
            <button
              className={view === "day" ? "active" : ""}
              onClick={() => setView("day")}
            >
              Daily
            </button>
            <button
              className={view === "week" ? "active" : ""}
              onClick={() => setView("week")}
            >
              Weekly
            </button>
            <button
              className={view === "month" ? "active" : ""}
              onClick={() => setView("month")}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="calendar-body">
          {view === "day" && <p>📅 Showing **Daily View**</p>}
          {view === "week" && <p>📅 Showing **Weekly View**</p>}
          {view === "month" && <p>📅 Showing **Monthly View**</p>}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;

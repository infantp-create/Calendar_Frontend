import React from "react";
import "../styles/Sidebar.sass";

const Sidebar = ({ view, selectedDate, appointments, openModal, isOpen, onClose }) => {
  const now = new Date();

  const formatDateRange = () => {
    if (view === "day")
      return selectedDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    if (view === "week") {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })} - ${end.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;
    }

    if (view === "month")
      return selectedDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });

    return "";
  };

  const getFilteredAppointments = () => {
    if (!appointments) return [];

    return appointments.filter((a) => {
      if (!a || !a.start || !a.end) return false;

      const aStart = new Date(a.start);
      const aEnd = new Date(a.end);

      if (view === "day") {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        return aStart <= endOfDay && aEnd >= startOfDay;
      }

      if (view === "week") {
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return aStart <= end && aEnd >= start;
      }

      if (view === "month") {
        const start = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        start.setHours(0, 0, 0, 0);
        const end = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );
        end.setHours(23, 59, 59, 999);
        return aStart <= end && aEnd >= start;
      }

      return false;
    });
  };

  const filtered = getFilteredAppointments().map((a) => {
    if (!a.start || !a.end) return null;

    const start = new Date(a.start);
    const end = new Date(a.end);

    let status = "upcoming";
    if (now >= start && now <= end) status = "ongoing";
    else if (end < now) status = "completed";

    return { ...a, status, start, end };
  });

  // ✅ order: completed → ongoing → upcoming
  const ordered = filtered.sort((a, b) => {
    const statusOrder = { completed: 0, ongoing: 1, upcoming: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    // if same status, sort by start time ascending
    return a.start - b.start;
  });

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <h2>Appointments</h2>
        <p className="date-range">{formatDateRange()}</p>
        <div className="appointments-list">
          {ordered.length === 0 ? (
            <p className="no-appointments">No appointments</p>
          ) : (
            ordered.map((a) => (
              <div
                key={a.id}
                className={`appointment-item ${a.status}`}
                onClick={() =>
                  openModal({ appointment: a, fromView: "day" })
                }
              >
                <div className={`status-tag ${a.status}`}>{a.status}</div>
                <div className="title">{a.title}</div>

                {/* ✅ Organizer & Participants */}
                <div className="details">
                  <p className="organizer">
                    <strong>Organizer:</strong> {a.organizerName || "Unknown"}
                  </p>
                  {a.participantNames?.length > 0 && (
                    <p className="participants">
                      <strong>Participants:</strong> {a.participantNames.join(", ")}
                    </p>
                  )}
                </div>

                <div className="time">
                  <div className="start">
                    {a.start.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {a.start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                  <div className="end">
                    {a.end.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {a.end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;


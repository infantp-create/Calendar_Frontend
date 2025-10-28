import React, { useMemo, useState } from "react";
import "../styles/CalendarPanel.sass";
import Header from "./Header";
import Sidebar from "./Sidebar";

const SLOT_HEIGHT = 48;
const SLOT_HEIGHT_WEEK = 28;

const generateSlots = () => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    slots.push({ hour: h, minute: 0 });
    slots.push({ hour: h, minute: 30 });
  }
  return slots;
};

const isPastDateTime = (date, now = new Date()) => date.getTime() < now.getTime();

const CalendarPanel = ({
  view,
  selectedDate,
  appointments,
  setView,
  setSelectedDate,
  openModal,
  modalOpen,
}) => {
  const slots = useMemo(() => generateSlots(), []);
  const rowCount = slots.length + 1;
  const gridRowsStyle = { gridTemplateRows: `repeat(${rowCount}, ${SLOT_HEIGHT}px)` };

  const formatLocalDate = (date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;

  const startOfWeek = (date) => {
    const d = new Date(date);
    const sundayOffset = d.getDay(); // Sunday = 0
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - sundayOffset);
    sunday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      return day;
    });
  };

  const goToDayView = (date) => {
    setSelectedDate(date);
    setView("day");
  };

  const formatTime = (hour, minute) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper to filter appointments for a given day
  const getAppointmentsForDate = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return appointments?.filter(
      (appt) =>
        appt?.start &&
        appt?.end &&
        new Date(appt.end) > dayStart &&
        new Date(appt.start) < dayEnd
    );
  };

  /** DAY VIEW */
  const renderDayView = () => {
    const dayAppts = getAppointmentsForDate(selectedDate);

    return (
      <div className="day-view">
        <div className="time-col" style={gridRowsStyle}>
          {slots.map((s, i) => (
            <div key={i} className="time-slot-label">
              {formatTime(s.hour, s.minute)}
            </div>
          ))}
          <div className="time-slot-label end">11:59 PM</div>
        </div>

        <div className="slots-col" style={gridRowsStyle}>
          {slots.map((s, i) => {
            const dt = new Date(selectedDate);
            dt.setHours(s.hour, s.minute, 0, 0);
            const isPast = isPastDateTime(dt);
            return (
              <div
                key={i}
                className={`timeslot ${isPast ? "past" : ""}`}
                onDoubleClick={() =>
                  !isPast &&
                  openModal({
                    start: new Date(dt),
                    end: new Date(dt.getTime() + 30 * 60000),
                    fromView: "day",
                  })
                }
              />
            );
          })}
          <div className="timeslot end" />

          {dayAppts?.map((appt) => {
            const s = new Date(appt.start);
            const e = new Date(appt.end);

            const dayStart = new Date(selectedDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(selectedDate);
            dayEnd.setHours(23, 59, 59, 999);

            const renderStart = s < dayStart ? dayStart : s;
            const renderEnd = e > dayEnd ? dayEnd : e;

            const top =
              ((renderStart.getHours() * 60 + renderStart.getMinutes()) / 30) * SLOT_HEIGHT;
            const height = ((renderEnd.getTime() - renderStart.getTime()) / (30 * 60000)) * SLOT_HEIGHT;
            const pastAppt = isPastDateTime(e);

            return (
              <div
                key={appt.id}
                className={`appt-block ${pastAppt ? "past-appt" : "upcoming-appt"}`}
                style={{ top: `${top}px`, height: `${height}px` }}
                onClick={() =>
                  openModal({
                    appointment: appt,
                    fromView: "day",
                  })
                }
              >
                <div className="appt-title">{appt.title}</div>
                <div className="appt-type">{appt.type}</div>
                <div className="appt-time">
                  {s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /** WEEK VIEW */
  const renderWeekView = () => {
    const days = startOfWeek(selectedDate);

    return (
      <div className="week-view">
        <div className="week-grid-header" style={{ display: "flex" }}>
          <div className="time-col-empty" style={{ width: "80px" }}></div>
          {days.map((d) => (
            <div
              key={formatLocalDate(d)}
              className="week-day-header"
              style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #ccc" }}
              onClick={() => goToDayView(new Date(d))}
            >
              {d.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
          ))}
        </div>

        <div className="week-grid-body" style={{ display: "flex" }}>
          <div className="time-col" style={{ flexShrink: 0 }}>
            {slots.map((s, i) => (
              <div
                key={i}
                className="time-slot-label"
                style={{
                  height: `${SLOT_HEIGHT_WEEK}px`,
                  borderBottom: "1px solid #e2e6eb",
                  textAlign: "right",
                  paddingRight: "4px",
                  fontSize: "12px",
                }}
              >
                {formatTime(s.hour, s.minute)}
              </div>
            ))}
            <div className="time-slot-label end">11:59 PM</div>
          </div>

          {days.map((d) => {
            const dayKey = formatLocalDate(d);
            const dayAppts = getAppointmentsForDate(d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPastDay = d < today;

            return (
              <div
                key={dayKey}
                className={`week-col ${isPastDay ? "past" : ""}`}
                style={{ position: "relative", flex: 1, borderLeft: "1px solid #ccc" }}
              >
                {slots.map((s, i) => {
                  const dt = new Date(d);
                  dt.setHours(s.hour, s.minute, 0, 0);
                  const isPastSlot = isPastDateTime(dt);

                  return (
                    <div
                      key={i}
                      className={`week-cell ${isPastSlot ? "past" : ""}`}
                      style={{
                        height: `${SLOT_HEIGHT_WEEK}px`,
                        borderBottom: "1px solid #e2e6eb",
                      }}
                      onDoubleClick={() =>
                        !isPastSlot &&
                        openModal({
                          start: new Date(dt),
                          end: new Date(dt.getTime() + 30 * 60000),
                          fromView: "week",
                        })
                      }
                    />
                  );
                })}

                {dayAppts?.map((appt) => {
                  const s = new Date(appt.start);
                  const e = new Date(appt.end);
                  const dayStart = new Date(d);
                  dayStart.setHours(0, 0, 0, 0);
                  const dayEnd = new Date(d);
                  dayEnd.setHours(23, 59, 59, 999);
                  const renderStart = s < dayStart ? dayStart : s;
                  const renderEnd = e > dayEnd ? dayEnd : e;
                  const top =
                    ((renderStart.getHours() * 60 + renderStart.getMinutes()) / 30) *
                    SLOT_HEIGHT_WEEK;
                  const height =
                    ((renderEnd.getTime() - renderStart.getTime()) / (30 * 60000)) *
                    SLOT_HEIGHT_WEEK;
                  const pastAppt = isPastDateTime(e);

                  return (
                    <div
                      key={appt.id}
                      className={`appt-block ${pastAppt ? "past-appt" : "upcoming-appt"}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={() =>
                        openModal({
                          appointment: appt,
                          fromView: "week",
                        })
                      }
                    >
                      <div className="appt-title">{appt.title}</div>
                      <div className="appt-time">
                        {s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /** MONTH VIEW */
  const renderMonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const offset = first.getDay(); // Sunday start
    const startDate = new Date(first);
    startDate.setDate(first.getDate() - offset);

    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });

    return (
      <div className="month-view">
        <div className="month-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
            <div key={wd} className="month-weekday">
              {wd}
            </div>
          ))}

          {days.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const isCurrentMonth = d.getMonth() === month;
            const dayAppts = getAppointmentsForDate(d).slice(0, 3);
            const extra = Math.max(0, getAppointmentsForDate(d).length - 3);

            const startClick = new Date(d);
            startClick.setHours(9, 0, 0, 0);
            const isPast = isPastDateTime(startClick);

            return (
              <div
                key={key}
                className={`month-cell ${isCurrentMonth ? "" : "muted"} ${isPast ? "past" : ""}`}
              >
                <div
                  className="month-cell-top"
                  onClick={() => goToDayView(new Date(d))}
                  style={{ cursor: "pointer" }}
                >
                  {d.getDate()}
                </div>

                <div className="month-appts">
                  {dayAppts.map((a) => {
                    const apptEnd = new Date(a.end);
                    const apptStart = new Date(a.start);
                    const now = new Date();
                    let apptClass = "upcoming";
                    if (apptEnd < now) apptClass = "past";
                    else if (apptStart <= now && apptEnd >= now) apptClass = "ongoing";

                    return (
                      <div
                        key={a.id}
                        className={`month-appt ${apptClass}`}
                        onClick={() =>
                          openModal({
                            appointment: a,
                            fromView: "month",
                          })
                        }
                      >
                        {a.title}
                      </div>
                    );
                  })}

                  {extra > 0 && <div className="more-count">+{extra} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "";
    if (view === "day")
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    if (view === "week") {
      const start = startOfWeek(date)[0];
      const end = startOfWeek(date)[6];
      return `${start.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} - ${end.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;
    }
    if (view === "month")
      return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    return "";
  };

  const goPrev = () => {
    setSelectedDate((prev) => {
      const nd = new Date(prev);
      if (view === "day") nd.setDate(nd.getDate() - 1);
      else if (view === "week") nd.setDate(nd.getDate() - 7);
      else if (view === "month") nd.setMonth(nd.getMonth() - 1);
      return nd;
    });
  };

  const goNext = () => {
    setSelectedDate((prev) => {
      const nd = new Date(prev);
      if (view === "day") nd.setDate(nd.getDate() + 1);
      else if (view === "week") nd.setDate(nd.getDate() + 7);
      else if (view === "month") nd.setMonth(nd.getMonth() + 1);
      return nd;
    });
  };

  const handleNewAppointment = () => {
    let start = new Date(selectedDate);
    start.setHours(9, 0, 0, 0);
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString() && start < now) {
      start = new Date(Math.ceil(now.getTime() / (30 * 60000)) * 30 * 60000);
    }
    const end = new Date(start.getTime() + 30 * 60000);
    openModal({ start, end, fromView: view === "month" ? "month" : "day" });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="calendar-panel-wrapper">
      <Header
        view={view}
        setView={setView}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        formatDate={formatDate ?? new Date()}
        onPrev={goPrev}
        onNext={goNext}
        onNewAppointment={handleNewAppointment}
        disableNavigation={modalOpen}
        onToggleSidebar={toggleSidebar}
      />
      {sidebarOpen && (
        <div className="sidebar-overlay mobile-only" onClick={() => setSidebarOpen(false)}>
          <Sidebar
            view={view}
            selectedDate={selectedDate}
            appointments={appointments}
            openModal={openModal}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}
      <div className="calendar-body-container">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
      </div>
    </div>
  );
};

export default CalendarPanel;

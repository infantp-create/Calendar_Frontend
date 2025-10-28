import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CalendarPanel from "./CalendarPanel";
import AppointmentModal from "./AppointmentModal";
import "../styles/CalendarPage.sass";
import {
  getAppointmentsByDate,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getUsers,
} from "../api/appointment";

// Main Page Component
const CalendarPage = () => {
  const [view, setView] = useState("day"); // day | week | month
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);
  const [users, setUsers] = useState([]);


  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id;


  // 🔹 Fetch users once on load
  useEffect(() => {
    if (!userId) return;
    getUsers()
      .then((res) => setUsers(res))
      .catch((err) => console.error("Failed to load users", err));
  }, [userId]);

  function formatLocalDateTime(date) {
    return date.getFullYear() +
      "-" + String(date.getMonth() + 1).padStart(2, "0") +
      "-" + String(date.getDate()).padStart(2, "0") +
      "T" + String(date.getHours()).padStart(2, "0") +
      ":" + String(date.getMinutes()).padStart(2, "0") +
      ":" + String(date.getSeconds()).padStart(2, "0");
  }


  // 🔹 Fetch appointments whenever selectedDate changes

  const loadAppointments = () => {

    let startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    if (view === "day") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "week") {
      const d = new Date(selectedDate);
      const mondayOffset = (d.getDay() + 6) % 7;
      startDate = new Date(d);
      startDate.setDate(d.getDate() - mondayOffset);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "month") {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const startStr = formatLocalDateTime(startDate);
    const endStr = formatLocalDateTime(endDate);

    getAppointmentsByDate(userId, startStr, endStr)
      .then((res) => {
        setAppointments(res);
      })
      .catch((err) => {
        console.error("Failed to load appointments", err);
        setAppointments([]);
      });
  }

  useEffect(() => {
    if (!userId) return;
    loadAppointments()

  }, [selectedDate, view, userId]);


  // 🔹 Sidebar toggle
 
  // 🔹 Modal control
  const openModal = (payload) => {
    setModalContext(payload);
    setModalOpen(true);
  };

  // 🔹 Save appointment (create)
  const handleSaveAppointment = async (payload) => {
    try {
      console.log("Saving appointment:", payload);
      const newAppt = {
        ...payload,
        createdByUserId: userId,
        participantIds: payload.participantIds || [],
      };
      const res = await createAppointment(newAppt);
      setAppointments((prev) => [...prev, res]);

      if (modalContext?.fromView === "month" || modalContext?.fromView === "dayCell") {
        setView("day");
        setSelectedDate(new Date(res.start));
      }
      loadAppointments()
      setModalOpen(false);
      setModalContext(null);

    } catch (err) {
      console.error("Create failed", err);
    }
  };

  // 🔹 Update appointment
  const handleUpdateAppointment = async (payload) => {
    try {
      const res = await updateAppointment(payload.id, userId, payload);
      setAppointments((prev) =>
        prev.map((a) => (a.id === payload.id ? res.data : a))
      );

      if (modalContext?.fromView === "month" || modalContext?.fromView === "dayCell") {
        setView("day");
        setSelectedDate(new Date(res.start));
      }
      setModalOpen(false);
      setModalContext(null);
      loadAppointments()
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // 🔹 Delete appointment
  const handleDeleteAppointment = async (id) => {
    try {
      await deleteAppointment(id, userId);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setModalOpen(false);
      setModalContext(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };


  return (
    <div className="calendar-page">
      

      <div className="main-content">
        {/* Desktop Sidebar */}
        <div className="sidebar-container desktop-only">
          <Sidebar
            view={view}
            selectedDate={selectedDate}
            appointments={appointments}
            openModal={openModal}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {/* {sidebarOpen && (
          <div
            className="sidebar-overlay mobile-only"
            onClick={() => setSidebarOpen(false)}
          >
            <Sidebar
              view={view}
              selectedDate={selectedDate}
              appointments={appointments}
              openModal={openModal}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )} */}

        <CalendarPanel
          view={view}
          selectedDate={selectedDate}
          appointments={appointments}
          openModal={openModal}
          setView={setView}
          setSelectedDate={setSelectedDate}
          modalOpen={modalOpen}
        />

        <AppointmentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          context={modalContext}
          onSave={handleSaveAppointment}
          onUpdate={handleUpdateAppointment}
          onDelete={handleDeleteAppointment}
          users={users} // 🔹 pass users for guest selection
        />
      </div>
    </div>
  );
};

export default CalendarPage;
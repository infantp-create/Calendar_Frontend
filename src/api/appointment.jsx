
const API_BASE = "http://localhost:5163/api";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Get all appointments for a user
export const getAppointments = async (userId) => {
  const res = await fetch(`${API_BASE}/Appointments/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch appointments");
  return await res.json();
};

// Get appointments by date range
export const getAppointmentsByDate = async (userId, startDate, endDate) => {
  const url = new URL(`${API_BASE}/Appointments/${userId}/bydate`);
  url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch appointments by date");
  return await res.json();
};

// Create appointment
export const createAppointment = async (appointment) => {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(appointment),
  });
  if (!res.ok) throw new Error("Failed to create appointment");
  return await res.json();
};

// Update appointment
export const updateAppointment = async (id, userId, appointment) => {
  const res = await fetch(`${API_BASE}/appointments/${id}/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(appointment),
  });
  if (!res.ok) throw new Error("Failed to update appointment");
  return await res.json();
};

// Delete appointment
export const deleteAppointment = async (id, userId) => {
  const res = await fetch(`${API_BASE}/appointments/${id}/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete appointment");
  return true;
};

// Fetch all users (for guest list)
export const getUsers = async () => {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return await res.json();
};



// import axios from "axios";

// const API_BASE = "http://localhost:5000/api"; // change to your backend URL

// // Get all users (for guest dropdown)
// export const getUsers = () => axios.get(`${API_BASE}/users`);

// // Get appointments by date range
// export const getAppointmentsByDate = (userId, startDate, endDate) =>
//   axios.get(`${API_BASE}/appointments/${userId}/bydate`, {
//     params: { startDate, endDate },
//   });

// // Create appointment
// export const createAppointment = (appointment) =>
//   axios.post(`${API_BASE}/appointments`, appointment);

// // Update appointment
// export const updateAppointment = (id, userId, appointment) =>
//   axios.put(`${API_BASE}/appointments/${id}/${userId}`, appointment);

// // Delete appointment
// export const deleteAppointment = (id, userId) =>
//   axios.delete(`${API_BASE}/appointments/${id}/${userId}`);
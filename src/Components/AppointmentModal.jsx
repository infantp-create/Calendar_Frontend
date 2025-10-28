import React, { useEffect, useState } from "react";
import "../styles/Modal.sass";

export default function AppointmentModal({
  open,
  onClose,
  context,
  onSave,
  onUpdate,
  onDelete,
  users,
}) {
  const appt = context?.appointment || {};
  const isEdit = Boolean(appt?.id);

  const [title, setTitle] = useState(appt.title || "");
  const [description, setDescription] = useState(appt.description || "");
  const [selectedGuests, setSelectedGuests] = useState(appt.participantIds || []);
  const [guestInput, setGuestInput] = useState("");

  const toLocalDateTimeString = (date) => {
    if (!date) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getFullYear() +
      "-" + pad(date.getMonth() + 1) +
      "-" + pad(date.getDate()) +
      "T" + pad(date.getHours()) +
      ":" + pad(date.getMinutes())
    );
  };

  useEffect(() => {
  console.log("Users received in modal:", users);
}, [users]);


  const fromLocalInput = (value) => {
    if (!value) return null;
    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  const [startDateTime, setStartDateTime] = useState(
    appt?.start ? new Date(appt.start) : context?.start ? new Date(context.start) : new Date()
  );
  const [endDateTime, setEndDateTime] = useState(
    appt?.end
      ? new Date(appt.end)
      : context?.end
      ? new Date(context.end)
      : new Date(new Date().getTime() + 30 * 60000)
  );

  const [recurrence, setRecurrence] = useState(appt.recurrenceType || "none");
  const [count, setCount] = useState(appt.recurrenceCount || 0);
  const [recurrenceDays, setRecurrenceDays] = useState(appt.recurrenceDays || []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setTitle(appt.title || "");
      setDescription(appt.description || "");
      setSelectedGuests(appt.participantIds || []);
      setGuestInput("");
      setStartDateTime(appt?.start ? new Date(appt.start) : context?.start ? new Date(context.start) : new Date());
      setEndDateTime(
        appt?.end
          ? new Date(appt.end)
          : context?.end
          ? new Date(context.end)
          : new Date(new Date().getTime() + 30 * 60000)
      );

    setRecurrence(appt.recurrenceType || "none");
    setCount(appt.recurrenceCount || 0);
    setRecurrenceDays(appt.recurrenceDays || []);
    
    } else if (context?.start) {
      setStartDateTime(new Date(context.start));
      setEndDateTime(
        context?.end
          ? new Date(context.end)
          : new Date(new Date().getTime() + 30 * 60000)
      );
      setTitle("");
      setDescription("");
      setSelectedGuests([]);
      setGuestInput("");
      setRecurrence("none");
      setCount(0);
      setRecurrenceDays([]);
    }
  }, [open, context]);

  const toggleDay = (day) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validateTimes = (start, end) => {
    const now = new Date();
    if (start < now) {
      alert("Start time must be in the future");
      return false;
    }
    if (start >= end) {
      alert("End must be after start");
      return false;
    }
    if (recurrence === "weekly" && recurrenceDays.length === 0) {
      alert("Select at least one day for weekly recurrence");
      return false;
    }
    return true;
  };

  const handleGuestSelect = (userId) => {
    if (!selectedGuests.includes(userId)) {
      setSelectedGuests([...selectedGuests, userId]);
    }
  };

  const handleGuestRemove = (userId) => {
    setSelectedGuests(selectedGuests.filter((id) => id !== userId));
  };

  const handleSave = () => {
    if (!title) return alert("Enter title");
    if (!validateTimes(startDateTime, endDateTime)) return;

    onSave({
      title,
      description,
      participantIds: selectedGuests,
      start: toLocalDateTimeString(startDateTime),
      end: toLocalDateTimeString(endDateTime),
      recurrenceType: recurrence === "none" ? null : recurrence,
      recurrenceCount: recurrence === "none" ? null : Number(count),
      recurrenceDays: recurrence === "weekly" ? recurrenceDays : null, // only for weekly
    });
  };

  const handleUpdate = () => {
  if (!isEdit) return;
  if (!validateTimes(startDateTime, endDateTime)) return;

  onUpdate({
    id: appt.id,
    title,
    description,
    participantIds: selectedGuests,
    start: toLocalDateTimeString(startDateTime),
    end: toLocalDateTimeString(endDateTime),
    recurrenceType: recurrence === "none" ? null : recurrence,
    recurrenceCount: recurrence === "none" ? null : Number(count),
    recurrenceDays: recurrence === "weekly" ? recurrenceDays : [],
  });
};


  const handleDelete = () => {
    if (window.confirm("Delete appointment?")) {
      onDelete(appt.id);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? "Edit Appointment" : "New Appointment"}</h3>

        {/* Title & Description */}
        <div className="input-group">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            maxLength={50}
          />
        </div>
        <div className="input-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={250}
            placeholder="Add details"
          />
          <div className="description-counter">{description.length}/250</div>
        </div>

        {/* Guests */}
        {/* Guests */}
        <div className="input-group">
          <label>Invite Attendees</label>
          <div className="guest-tags">
            {selectedGuests.map((id) => {
              const user = users?.find((u) => u.id === id);
              return (
                <span key={id} className="guest-tag">
                  {user?.userName || id}
                  <button onClick={() => handleGuestRemove(id)}>×</button>
                </span>
              );
            })}
            <input
              value={guestInput}
              onChange={(e) => setGuestInput(e.target.value)}
              placeholder="Type name & select"
            />
          </div>

          {/* Horizontal suggestions */}
          {guestInput.trim() && (
            <div className="guest-dropdown">
              {users
                ?.filter(
                  (u) =>
                    u &&
                    u.userName &&
                    !selectedGuests.includes(u.id) &&
                    u.userName
                      .toLowerCase()
                      .startsWith(guestInput.trim().toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="guest-suggestion"
                    onClick={() => {
                      handleGuestSelect(u.id);
                      setGuestInput("");
                    }}
                  >
                    {u.userName}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Start & End Date/Time */}
        <div className="input-group">
          <label>Start</label>
          <input
            type="datetime-local"
            value={toLocalDateTimeString(startDateTime)}
            onChange={(e) => setStartDateTime(fromLocalInput(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label>End</label>
          <input
            type="datetime-local"
            value={toLocalDateTimeString(endDateTime)}
            onChange={(e) => setEndDateTime(fromLocalInput(e.target.value))}
          />
        </div>

        {/* Recurrence */}
        <div className="input-group">
          <label>Repeat / Recurrence</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {recurrence !== "none" && (
          <div className="input-group">
            <label>Repetitions</label>
            <input
              type="number"
              min="1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              placeholder="0"
            />
          </div>
        )}

        {recurrence === "weekly" && (
          <div className="day-selector">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                className={recurrenceDays.includes(d) ? "active" : ""}
                onClick={() => toggleDay(d)}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        <div className="modal-actions">
          {isEdit ? (
            <>
              <button className="btn-primary" onClick={handleUpdate}>
                Save
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Create
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

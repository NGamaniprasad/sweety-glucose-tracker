
import { useCallback, useEffect, useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import ReadingForm from "../components/ReadingForm";
import ReadingList from "../components/ReadingList";

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getToday);

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingReading, setEditingReading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load user-specific readings from Express
  const fetchReadings = useCallback(
    async (signal) => {
      const response = await api.get("/readings", {
        params: {
          date: selectedDate,
        },
        signal,
      });

      return response.data.readings;
    },
    [selectedDate]
  );

  // Reload whenever selected date changes
  useEffect(() => {
    const controller = new AbortController();

    const loadReadings = async () => {
      setLoading(true);
      setError("");
      setReadings([]);

      try {
        const data = await fetchReadings(controller.signal);

        if (!controller.signal.aborted) {
          setReadings(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.message ||
            "Unable to load readings."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadReadings();

    return () => controller.abort();
  }, [fetchReadings]);

  // Select a different date
  const handleDateChange = (event) => {
    const date = event.target.value;

    if (!date) return;

    if (date > getToday()) {
      setError("Date cannot be in the future.");
      return;
    }

    setSelectedDate(date);
    setEditingReading(null);
    setSuccess("");
    setError("");
  };

  // Add or update a reading
  const handleSave = async (payload) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingReading) {
        await api.put(
          `/readings/${editingReading.id}`,
          payload
        );

        setSuccess("Reading updated successfully.");
      } else {
        await api.post("/readings", payload);

        setSuccess("Reading added successfully.");
      }

      // Refresh current date's readings
      const data = await fetchReadings();
      setReadings(data);

      setEditingReading(null);

      return true;
    } catch (err) {
      // Allow the form to show backend validation messages
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Switch to edit mode
  const handleEdit = (reading) => {
    setEditingReading(reading);
    setError("");
    setSuccess("");

    // Bring the form into view on small screens
    document
      .getElementById("reading-form-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingReading(null);
    setError("");
  };

  // Delete with confirmation
  const handleDelete = async (reading) => {
    const confirmed = window.confirm(
      `Delete the ${reading.slot.replaceAll("_", " ")} reading (${reading.value} mg/dl)?`
    );

    if (!confirmed) return;

    setDeletingId(reading.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/readings/${reading.id}`);

      // Refresh readings from database
      const data = await fetchReadings();

      setReadings(data);

      if (editingReading?.id === reading.id) {
        setEditingReading(null);
      }

      setSuccess("Reading deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete reading. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formattedDate = new Date(
    `${selectedDate}T12:00:00`
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="page-container glucose-dashboard">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">
            BLOOD GLUCOSE TRACKER
          </span>

          <h1>
            Welcome, {user?.name || "User"}!
          </h1>

          <p>
            Record and manage your daily glucose readings.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      {/* Date selector and reading count */}
      <section className="dashboard-overview">
        <div className="overview-card">
          <span className="overview-label">
            Selected date
          </span>

          <strong className="overview-value">
            {formattedDate}
          </strong>

          <input
            type="date"
            className="dashboard-date-input"
            aria-label="Select readings date"
            value={selectedDate}
            max={getToday()}
            onChange={handleDateChange}
            disabled={saving || deletingId !== null}
          />
        </div>

        <div className="overview-card">
          <span className="overview-label">
            Readings recorded
          </span>

          <strong className="overview-value">
            {loading ? "..." : `${readings.length} / 4`}
          </strong>

          <span className="overview-hint">
            Maximum 4 readings per day
          </span>
        </div>
      </section>

      {/* Reading form and readings list */}
      <div className="dashboard-grid">
        <div id="reading-form-section">
          <ReadingForm
            selectedDate={selectedDate}
            readings={readings}
            editingReading={editingReading}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving || loading || deletingId !== null}
          />
        </div>

        <ReadingList
          readings={readings}
          loading={loading}
          deletingId={deletingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <p className="dashboard-disclaimer">
        Sweety helps record glucose readings.
        It does not provide medical diagnosis or treatment advice.
      </p>
    </main>
  );
}

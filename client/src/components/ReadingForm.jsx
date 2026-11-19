
import { useEffect, useState } from "react";

export const SLOT_OPTIONS = [
  { value: "morning", label: "Morning (fasting)" },
  { value: "after_breakfast", label: "After breakfast" },
  { value: "after_lunch", label: "After lunch" },
  { value: "after_dinner", label: "After dinner" },
];

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function ReadingForm({
  selectedDate,
  readings,
  editingReading,
  onSave,
  onCancel,
  saving,
}) {
  const [form, setForm] = useState({
    reading_date: selectedDate,
    slot: "morning",
    value: "",
  });

  const [error, setError] = useState("");

  // Reset form when selected date or edited reading changes
  useEffect(() => {
    if (editingReading) {
      setForm({
        reading_date: editingReading.reading_date,
        slot: editingReading.slot,
        value: String(editingReading.value),
      });
    } else {
      setForm({
        reading_date: selectedDate,
        slot: "morning",
        value: "",
      });
    }

    setError("");
  }, [editingReading, selectedDate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Rule 1: Value is required
    if (form.value.trim() === "") {
      setError("Please enter a glucose value.");
      return;
    }

    const numericValue = Number(form.value);

    // Rule 2: Whole number between 40 and 600
    if (
      !/^\d+$/.test(form.value.trim()) ||
      !Number.isSafeInteger(numericValue) ||
      numericValue < 40 ||
      numericValue > 600
    ) {
      setError("Value must be between 40 and 600 mg/dl.");
      return;
    }

    if (!form.reading_date) {
      setError("Please select a date.");
      return;
    }

    // Rule 5: No future dates
    if (form.reading_date > getToday()) {
      setError("Date cannot be in the future.");
      return;
    }

    if (!SLOT_OPTIONS.some((s) => s.value === form.slot)) {
      setError("Please select a valid time slot.");
      return;
    }

    // Checks below apply to readings for this form's date
    const sameDayReadings = readings.filter(
      (reading) =>
        reading.reading_date === form.reading_date &&
        reading.id !== editingReading?.id
    );

    // Rule 4: Maximum four readings
    if (sameDayReadings.length >= 4) {
      setError("You can add only 4 readings per day.");
      return;
    }

    // Rule 3: No duplicate slot
    const duplicate = sameDayReadings.find(
      (reading) => reading.slot === form.slot
    );

    if (duplicate) {
      const label = SLOT_OPTIONS.find(
        (s) => s.value === form.slot
      )?.label;

      const article =
        form.slot === "morning" ? "a" : "an";

      setError(
        `You already have ${article} ${label} reading for this date.`
      );
      return;
    }

    const payload = {
      reading_date: form.reading_date,
      slot: form.slot,
      value: numericValue,
    };

    try {
      const saved = await onSave(payload);

      if (saved) {
        setError("");

        if (!editingReading) {
          setForm({
            reading_date: selectedDate,
            slot: "morning",
            value: "",
          });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save reading. Please try again."
      );
    }
  };

  return (
    <section className="reading-panel">
      <div className="panel-header">
        <div>
          <h2>
            {editingReading
              ? "Edit glucose reading"
              : "Add glucose reading"}
          </h2>

          <p>
            {editingReading
              ? "Update the selected reading."
              : "Record your blood glucose value."}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="reading-form"
        noValidate
      >
        <div className="form-group">
          <label htmlFor="reading-date">Date</label>

          <input
            id="reading-date"
            name="reading_date"
            type="date"
            value={form.reading_date}
            max={getToday()}
            onChange={handleChange}
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reading-slot">Time slot</label>

          <select
            id="reading-slot"
            name="slot"
            value={form.slot}
            onChange={handleChange}
            disabled={saving}
          >
            {SLOT_OPTIONS.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reading-value">
            Glucose value (mg/dl)
          </label>

          <input
            id="reading-value"
            name="value"
            type="number"
            step="1"
            min="40"
            max="600"
            placeholder="Example: 110"
            value={form.value}
            onChange={handleChange}
            disabled={saving}
          />

          <span className="field-hint">
            Enter a whole number from 40 to 600.
          </span>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingReading
              ? "Update reading"
              : "Add reading"}
          </button>

          {editingReading && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

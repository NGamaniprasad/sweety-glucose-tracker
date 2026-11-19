
const SLOT_LABELS = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

const SLOT_ORDER = {
  morning: 1,
  after_breakfast: 2,
  after_lunch: 3,
  after_dinner: 4,
};

export default function ReadingList({
  readings,
  loading,
  deletingId,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <section className="reading-panel">
        <h2>My readings</h2>
        <p className="empty-state" role="status">
          Loading readings...
        </p>
      </section>
    );
  }

  const sortedReadings = [...readings].sort(
    (a, b) =>
      (SLOT_ORDER[a.slot] || 99) -
      (SLOT_ORDER[b.slot] || 99)
  );

  return (
    <section className="reading-panel">
      <div className="panel-header">
        <div>
          <h2>My readings</h2>
          <p>
            View and manage your saved readings.
          </p>
        </div>

        <span className="reading-count">
          {readings.length} of 4
        </span>
      </div>

      {readings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♡</div>
          <h3>No readings yet</h3>
          <p>
            Add your first glucose reading for this date.
          </p>
        </div>
      ) : (
        <div className="reading-list">
          {sortedReadings.map((reading) => (
            <div
              className="reading-item"
              key={reading.id}
            >
              <div className="reading-details">
                <span className="reading-slot">
                  {SLOT_LABELS[reading.slot] ||
                    reading.slot}
                </span>

                <div className="reading-value">
                  <strong>{reading.value}</strong>
                  <span>mg/dl</span>
                </div>
              </div>

              <div className="reading-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={() => onEdit(reading)}
                  disabled={deletingId !== null}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => onDelete(reading)}
                  disabled={deletingId !== null}
                >
                  {deletingId === reading.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

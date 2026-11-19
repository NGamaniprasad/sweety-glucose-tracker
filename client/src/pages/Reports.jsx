
import { useEffect, useState } from "react";

import api from "../api/axios";
import ReportCard from "../components/ReportCard";
import { useAuth } from "../context/AuthContext";

const REPORT_TYPES = [
  {
    id: "daily",
    label: "Daily",
    endpoint: "/reports/daily",
  },
  {
    id: "month_to_date",
    label: "Month-to-date",
    endpoint: "/reports/month-to-date",
  },
  {
    id: "previous_month",
    label: "Previous month",
    endpoint: "/reports/previous-month",
  },
];

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

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  return new Date(
    `${dateString}T12:00:00`
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function Reports() {
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getToday);
  const [reportType, setReportType] = useState("daily");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Automatically fetch a report when date or type changes
  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      setLoading(true);
      setError("");
      setReport(null);

      try {
        const config = REPORT_TYPES.find(
          (item) => item.id === reportType
        );

        if (!config) {
          throw new Error("Invalid report type.");
        }

        const response = await api.get(
          config.endpoint,
          {
            params: { date: selectedDate },
            signal: controller.signal,
          }
        );

        if (!controller.signal.aborted) {
          setReport(response.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to load report. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [selectedDate, reportType]);

  const handleDateChange = (event) => {
    const date = event.target.value;

    if (!date) return;

    if (date > getToday()) {
      setError("Date cannot be in the future.");
      return;
    }

    setSelectedDate(date);
  };

  const sortedReadings = [...(report?.readings || [])]
    .sort(
      (a, b) =>
        (SLOT_ORDER[a.slot] || 99) -
        (SLOT_ORDER[b.slot] || 99)
    );

  return (
    <main className="page-container reports-page">
      <div className="page-heading">
        <span className="eyebrow">
          GLUCOSE REPORTS
        </span>

        <h1>My glucose reports</h1>

        <p>
          Hello, {user?.name || "User"}.
          View your daily and monthly blood glucose
          statistics.
        </p>
      </div>

      {/* Date and report selection */}
      <section className="reports-filter-panel">
        <div className="form-group">
          <label htmlFor="report-date">
            Select report date
          </label>

          <input
            id="report-date"
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={handleDateChange}
          />
        </div>

        <div className="report-tabs" role="group"
          aria-label="Report period"
        >
          {REPORT_TYPES.map((type) => (
            <button
              type="button"
              key={type.id}
              className={
                reportType === type.id
                  ? "report-tab active"
                  : "report-tab"
              }
              aria-pressed={reportType === type.id}
              onClick={() => setReportType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </section>

      {/* API error */}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <section
          className="report-content-panel"
          role="status"
        >
          <div className="reports-loading">
            <div className="report-spinner" />
            <p>Loading your glucose report...</p>
          </div>
        </section>
      )}

      {/* Loaded report */}
      {!loading && !error && report && (
        <>
          <section className="report-content-panel">
            <div className="report-section-heading">
              <div>
                <h2>
                  {REPORT_TYPES.find(
                    (type) => type.id === reportType
                  )?.label} report
                </h2>

                <p>
                  {formatDate(report.date_range.start)}
                  {" — "}
                  {formatDate(report.date_range.end)}
                </p>
              </div>

              <span className="report-date-badge">
                {formatDate(selectedDate)}
              </span>
            </div>

            <ReportCard report={report} />

            {!report.has_data && (
              <div
                className="report-empty-state"
                role="status"
              >
                <div className="report-empty-icon">
                  ♡
                </div>

                <h3>No readings found</h3>

                <p>
                  No glucose readings were recorded for
                  this period. You can add readings from
                  your dashboard.
                </p>
              </div>
            )}
          </section>

          {/* Daily report individual readings */}
          {reportType === "daily" &&
            report.has_data && (
              <section className="report-content-panel">
                <div className="report-section-heading">
                  <div>
                    <h2>Daily reading details</h2>

                    <p>
                      Glucose values for{" "}
                      {formatDate(selectedDate)}
                    </p>
                  </div>

                  <span className="reading-count">
                    {sortedReadings.length} of 4
                  </span>
                </div>

                <div className="daily-report-list">
                  {sortedReadings.map((reading) => (
                    <div
                      className="daily-report-item"
                      key={reading.id}
                    >
                      <div>
                        <span className="daily-report-slot">
                          {SLOT_LABELS[reading.slot] ||
                            reading.slot}
                        </span>
                      </div>

                      <div className="daily-report-value">
                        <strong>{reading.value}</strong>
                        <span>mg/dl</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </>
      )}

      <p className="dashboard-disclaimer">
        Sweety reports summarize recorded values.
        They do not provide medical diagnosis
        or treatment advice.
      </p>
    </main>
  );
}


export default function ReportCard({ report }) {
  const hasData = report?.has_data && report.count > 0;

  const formatAverage = (value) => {
    if (value === null || value === undefined) {
      return "--";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toFixed(1)
      : "--";
  };

  const metrics = [
    {
      label: "Highest",
      value: hasData ? report.highest : "--",
      unit: "mg/dl",
    },
    {
      label: "Lowest",
      value: hasData ? report.lowest : "--",
      unit: "mg/dl",
    },
    {
      label: "Average",
      value: hasData
        ? formatAverage(report.average)
        : "--",
      unit: "mg/dl",
    },
    {
      label: "Total readings",
      value: report?.count ?? 0,
      unit: "readings",
    },
  ];

  return (
    <div className="report-summary">
      {metrics.map((metric) => (
        <article
          className="report-stat-card"
          key={metric.label}
        >
          <p className="report-stat-label">
            {metric.label}
          </p>

          <div className="report-stat-value">
            <strong>{metric.value}</strong>
            <span>{metric.unit}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "18px",
        minWidth: "190px",
        backgroundColor: "#111827",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
      }}
    >
      <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
        {title}
      </p>

      <h2 style={{ margin: "8px 0", fontSize: "28px", color: "#f8fafc" }}>
        {value}
      </h2>

      {subtitle && (
        <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default StatCard;
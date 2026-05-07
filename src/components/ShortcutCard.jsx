import { Link } from "react-router-dom";

function ShortcutCard({ title, description, to }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "18px",
        backgroundColor: "#111827",
        color: "#e5e7eb",
        textDecoration: "none",
        minWidth: "220px",
        flex: "1",
      }}
    >
      <h3 style={{ margin: "0 0 8px 0", color: "#f8fafc" }}>{title}</h3>

      <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
        {description}
      </p>
    </Link>
  );
}

export default ShortcutCard;
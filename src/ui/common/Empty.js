import React from "react";

export default function Empty({ icon = "💬", title, body, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      {title && <div className="empty-title">{title}</div>}
      {body && <div className="empty-body">{body}</div>}
      {action}
    </div>
  );
}

export function Spinner({ size = 22 }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

export function SkeletonList({ rows = 7 }) {
  return (
    <div className="skel-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <div className="skeleton" style={{ height: 13, width: `${45 + ((i * 13) % 35)}%` }} />
            <div className="skeleton" style={{ height: 11, width: `${60 + ((i * 7) % 30)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

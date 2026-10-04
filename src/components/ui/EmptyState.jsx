import React from "react";
import { Film } from "lucide-react";

export const EmptyState = ({
  icon: Icon = Film,
  title = "No items found",
  description = "There are no items to display at this moment.",
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        border: "1px dashed var(--border-default)",
        margin: "24px 0",
      }}
    >
      <div
        style={{
          width: "68px",
          height: "68px",
          borderRadius: "var(--radius-full)",
          background: "var(--accent-gradient-subtle)",
          color: "var(--accent-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "18px",
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: "1.25rem", marginBottom: "8px", fontWeight: 700 }}>
        {title}
      </h3>
      <p
        style={{
          color: "var(--text-secondary)",
          maxWidth: "420px",
          fontSize: "0.9375rem",
          marginBottom: actionText ? "24px" : "0",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

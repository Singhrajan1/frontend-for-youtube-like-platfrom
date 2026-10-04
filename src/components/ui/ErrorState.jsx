import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load the content. Please try again.",
  onRetry,
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
        border: "1px solid rgba(239, 68, 68, 0.2)",
        margin: "24px 0",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "var(--radius-full)",
          background: "var(--status-error-bg)",
          color: "var(--status-error)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <AlertCircle size={32} />
      </div>
      <h3 style={{ fontSize: "1.25rem", marginBottom: "8px", fontWeight: 700 }}>
        {title}
      </h3>
      <p
        style={{
          color: "var(--text-secondary)",
          maxWidth: "420px",
          fontSize: "0.9375rem",
          marginBottom: onRetry ? "20px" : "0",
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

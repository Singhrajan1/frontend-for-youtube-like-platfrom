import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action? This cannot be undone.",
  confirmText = "Delete",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${confirmVariant === "danger" ? "btn-danger" : "btn-primary"}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-full)",
            background: "var(--status-error-bg)",
            color: "var(--status-error)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

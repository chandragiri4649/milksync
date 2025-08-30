import React from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        role="document"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 20,
          maxWidth: 400,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
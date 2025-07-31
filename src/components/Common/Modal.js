import React, { useEffect } from "react";

/**
 * Simple modal wrapper for overlays, used by all modals.
 * Props: onClose, children
 */
const Modal = ({ onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-60 transition-opacity"
        onClick={onClose}
        aria-label="Close modal overlay"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Modal;

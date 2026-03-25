import React, { useEffect } from "react";
import { type receivedImage, SM } from "../types";

interface ImageModalProps {
  receivedImage: receivedImage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ receivedImage, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !receivedImage) return null;

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <div className="display-font" style={{ fontSize: "22px", color: "var(--accent)" }}>
              Stage Image
            </div>
            <div style={{ fontSize: "13px", color: "var(--text3)", marginTop: "2px" }}>
              {SM[receivedImage.stage].icon} {SM[receivedImage.stage].label} — detected by ESP32
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            ✕ Close
          </button>
        </div>
        <img src={receivedImage.url} alt="detected stage" />
        <div
          className="d-flex justify-content-between mt-3 flex-wrap gap-2"
          style={{ fontSize: "12px", color: "var(--text3)" }}
        >
          <div>
            Confidence:{" "}
            <span className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
              {receivedImage.confidence}%
            </span>
          </div>
          <div>
            Received:{" "}
            <span className="mono">{new Date(receivedImage.ts).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

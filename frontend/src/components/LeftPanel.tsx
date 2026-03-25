import React from "react";
import { type Payload, type receivedImage, type sensorData, STAGES, SM } from "../types";

interface LeftPanelProps {
  payload: Payload;
  receivedImage: receivedImage | null;
  sensorData: sensorData;
  override: boolean | null;
  setOverride: (val: boolean | null) => void;
  setIsModalOpen: (val: boolean) => void;
}

const Gauge = ({
  v,
  max,
  label,
  unit,
  color,
  icon,
}: {
  v: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  icon: string;
}) => {
  const r = 34,
    C = 2 * Math.PI * r;
  const off = C - Math.min(v / max, 1) * C;
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 100 100" style={{ width: "84px", height: "84px" }}>
        <circle cx="50" cy="50" r="34" fill="none" stroke="#e8ddd0" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={C.toFixed(2)}
          strokeDashoffset={off.toFixed(2)}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="50" y="44" textAnchor="middle" fontSize="16">
          {icon}
        </text>
        <text x="50" y="63" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
          {v}
          {unit}
        </text>
      </svg>
      <div style={{ fontSize: "10px", color: "var(--text3)", fontWeight: 700, marginTop: "1px" }}>
        {label}
      </div>
    </div>
  );
};

export const LeftPanel: React.FC<LeftPanelProps> = ({
  payload,
  receivedImage,
  sensorData,
  override,
  setOverride,
  setIsModalOpen,
}) => {
  const getImageSrc = (b64: string) => {
    if (b64.startsWith("data:image")) return b64;
    return `data:image/jpeg;base64,${b64}`;
  };
  return (
    <>
      <div className="cardSoil">
        <div className="secLabel">Detected Stage Image</div>
        <div
          className={`imgCard ${receivedImage ? "hasImg" : ""}`}
          onClick={() => {
            if (receivedImage) {
              setIsModalOpen(true);
            }
          }}
        >
          {receivedImage ? (
            <>
              <img src={getImageSrc(receivedImage.b64)} alt="Detected" />
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "12px",
                  background: "rgba(44,31,14,.7)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: "20px",
                  letterSpacing: ".5px",
                }}
              >
                CLICK TO EXPAND
              </div>
            </>
          ) : (
            <div className="noImg">
              <div style={{ fontSize: "38px", marginBottom: "8px" }}>None</div>
              <div style={{ fontSize: "13px", color: "var(--text2)", fontWeight: 700 }}>
                No image received yet
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "3px" }}>
                Waiting for ESP32…
              </div>
            </div>
          )}
        </div>
        <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
          <div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>Confidence</div>
            <div className="mono display-font" style={{ fontSize: "22px", color: "var(--accent)" }}>
              {payload.confidence}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>Location</div>
            <div className="mono" style={{ fontSize: "12px", color: "var(--text2)" }}>
              {payload.location}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>Time</div>
            <div className="mono" style={{ fontSize: "12px", color: "var(--text2)" }}>
              {receivedImage ? new Date(receivedImage.ts).toLocaleTimeString() : "--"}
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => setIsModalOpen(true)}
            disabled={!receivedImage}
          >
            View Full
          </button>
        </div>
      </div>

      <div className="cardSoil">
        <div className="secLabel">Growth Stage</div>
        <div className="tl-wrap">
          {(["nonFlowering", "flower", "green", "turningRed", "ripe"] as const).map((stg, i) => {
            const visualStages = ["nonFlowering", "flower", "green", "turningRed", "ripe"];
            const ci = visualStages.indexOf(payload.growthStage);
            const sm = SM[stg];

            // This ensures no stage lights up until actual growth is detected.
            const active = i === ci;
            const done = ci !== -1 && i < ci;

            const nb = active ? sm.color : done ? sm.color + "99" : "var(--bg2)";
            const nc = active || done ? "#fff" : "var(--text3)";
            const nd = active ? sm.color : done ? sm.color + "66" : "var(--border)";

            return (
              <div key={stg} className="tl-item">
                <div
                  className="tl-node"
                  style={{
                    background: nb,
                    borderColor: nd,
                    color: nc,
                    boxShadow: active ? `0 0 0 3px ${sm.color}33` : "none",
                  }}
                >
                  {sm.icon}
                </div>
                <div
                  className="tl-lbl"
                  style={{ color: active ? sm.color : done ? sm.color + "aa" : "var(--text3)" }}
                >
                  {sm.label}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="d-flex justify-content-evenly mt-3 pt-2"
          style={{ borderTop: "1px solid var(--border)", fontSize: "13px" }}
        >
          <Gauge
            v={sensorData.soilMoisture}
            max={100}
            label="Moisture"
            unit="%"
            color="#2980b9"
            icon="💧"
          />
          <Gauge
            v={sensorData.humidity}
            max={100}
            label="Humidity"
            unit="%"
            color="#16a085"
            icon="🌫️"
          />
          <Gauge
            v={sensorData.temperature}
            max={50}
            label="Temp"
            unit="°"
            color="#c0392b"
            icon="🌡️"
          />
        </div>
      </div>
    </>
  );
};

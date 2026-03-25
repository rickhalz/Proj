import React from "react";
import { type sensorData } from "../types";

// Internal SVG Gauge Component
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

export const MiddlePanel = ({ sensorData: s }: { sensorData: sensorData }) => (
  <>
    <div className="cardSoil">
      <div className="secLabel">Live Readings</div>
      <div className="d-flex justify-content-around flex-wrap gap-3">
        <Gauge v={s.soilMoisture} max={100} label="Moisture" unit="%" color="#2980b9" icon="💧" />
        <Gauge v={s.humidity} max={100} label="Humidity" unit="%" color="#16a085" icon="🌫️" />
        <Gauge v={s.temperature} max={50} label="Temp" unit="°" color="#c0392b" icon="🌡️" />
      </div>
    </div>

    <div className="cardSoil">
      <div className="secLabel">📊 Sensor Detail</div>
      {[
        { label: "Soil Moisture", v: s.soilMoisture, max: 100, unit: "%", color: "#2980b9" },
        { label: "Temperature", v: s.temperature, max: 50, unit: "°C", color: "#c0392b" },
        { label: "Humidity", v: s.humidity, max: 100, unit: "%", color: "#16a085" },
      ].map((b) => (
        <div key={b.label} className="sensor-row">
          <div style={{ fontSize: "12px", color: "var(--text2)", width: "108px", fontWeight: 600 }}>
            {b.label}
          </div>
          <div className="ptrack">
            <div
              className="pfill"
              style={{ width: `${Math.min((b.v / b.max) * 100, 100)}%`, background: b.color }}
            ></div>
          </div>
          <div
            className="mono"
            style={{
              fontSize: "11px",
              color: b.color,
              width: "58px",
              textAlign: "right",
              fontWeight: 700,
            }}
          >
            {b.v}
            {b.unit}
          </div>
        </div>
      ))}
    </div>
  </>
);

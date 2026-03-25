import React from "react";
import { type historyPoint } from "../types";

// Internal Trend Chart Component
const TrendChart = ({ history }: { history: historyPoint[] }) => {
  const W = 400,
    H = 90,
    pad = 8;
  const step = history.length > 1 ? (W - pad * 2) / (history.length - 1) : 0;

  const mp = history.map((d, i) => [pad + i * step, H - pad - (d.m / 100) * (H - pad * 2)]);
  const tp = history.map((d, i) => [pad + i * step, H - pad - (d.t / 50) * (H - pad * 2)]);

  const str = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");
  const area = (pts: number[][], h: number) =>
    pts.length ? `${pts[0][0]},${h} ${str(pts)} ${pts[pts.length - 1][0]},${h}` : "";

  return (
    <svg viewBox="0 0 400 90" style={{ width: "100%", height: "90px", overflow: "visible" }}>
      <defs>
        <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2980b9" stopOpacity=".2" />
          <stop offset="100%" stopColor="#2980b9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0392b" stopOpacity=".2" />
          <stop offset="100%" stopColor="#c0392b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="8" y1="20" x2="392" y2="20" stroke="var(--border)" strokeWidth=".6" />
      <line x1="8" y1="50" x2="392" y2="50" stroke="var(--border)" strokeWidth=".6" />
      <line x1="8" y1="80" x2="392" y2="80" stroke="var(--border)" strokeWidth=".6" />
      <polygon fill="url(#mGrad)" points={area(mp, H)} />
      <polygon fill="url(#tGrad)" points={area(tp, H)} />
      <polyline
        fill="none"
        stroke="#2980b9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={str(mp)}
      />
      <polyline
        fill="none"
        stroke="#c0392b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={str(tp)}
      />
    </svg>
  );
};

export const RightPanel = ({ history }: { history: historyPoint[] }) => {
  const avgM = history.length
    ? (history.reduce((a, b) => a + b.m, 0) / history.length).toFixed(1) + "%"
    : "–";
  const avgT = history.length
    ? (history.reduce((a, b) => a + b.t, 0) / history.length).toFixed(1) + "°C"
    : "–";
  const irrEv = history.filter((h) => h.m < 44).length;

  return (
    <>
      <div className="cardSoil">
        <div className="secLabel">📋 Session Summary</div>
        <div className="row g-2">
          {[
            { lbl: "Avg Moisture", val: avgM, col: "#2980b9" },
            { lbl: "Avg Temp", val: avgT, col: "#c0392b" },
            { lbl: "Updates", val: history.length, col: "var(--amber)" },
            { lbl: "Irrigations", val: irrEv, col: "#16a085" },
          ].map((d) => (
            <div key={d.lbl} className="col-6">
              <div className="stat-pill">
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text3)",
                    fontWeight: 700,
                    letterSpacing: ".5px",
                    textTransform: "uppercase",
                  }}
                >
                  {d.lbl}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: "22px", fontWeight: 700, color: d.col, lineHeight: 1.2 }}
                >
                  {d.val}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cardSoil">
        <div className="secLabel">🗒 Event Log</div>
        <div id="log-container">
          {history.length ? (
            [...history]
              .reverse()
              .slice(0, 12)
              .map((h, i) => (
                <div key={i} className="log-row">
                  <span className="mono" style={{ fontSize: "10px" }}>
                    {new Date(h.ts).toLocaleTimeString()}
                  </span>
                  <span>
                    💧{h.m}% &nbsp;🌡️{h.t}°C
                    {h.m < 44 && (
                      <span style={{ color: "#2980b9", marginLeft: "4px", fontWeight: 700 }}>
                        {" "}
                        💦
                      </span>
                    )}
                  </span>
                </div>
              ))
          ) : (
            <div style={{ fontSize: "12px", color: "var(--text3)" }}>Collecting…</div>
          )}
        </div>
      </div>
    </>
  );
};

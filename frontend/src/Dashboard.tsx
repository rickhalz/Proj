import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { espAddr, type Payload, type historyPoint, type receivedImage } from "./types";
import { LeftPanel } from "./components/LeftPanel";
// import { MiddlePanel } from "./components/MidPanel"; //
import { RightPanel } from "./components/RightPanel";

const tempPayload: Payload = {
  devId: "Waiting...",
  imageUrl: null,
  location: "-",
  growthStage: "undetected",
  confidence: 0,
  irrigationActive: false,
  sensorData: {
    timestamp: "-",
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
  },
  alerts: [],
};

export default function Dashboard() {
  const [history, setHistory] = useState<historyPoint[]>([]);
  const [lastP, setLastP] = useState<Payload | null>(null);
  const [receivedImg, setReceivedImg] = useState<receivedImage | null>(null);
  const [clock, setClock] = useState("--:--:--");
  const [statusLabel, setStatusLabel] = useState("CONNECTING...");

  useEffect(() => {
    const fetchReal = async () => {
      try {
        // Reduced timeout slightly to keep UI snappy
        const r = await fetch(espAddr, { signal: AbortSignal.timeout(5000) });
        if (!r.ok) throw new Error("Bad response");
        return (await r.json()) as Payload;
      } catch (err) {
        console.error("Fetch error:", err);
        return null;
      }
    };

    const tick = async () => {
      const p = await fetchReal();
      setClock(new Date().toLocaleTimeString());

      if (!p) {
        setStatusLabel("OFFLINE");
        return;
      }

      setStatusLabel("LIVE");
      setLastP(p);

      setHistory((prev) => {
        const newPoint = {
          m: p.sensorData.soilMoisture,
          t: p.sensorData.temperature,
          ts: p.sensorData.timestamp || new Date().toLocaleTimeString(),
        };
        return [...prev.slice(-29), newPoint];
      });

      // IMAGE UPDATE LOGIC
      if (p.imageUrl) {
        setReceivedImg((current) => {
          if (!current || p.imageUrl !== current.url) {
            return {
              url: p.imageUrl as string,
              ts: p.sensorData.timestamp || new Date().toLocaleTimeString(),
              stage: p.growthStage,
              confidence: p.confidence,
            };
          }
          return current;
        });
      }
    };

    tick();
    const id = setInterval(tick, 3000);

    return () => clearInterval(id);
  }, []);

  const displayPayload = lastP || tempPayload;

  return (
    <div className="dash-root">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1
            className="display-font mb-0"
            style={{ fontSize: "30px", color: "var(--accent)", lineHeight: 1.1 }}
          >
            🍓 Strawberry Growth Stage Monitor 🍓
          </h1>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="hpill">
            <span className={statusLabel === "OFFLINE" ? "off-dot" : "live-dot"}></span>
            <span>{statusLabel}</span>
            <span style={{ color: "var(--border2)" }}>·</span>
            <span className="mono" style={{ fontSize: "11px" }}>
              {clock}
            </span>
          </div>
          <div className="hpill mono" style={{ fontSize: "11px" }}>
            {displayPayload.devId}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 d-flex flex-column gap-3">
          <LeftPanel
            payload={displayPayload}
            receivedImage={receivedImg}
            sensorData={displayPayload.sensorData}
          />
        </div>
        <div className="col-lg-4 d-flex flex-column gap-3">
          <RightPanel history={history} />
        </div>
      </div>
    </div>
  );
}

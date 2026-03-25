import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { espAddr, type Payload, type historyPoint, type receivedImage } from "./types";
import { LeftPanel } from "./components/LeftPanel";
// import { MiddlePanel } from "./components/MidPanel"; // Commented out per your layout
import { RightPanel } from "./components/RightPanel";
import { ImageModal } from "./components/ImageModal";

const tempPayload: Payload = {
  devId: "Waiting...",
  imageb64: null,
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
  const [override, setOverride] = useState<boolean | null>(null);
  const [history, setHistory] = useState<historyPoint[]>([]);
  const [lastP, setLastP] = useState<Payload | null>(null);
  const [receivedImg, setReceivedImg] = useState<receivedImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

      // Update History
      setHistory((prev) => {
        const newPoint = {
          m: p.sensorData.soilMoisture,
          t: p.sensorData.temperature,
          ts: p.sensorData.timestamp || new Date().toLocaleTimeString(),
        };
        return [...prev.slice(-29), newPoint];
      });

      // IMAGE UPDATE LOGIC
      // We check if the image exists and if it's different from what we currently have
      if (p.imageb64) {
        setReceivedImg((current) => {
          // Only update state if the image string has actually changed
          if (!current || p.imageb64 !== current.b64) {
            return {
              b64: p.imageb64 as string,
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

    // CLEANUP: Clear the interval when component unmounts
    return () => clearInterval(id);

    // REMOVED receivedImg from here to prevent infinite loop/re-renders
  }, []);

  const displayPayload = lastP || tempPayload;

  return (
    <div className="dash-root">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1
            className="display-font mb-0"
            style={{ fontSize: "30px", color: "var(--accent)", lineHeight: 1.1 }}
          >
            🍓 Strawberry Growth Stage Monitor
          </h1>
          <p className="text-muted mb-0">{displayPayload.location}</p>
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

      {/* DASHBOARD GRID */}
      <div className="row">
        <div className="col-lg-8 d-flex flex-column gap-3">
          <LeftPanel
            payload={displayPayload}
            receivedImage={receivedImg}
            sensorData={displayPayload.sensorData}
            override={override}
            setOverride={setOverride}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
        <div className="col-lg-4 d-flex flex-column gap-3">
          <RightPanel history={history} />
        </div>
      </div>

      <ImageModal
        receivedImage={receivedImg}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

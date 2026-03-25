export const espAddr = "http://localhost:3001/api/data";

export type stageName =
  | "undetected"
  | "nonFlowering"
  | "flower"
  | "green"
  | "turningRed"
  | "ripe"
  | "damaged";

export interface stageData {
  label: string;
  color: string;
  bg: string;
  icon: string;
  water: string;
}

export interface sensorData {
  timestamp: string;
  soilMoisture: number;
  temperature: number;
  humidity: number;
}

export interface Payload {
  devId: string;
  imageUrl: string | null;
  location: string;
  growthStage: stageName;
  confidence: number;
  irrigationActive: boolean;
  sensorData: sensorData;
  alerts: string[];
}

export interface historyPoint {
  m: number;
  t: number;
  ts: string;
}

export interface receivedImage {
  url: string;
  ts: string;
  stage: stageName;
  confidence: number;
}

export const STAGES: stageName[] = [
  "undetected",
  "nonFlowering",
  "flower",
  "green",
  "turningRed",
  "ripe",
  "damaged",
];

export const SM: Record<stageName, stageData> = {
  undetected: {
    label: "Waiting for data...",
    color: "#888888",
    bg: "#f0f0f0",
    icon: "",
    water: "-",
  },
  nonFlowering: { label: "Vegetative", color: "#2e7d32", bg: "#e8f5e9", icon: "1", water: "..." },
  flower: { label: "Flower", color: "#d45e8e", bg: "#fdeef5", icon: "2", water: "..." },
  green: { label: "Green", color: "#1e8a3e", bg: "#e0f4e8", icon: "3", water: "..." },
  turningRed: { label: "Turning-red", color: "#c0392b", bg: "#fdecea", icon: "4", water: "..." },
  ripe: { label: "Ripe", color: "#9b2019", bg: "#f8e6e4", icon: "5", water: "..." },
  damaged: { label: "Damaged", color: "#000000", bg: "#000000", icon: "6", water: "..." },
};

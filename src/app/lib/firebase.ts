import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, ref, serverTimestamp, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAuPoG-PETHdW8DskMYsUsokTPdu5iEC0k",
  authDomain: "smart-tracker-cca9d.firebaseapp.com",
  databaseURL: "https://smart-tracker-cca9d-default-rtdb.firebaseio.com",
  projectId: "smart-tracker-cca9d",
  storageBucket: "smart-tracker-cca9d.firebasestorage.app",
  messagingSenderId: "1085339015056",
  appId: "1:1085339015056:web:6257b9770be79a1669c515"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

const controlRef = ref(database, "vehicles/TRK-07/control");
const buttonMetadataRef = ref(database, "vehicles/TRK-07/button_metadata");

export type ControlPayload = Record<string, boolean | number | string | null>;

// Button Type Definitions - Metadata Permanen
export const BUTTON_METADATA = {
  triangle: {
    id: "triangle",
    shape: "triangle",
    name: "SAFE",
    description: "Triangle Button - Safe Zone Control",
    purpose: "Safety Control",
    color: "#4ade80",
    status: "SAFE"
  },
  circle: {
    id: "circle",
    shape: "circle",
    name: "DANGER",
    description: "Circle Button - Danger Zone Control",
    purpose: "Danger Alert",
    color: "#f87171",
    status: "DANGER"
  },
  cross: {
    id: "cross",
    shape: "cross",
    name: "NEUTRAL",
    description: "Cross Button - Neutral Control",
    purpose: "Neutral Action",
    color: "#60a5fa",
    status: "NEUTRAL"
  },
  square: {
    id: "square",
    shape: "square",
    name: "SPECIAL",
    description: "Square Button - Special Function",
    purpose: "Special Control",
    color: "#e879f9",
    status: "SPECIAL"
  }
};

export async function sendControl(payload: ControlPayload) {
  await update(controlRef, {
    ...payload,
    timestamp: serverTimestamp(),
  });
}

// Initialize zones in database
export async function initializeZones() {
  await update(controlRef, {
    zone_triangle_safe: null,
    zone_circle_danger: null,
    pwm_speed: 0,
  });
}

// Initialize button metadata permanently in database
export async function initializeButtonMetadata() {
  const metadata: Record<string, any> = {};
  Object.entries(BUTTON_METADATA).forEach(([key, value]) => {
    metadata[`button_${key}`] = {
      ...value,
      initialized_at: new Date().toISOString(),
      version: "1.0"
    };
  });
  
  await update(buttonMetadataRef, metadata);
}
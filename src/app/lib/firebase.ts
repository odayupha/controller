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

export type ControlPayload = Record<string, boolean | number | string | null>;

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
// src/types.ts

// ==============================
// 🔹 Language Types
// ==============================
export type Language = "en" | "es" | "fr" | "pt" | "it";

// ==============================
// 🔹 App States
// ==============================
export enum AppState {
  IDLE = "IDLE",
  SELECTING_RIDE = "SELECTING_RIDE",
  AWAITING_DRIVER = "AWAITING_DRIVER",
  DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
  IN_RIDE = "IN_RIDE",
  COMPLETED = "COMPLETED",
}

// ==============================
// 🔹 Call Status
// ==============================
export enum CallStatus {
  NONE = "NONE",
  CALLING = "CALLING",
  IN_CALL = "IN_CALL",
  ENDED = "ENDED",
}

// ==============================
// 🔹 Location Types
// ==============================
export interface Location {
  lat: number;
  lng: number;
}

export interface LocationWithTimestamp extends Location {
  timestamp: number;
}

// ==============================
// 🔹 User Types
// ==============================
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "rider" | "driver";
}

// ==============================
// 🔹 Ride Types
// ==============================
export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: Location;
  dropoff: Location;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  fare: number;
  createdAt: Date;
  updatedAt: Date;
}
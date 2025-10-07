/**
 * AppContext.tsx
 * -------------------------------------------------------
 * Global context for CharityDrive – handles driver/rider flow,
 * chat, calls, and live location sharing via Socket.IO.
 * -------------------------------------------------------
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useContext,
} from "react";
import io, { Socket } from "socket.io-client";
import { useLocationService } from "../hooks/useLocationService";
import { LatLng } from "../types";

/* ============================================================
   ENUMS & INTERFACES
============================================================ */

export enum AppState {
  IDLE = "IDLE",
  SEARCHING = "SEARCHING",
  DRIVER_EN_ROUTE = "DRIVER_EN_ROUTE",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export enum SelectionMode {
  NONE = "NONE",
  PICKUP = "PICKUP",
  DROPOFF = "DROPOFF",
}

export enum CallStatus {
  NONE = "NONE",
  RINGING = "RINGING",
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export interface RideRequest {
  id?: string;
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  suggestedFare?: number;
  finalFare?: number;
  distanceInKm?: number;
  travelTimeInMinutes?: number;
  driver?: string;
  vehicle?: string;
  charity?: string;
}

export interface ChatMessage {
  id: string;
  sender: "driver" | "rider" | "relative";
  text: string;
  timestamp: string;
}

export interface SharedLocation {
  active: boolean;
  link?: string;
  lastUpdate?: LatLng | null;
}

/* ============================================================
   CONTEXT TYPE
============================================================ */

interface AppContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  rideDetails: RideRequest;
  updateRideDetails: (details: Partial<RideRequest>) => void;

  // Driver
  isDriverMode: boolean;
  handleToggleDriverMode: () => void;
  handleAcceptRide: (id: string) => void;

  // Chat
  chatHistory: ChatMessage[];
  sendMessage: (text: string) => void;
  isChatVisible: boolean;
  toggleChat: () => void;

  // Call
  callStatus: CallStatus;
  startCall: () => void;
  endCall: () => void;

  // Live Location Sharing
  sharedLocation: SharedLocation;
  startSharingLocation: () => void;
  stopSharingLocation: () => void;

  // Panic alert placeholder
  triggerPanicAlert: (reason?: string) => void;
}

/* ============================================================
   PROVIDER IMPLEMENTATION
============================================================ */

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.NONE);
  const [rideDetails, setRideDetails] = useState<RideRequest>({});
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.NONE);
  const [sharedLocation, setSharedLocation] = useState<SharedLocation>({ active: false });
  const socketRef = useRef<Socket | null>(null);

  const { locateUser } = useLocationService();

  /* --------------------------
     SOCKET.IO CONNECTION
  -------------------------- */
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl, { transports: ["websocket"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
    socket.on("disconnect", () => console.warn("🔴 Socket disconnected"));

    // Receive chat
    socket.on("chatMessage", (msg: ChatMessage) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    // Receive location updates
    socket.on("locationUpdate", (coords: LatLng) => {
      if (sharedLocation.active) {
        setSharedLocation((prev) => ({ ...prev, lastUpdate: coords }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sharedLocation.active]);

  /* --------------------------
     CORE HANDLERS
  -------------------------- */
  const updateRideDetails = useCallback((details: Partial<RideRequest>) => {
    setRideDetails((prev) => ({ ...prev, ...details }));
  }, []);

  const handleToggleDriverMode = () => setIsDriverMode((p) => !p);

  const handleAcceptRide = (id: string) => {
    console.log("✅ Driver accepted ride", id);
    setAppState(AppState.DRIVER_EN_ROUTE);
    socketRef.current?.emit("driverAccepted", { rideId: id });
  };

  /* --------------------------
     CHAT HANDLERS
  -------------------------- */
  const sendMessage = (text: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isDriverMode ? "driver" : "rider",
      text,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, msg]);
    socketRef.current?.emit("chatMessage", msg);
  };

  const toggleChat = () => setIsChatVisible((p) => !p);

  /* --------------------------
     CALL HANDLERS
  -------------------------- */
  const startCall = () => {
    setCallStatus(CallStatus.RINGING);
    console.log("📞 Initiating call...");
    setTimeout(() => setCallStatus(CallStatus.ACTIVE), 2500);
  };

  const endCall = () => {
    setCallStatus(CallStatus.ENDED);
    console.log("📴 Call ended");
    setTimeout(() => setCallStatus(CallStatus.NONE), 1500);
  };

  /* --------------------------
     LIVE LOCATION SHARING
  -------------------------- */
  const startSharingLocation = () => {
    locateUser("en", (latlng) => {
      setSharedLocation({
        active: true,
        lastUpdate: latlng,
        link: `${window.location.origin}/share/${socketRef.current?.id}`,
      });
      socketRef.current?.emit("shareLocation", { latlng });
      console.log("📍 Live location sharing started");
    }, console.error);
  };

  const stopSharingLocation = () => {
    setSharedLocation({ active: false });
    socketRef.current?.emit("stopShareLocation");
    console.log("📍 Live location sharing stopped");
  };

  /* --------------------------
     PANIC ALERT PLACEHOLDER
  -------------------------- */
  const triggerPanicAlert = (reason?: string) => {
    console.warn("🚨 Panic alert triggered:", reason || "unspecified");
    locateUser("en", (latlng) => {
      socketRef.current?.emit("panicAlert", { latlng, reason });
    }, console.error);
  };

  /* --------------------------
     CONTEXT VALUE
  -------------------------- */
  const value: AppContextType = {
    appState,
    setAppState,
    selectionMode,
    setSelectionMode,
    rideDetails,
    updateRideDetails,
    isDriverMode,
    handleToggleDriverMode,
    handleAcceptRide,
    chatHistory,
    sendMessage,
    isChatVisible,
    toggleChat,
    callStatus,
    startCall,
    endCall,
    sharedLocation,
    startSharingLocation,
    stopSharingLocation,
    triggerPanicAlert,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* ============================================================
   HOOK EXPORT
============================================================ */

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
};
export { AppContext };
export default AppContext;

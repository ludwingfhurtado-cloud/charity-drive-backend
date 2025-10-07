/**
 * AppContext.tsx
 * -----------------
 * Global application context for CharityDrive.
 * Handles booking flow, map state, driver mode, chat/call logic, and app-wide settings.
 */

import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useRef,
  ReactNode,
} from "react";

/* ============================================================
   📍 ENUMS & TYPES
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
}

export interface LatLng {
  lat: number;
  lng: number;
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
  sender: "driver" | "rider";
  text: string;
  timestamp: string;
}

/* ============================================================
   🧠 CONTEXT INTERFACE
============================================================ */

interface AppContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  rideDetails: RideRequest;
  updateRideDetails: (details: Partial<RideRequest>) => void;

  // Booking & driver
  handleStartBooking: (mode: SelectionMode) => void;
  handleReset: () => void;
  handleAcceptRide: (id: string) => void;
  handleToggleDriverMode: () => void;
  isDriverMode: boolean;

  // Chat
  chatHistory: ChatMessage[];
  sendMessage: (text: string) => void;
  isChatVisible: boolean;
  toggleChat: () => void;

  // Call
  callStatus: CallStatus;
  startCall: () => void;
  endCall: () => void;
}

/* ============================================================
   🏁 DEFAULT VALUES
============================================================ */

const defaultRide: RideRequest = {
  pickup: null,
  dropoff: null,
  pickupAddress: null,
  dropoffAddress: null,
  suggestedFare: 0,
  finalFare: 0,
  distanceInKm: 0,
  travelTimeInMinutes: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ============================================================
   🧩 PROVIDER IMPLEMENTATION
============================================================ */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.NONE);
  const [rideDetails, setRideDetails] = useState<RideRequest>(defaultRide);
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.NONE);
  const rideRef = useRef<RideRequest | null>(null);

  /* --------------------------
     Booking & Map Handlers
  -------------------------- */
  const updateRideDetails = useCallback((details: Partial<RideRequest>) => {
    setRideDetails((prev) => ({ ...prev, ...details }));
  }, []);

  const handleStartBooking = (mode: SelectionMode) => {
    setSelectionMode(mode);
    setAppState(AppState.SEARCHING);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setRideDetails(defaultRide);
    setChatHistory([]);
    setCallStatus(CallStatus.NONE);
  };

  const handleToggleDriverMode = () => setIsDriverMode((p) => !p);

  const handleAcceptRide = (id: string) => {
    console.log(`✅ Driver accepted ride ${id}`);
    setAppState(AppState.DRIVER_EN_ROUTE);
  };

  /* --------------------------
     Chat & Call Handlers
  -------------------------- */
  const sendMessage = (text: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isDriverMode ? "driver" : "rider",
      text,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, msg]);
  };

  const toggleChat = () => setIsChatVisible((p) => !p);

  const startCall = () => {
    setCallStatus(CallStatus.RINGING);
    console.log("📞 Call started...");
    setTimeout(() => setCallStatus(CallStatus.ACTIVE), 3000);
  };

  const endCall = () => {
    console.log("📴 Call ended.");
    setCallStatus(CallStatus.NONE);
  };

  /* --------------------------
     Context Value
  -------------------------- */
  const value: AppContextType = {
    appState,
    setAppState,
    selectionMode,
    setSelectionMode,
    rideDetails,
    updateRideDetails,
    handleStartBooking,
    handleReset,
    handleAcceptRide,
    handleToggleDriverMode,
    isDriverMode,
    chatHistory,
    sendMessage,
    isChatVisible,
    toggleChat,
    callStatus,
    startCall,
    endCall,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* ============================================================
   🪶 HOOK
============================================================ */

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppContext;

// ✅ Core Imports
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { AppState, CallStatus } from "../types";
import { useLocationService } from "../hooks/useLocationService";

// ==============================
// 🔹 Interface Definitions
// ==============================
export interface RideOption {
  id: string;
  name: string;
  baseFare: number;
  multiplier?: number;
}

export interface Charity {
  id: string;
  name: string;
}

export interface RideDetails {
  pickup?: google.maps.LatLngLiteral | null;
  dropoff?: google.maps.LatLngLiteral | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  suggestedFare: number;
  rideOption: RideOption;
}

export interface CallDetails {
  status: CallStatus;
  with?: string;
}

// ==============================
// 🔹 Context Type Definition
// ==============================
export interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;

  rideOptions: RideOption[];
  charities: Charity[];
  rideDetails: RideDetails;
  updateRideDetails: (details: Partial<RideDetails>) => void;
  handleBookingSubmit: (option: RideOption, fare: number, charityId: string) => void;

  calculateRouteDetails: (
    pickup: google.maps.LatLngLiteral,
    dropoff: google.maps.LatLngLiteral,
    option: RideOption
  ) => void;

  serverError: string | null;
  setServerError: React.Dispatch<React.SetStateAction<string | null>>;

  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;

  isPanelMinimized: boolean;
  setIsPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isTripPanelMinimized: boolean;
  setIsTripPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;

  isDriverMode: boolean;
  setIsDriverMode: React.Dispatch<React.SetStateAction<boolean>>;

  isTestingConnection: boolean;
  handleTestConnection: () => void;

  callDetails: CallDetails;
  setCallDetails: React.Dispatch<React.SetStateAction<CallDetails>>;
  isChatVisible: boolean;
  setIsChatVisible: React.Dispatch<React.SetStateAction<boolean>>;

  socket: Socket | null;
}

// ==============================
// 🔹 Create Context
// ==============================
const AppContext = createContext<AppContextType | undefined>(undefined);

// ==============================
// 🔹 Provider
// ==============================
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ====== STATE HOOKS ======
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [language, setLanguage] = useState("en");
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isTripPanelMinimized, setIsTripPanelMinimized] = useState(false);
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [rideOptions] = useState<RideOption[]>([
    { id: "standard", name: "Standard", baseFare: 10, multiplier: 1 },
    { id: "premium", name: "Premium", baseFare: 20, multiplier: 1.5 },
    { id: "charity", name: "Charity", baseFare: 5, multiplier: 0.8 },
  ]);

  const [charities] = useState<Charity[]>([
    { id: "1", name: "Hope Foundation" },
    { id: "2", name: "Feed the Children" },
    { id: "3", name: "Senior Smiles" },
  ]);

  const [rideDetails, setRideDetails] = useState<RideDetails>({
    suggestedFare: 0,
    rideOption: { id: "standard", name: "Standard", baseFare: 10, multiplier: 1 },
  });

  const [callDetails, setCallDetails] = useState<CallDetails>({
    status: CallStatus.NONE,
  });

  // ====== SOCKET.IO CONNECTION ======
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    const s: Socket = io(SOCKET_URL, { transports: ["websocket"] });

    const handleConnect = () => console.log("✅ Socket connected:", s.id);
    const handleDisconnect = () => console.log("⚠️ Socket disconnected");
    const handleServerError = (err: unknown) => {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : JSON.stringify(err);
      setServerError(msg);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("server_error", handleServerError);

    setSocket(s);

    // ✅ Cleanup — remove specific listeners
    return () => {
      (s as any).off("connect", handleConnect);
      (s as any).off("disconnect", handleDisconnect);
      (s as any).off("server_error", handleServerError);
      s.disconnect();
      console.log("🧹 Socket cleaned up");
    };
  }, []);

  // ====== LOCATION SERVICE ======
  const { location } = useLocationService();
  useEffect(() => {
    if (socket && location) {
      socket.emit("update_location", location);
    }
  }, [socket, location]);

  // ====== HELPERS ======
  const updateRideDetails = useCallback((details: Partial<RideDetails>) => {
    setRideDetails((prev) => ({ ...prev, ...details }));
  }, []);

  const calculateRouteDetails = useCallback(
    (pickup: google.maps.LatLngLiteral, dropoff: google.maps.LatLngLiteral, option: RideOption) => {
      const distanceKm = Math.random() * 10 + 1;
      const suggestedFare = option.baseFare + distanceKm * 2 * (option.multiplier ?? 1);
      setRideDetails((prev) => ({ ...prev, pickup, dropoff, suggestedFare }));
    },
    []
  );

  const handleBookingSubmit = useCallback(
    (option: RideOption, fare: number, charityId: string) => {
      if (!socket) {
        setServerError("No server connection.");
        return;
      }
      socket.emit("booking_request", { option, fare, charityId, rideDetails });
      setAppState(AppState.AWAITING_DRIVER);
    },
    [socket, rideDetails]
  );

  const handleTestConnection = useCallback(() => {
    if (!socket) return;
    setIsTestingConnection(true);
    (socket as any)
      ?.timeout?.(3000)
      .emit("ping_test", {}, (err: unknown, response: any) => {
        setIsTestingConnection(false);
        if (err) {
          setServerError("Server not responding.");
        } else {
          alert("✅ Server connection healthy!");
        }
      });
  }, [socket]);

  // ====== PROVIDER VALUE (MEMOIZED) ======
  const value = useMemo<AppContextType>(
    () => ({
      appState,
      setAppState,
      rideOptions,
      charities,
      rideDetails,
      updateRideDetails,
      handleBookingSubmit,
      calculateRouteDetails,
      serverError,
      setServerError,
      language,
      setLanguage,
      isPanelMinimized,
      setIsPanelMinimized,
      isTripPanelMinimized,
      setIsTripPanelMinimized,
      isDriverMode,
      setIsDriverMode,
      isTestingConnection,
      handleTestConnection,
      callDetails,
      setCallDetails,
      isChatVisible,
      setIsChatVisible,
      socket,
    }),
    [
      appState,
      rideOptions,
      charities,
      rideDetails,
      language,
      isPanelMinimized,
      isTripPanelMinimized,
      isDriverMode,
      isTestingConnection,
      callDetails,
      isChatVisible,
      socket,
      serverError,
      updateRideDetails,
      calculateRouteDetails,
      handleBookingSubmit,
      handleTestConnection,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ==============================
// 🔹 Hook Export
// ==============================
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppContext;
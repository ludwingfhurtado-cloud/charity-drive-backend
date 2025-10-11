// ✅ Core Imports
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  // Core app state
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;

  // Ride & charity data
  rideOptions: RideOption[];
  charities: Charity[];
  rideDetails: RideDetails;
  updateRideDetails: (details: Partial<RideDetails>) => void;
  handleBookingSubmit: (
    option: RideOption,
    fare: number,
    charityId: string
  ) => void;

  // Route calculation
  calculateRouteDetails: (
    pickup: google.maps.LatLngLiteral,
    dropoff: google.maps.LatLngLiteral,
    option: RideOption
  ) => void;

  // Error handling
  serverError: string | null;
  setServerError: React.Dispatch<React.SetStateAction<string | null>>;

  // Language
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;

  // Driver/Trip panels
  isPanelMinimized: boolean;
  setIsPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isTripPanelMinimized: boolean;
  setIsTripPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;

  // Driver mode
  isDriverMode: boolean;
  setIsDriverMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Testing connection
  isTestingConnection: boolean;
  handleTestConnection: () => void;

  // Call & chat
  callDetails: CallDetails;
  setCallDetails: React.Dispatch<React.SetStateAction<CallDetails>>;
  isChatVisible: boolean;
  setIsChatVisible: React.Dispatch<React.SetStateAction<boolean>>;

  // Socket.io connection
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
  const [language, setLanguage] = useState<string>("en");
  const [isPanelMinimized, setIsPanelMinimized] = useState<boolean>(false);
  const [isTripPanelMinimized, setIsTripPanelMinimized] =
    useState<boolean>(false);
  const [isDriverMode, setIsDriverMode] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] =
    useState<boolean>(false);

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
    rideOption: { id: "standard", name: "Standard", baseFare: 10 },
  });

  const [callDetails, setCallDetails] = useState<CallDetails>({
    status: CallStatus.NONE,
  });

  // ====== SOCKET.IO ======
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s: Socket = io("http://localhost:3001", {
      transports: ["websocket"],
    });

    s.on("connect", () => console.log("✅ Socket connected:", s.id));
    s.on("disconnect", () => console.log("⚠️ Socket disconnected"));

    // Fix TypeScript complaint about Record<string,string>
    s.on("server_error", (err: unknown) => {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : JSON.stringify(err);
      setServerError(msg);
    });

setSocket(s);

// ✅ Cleanup: properly typed and returns void
return (): void => {
  // Properly cast to any to bypass TS type issue
  (s as any)?.removeAllListeners?.();
  s.disconnect();
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
const updateRideDetails = (details: Partial<RideDetails>) =>
  setRideDetails((prev) => ({ ...prev, ...details }));

const calculateRouteDetails = (
  pickup: google.maps.LatLngLiteral,
  dropoff: google.maps.LatLngLiteral,
  option: RideOption
) => {
  const distanceKm = Math.random() * 10 + 1;
  const suggestedFare =
    option.baseFare + distanceKm * 2 * (option.multiplier ?? 1);
  setRideDetails((prev) => ({ ...prev, pickup, dropoff, suggestedFare }));
};

const handleBookingSubmit = (
  option: RideOption,
  fare: number,
  charityId: string
) => {
  if (!socket) {
    setServerError("No server connection.");
    return;
  }
  socket.emit("booking_request", { option, fare, charityId, rideDetails });
  setAppState(AppState.AWAITING_DRIVER);
};

const handleTestConnection = () => {
  if (!socket) return;
  setIsTestingConnection(true);
  (socket as any).timeout?.(3000).emit(
    "ping_test",
    {},
    (err: unknown, response: any) => {
      setIsTestingConnection(false);
      if (err) {
        setServerError("Server not responding.");
      } else {
        alert("✅ Server connection healthy!");
      }
    }
  );
};

// ====== PROVIDER VALUE ======
const value: AppContextType = {
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
};

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

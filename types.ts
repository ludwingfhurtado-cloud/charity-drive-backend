import type { ReactNode, Dispatch, SetStateAction } from 'react';

export enum AppState {
  LANDING = 'LANDING',
  IDLE = 'IDLE',
  CALCULATING = 'CALCULATING',
  AWAITING_DRIVER = 'AWAITING_DRIVER',
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',
  IN_PROGRESS = 'IN_PROGRESS',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  VERIFYING_PAYMENT = 'VERIFYING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
}

export type LatLng = { lat: number; lng: number };

export type SelectionMode = 'pickup' | 'dropoff' | null;

export type Language = 'en' | 'es' | 'pt';

export interface RideOption {
  id: string;
  description?: string;
  multiplier: number;
  icon: string; // Changed from ReactNode to string
}

export interface Driver {
  name: string;
  licensePlate: string;
}

export interface Vehicle {
  model: string;
  color: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
}

export interface RideDetails {
  pickup: LatLng | null;
  dropoff: LatLng | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  rideOption: RideOption;
  suggestedFare: number;
  finalFare: number;
  distanceInKm?: number;
  travelTimeInMinutes?: number;
  driver?: Driver;
  vehicle?: Vehicle;
  charity?: Charity;
}

export interface RideRequest extends RideDetails {
  id: string;
}

export interface ChatMessage {
  id: string;
  sender: 'rider' | 'driver';
  text: string;
  timestamp: string;
}

export enum CallStatus {
  NONE = 'NONE',
  RINGING = 'RINGING',
  ACTIVE = 'ACTIVE',
  INCOMING = 'INCOMING',
}

export interface CallDetails {
  status: CallStatus;
  type: 'voice' | 'video';
  caller: 'rider' | 'driver';
}

export interface AppContextType {
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  selectionMode: SelectionMode;
  setSelectionMode: Dispatch<SetStateAction<SelectionMode>>;
  isPanelMinimized: boolean;
  setIsPanelMinimized: Dispatch<SetStateAction<boolean>>;
  isTripPanelMinimized: boolean;
  setIsTripPanelMinimized: Dispatch<SetStateAction<boolean>>;
  language: Language;
  setLanguage: (lang: Language) => void;
  rideDetails: RideDetails;
  updateRideDetails: (details: Partial<RideDetails>) => void;
  rideOptions: RideOption[];
  charities: Charity[];
  confirmationMessage: string;
  routeCoordinates: LatLng[] | null;
  setRouteCoordinates: Dispatch<SetStateAction<LatLng[] | null>>;
  driverRouteCoordinates: LatLng[] | null;
  setDriverRouteCoordinates: Dispatch<SetStateAction<LatLng[] | null>>;
  tripProgress: number;
  setTripProgress: Dispatch<SetStateAction<number>>;
  driverLocation: LatLng | null;
  isDriverMode: boolean;
  availableRides: RideRequest[];
  handleToggleDriverMode: () => void;
  handleAcceptRide: (rideId: string) => void;
  handleCancelRequest: () => void;
  handleBookingSubmit: (rideOption: RideOption, offeredFare: number, charityId: string) => void;
  handleTripComplete: () => void;
  handleReset: (returnToBooking?: boolean) => void;
  handleLocationSelect: (latlng: LatLng, address: string | null) => void;
  handleSetPickup: (latlng: LatLng, address: string | null) => void;
  handleSetDropoff: (latlng: LatLng, address: string | null) => void;
  handleFocusLocationInput: (mode: SelectionMode) => void;
  handleStartBooking: (mode: SelectionMode) => void;
  handleRecenterMap: () => void;
  recenterMapTimestamp: number;
  handleDriverArrived: () => void;
  calculateRouteDetails: (pickup: LatLng, dropoff: LatLng, rideOption: RideOption) => void;
  handleConfirmPayment: () => void;
  isChatVisible: boolean;
  toggleChat: () => void;
  chatHistory: ChatMessage[];
  sendMessage: (text: string) => void;
  callDetails: CallDetails;
  initiateCall: (type: 'voice' | 'video') => void;
  answerCall: () => void;
  endCall: () => void;
  serverError: string | null;
  setServerError: Dispatch<SetStateAction<string | null>>;
  isTestingConnection: boolean;
  handleTestConnection: () => void;
  isMapsApiLoaded: boolean;
}
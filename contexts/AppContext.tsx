import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, RideDetails, RideOption, LatLng, SelectionMode, Language, RideRequest, Driver, Vehicle, Charity, ChatMessage, CallDetails, CallStatus, ServerStatus } from '../types';
import { RIDE_OPTIONS } from '../constants';
import { getConfirmationMessage } from '../services/geminiService';
import { t } from '../i18n';
import { useLocationService } from '../hooks/useLocationService';
import { useContext } from "react";

// Fix: Add a global declaration for the 'google' object to resolve TypeScript errors.
declare global {
  var google: any;
  var gm_authFailure: () => void;
}

// FIX: Made access to import.meta.env robust to prevent runtime errors.
const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || '';
const SOCKET_URL = API_BASE_URL; // Socket.IO will connect to the same host as the API


interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  selectionMode: SelectionMode;
  setSelectionMode: React.Dispatch<React.SetStateAction<SelectionMode>>;
  isPanelMinimized: boolean;
  setIsPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isTripPanelMinimized: boolean;
  setIsTripPanelMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  language: Language;
  setLanguage: (lang: Language) => void;
  rideDetails: RideDetails;
  updateRideDetails: (details: Partial<RideDetails>) => void;
  rideOptions: RideOption[];
  charities: Charity[];
  confirmationMessage: string;
  routeCoordinates: LatLng[] | null;
  setRouteCoordinates: React.Dispatch<React.SetStateAction<LatLng[] | null>>;
  driverRouteCoordinates: LatLng[] | null;
  setDriverRouteCoordinates: React.Dispatch<React.SetStateAction<LatLng[] | null>>;
  tripProgress: number;
  setTripProgress: React.Dispatch<React.SetStateAction<number>>;
  driverLocation: LatLng | null;
  isDriverMode: boolean;
  availableRides: RideRequest[];
  handleToggleDriverMode: () => void;
  handleAcceptRide: (rideId: string) => void;
  handleCancelRequest: () => void;
  handleBookingSubmit: (rideOption: RideOption, offeredFare: number, charityId: string) => void;
  handleTripComplete: () => void;
  handleReset: (returnToBooking?: boolean) => void;
  handleLocationSelect: (latlng: LatLng, address: string | null, forceMode?: SelectionMode) => void;
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
  setServerError: (message: string | null) => void;
  isTestingConnection: boolean;
  handleTestConnection: () => void;
  serverStatus: ServerStatus;
  checkServerStatus: () => void;
  pickupQuery: string;
  setPickupQuery: React.Dispatch<React.SetStateAction<string>>;
  dropoffQuery: string;
  setDropoffQuery: React.Dispatch<React.SetStateAction<string>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_DRIVERS: Driver[] = [
    { name: 'Juan P.', licensePlate: '5482-ABC' },
    { name: 'Maria G.', licensePlate: '1234-XYZ' },
    { name: 'Carlos R.', licensePlate: '9876-DEF' },
    { name: 'Sofia L.', licensePlate: '4567-GHI' },
];

const MOCK_VEHICLES: Vehicle[] = [
    { model: 'Toyota Corolla', color: 'Silver' },
    { model: 'Nissan Versa', color: 'White' },
    { model: 'Suzuki Swift', color: 'Red' },
    { model: 'Kia Rio', color: 'Black' },
];

const BASE_RATE_PER_KM = 3.80; // Bs.

let directionsService: any | null = null;
const getDirectionsService = () => {
    if (!directionsService && window.google?.maps) {
        directionsService = new window.google.maps.DirectionsService();
    }
    return directionsService;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(true);
  const [isTripPanelMinimized, setIsTripPanelMinimized] = useState(true);
  const [language, setLanguageState] = useState<Language>('es');
  const [tripProgress, setTripProgress] = useState(0);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [recenterMapTimestamp, setRecenterMapTimestamp] = useState(0);

  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');

  const [isDriverMode, setIsDriverMode] = useState(false);
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [userRideRequestId, setUserRideRequestId] = useState<string | null>(null);
  const currentRideRequestRef = useRef<RideRequest | null>(null);

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [callDetails, setCallDetails] = useState<CallDetails>({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const [serverStatus, setServerStatus] = useState<ServerStatus>('connecting');
  const [serverError, setServerErrorState] = useState<string | null>(null);
  const serverErrorTimeoutRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [rideDetails, setRideDetails] = useState<RideDetails>({
    pickup: null,
    dropoff: null,
    pickupAddress: null,
    dropoffAddress: null,
    rideOption: RIDE_OPTIONS[0],
    suggestedFare: 0,
    finalFare: 0,
    distanceInKm: 0,
    travelTimeInMinutes: 0,
    driver: undefined,
    vehicle: undefined,
    charity: undefined,
  });

  const isDriverModeRef = useRef(isDriverMode);
  useEffect(() => { isDriverModeRef.current = isDriverMode; }, [isDriverMode]);

  const userRideRequestIdRef = useRef(userRideRequestId);
  useEffect(() => { userRideRequestIdRef.current = userRideRequestId; }, [userRideRequestId]);
  
  const rideDetailsRef = useRef(rideDetails);
  useEffect(() => {
    rideDetailsRef.current = rideDetails;
  }, [rideDetails]);


  const setServerError = useCallback((message: string | null) => {
    if (serverErrorTimeoutRef.current) {
        clearTimeout(serverErrorTimeoutRef.current);
    }
    setServerErrorState(message);
    if (message && !message.toLowerCase().includes('google')) {
        serverErrorTimeoutRef.current = window.setTimeout(() => {
            setServerErrorState(null);
            serverErrorTimeoutRef.current = null;
        }, 6000);
    }
  }, []);


  const updateRideDetails = useCallback((details: Partial<RideDetails>) => {
    setRideDetails(prev => ({ ...prev, ...details }));
  }, []);

  const rideOptions = useMemo(() => RIDE_OPTIONS.map(option => ({
    ...option,
    description: t(`ride_${option.id}_description`, language)
  })), [language]);

  const charities = useMemo((): Charity[] => ([
    { id: 'animal_rescue', name: t('charity_animal_rescue_name', language), description: t('charity_animal_rescue_description', language) },
    { id: 'childrens_fund', name: t('charity_childrens_fund_name', language), description: t('charity_childrens_fund_description', language) },
    { id: 'rainforest_trust', name: t('charity_rainforest_trust_name', language), description: t('charity_rainforest_trust_description', language) },
  ]), [language]);

  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[] | null>(null);
  const [driverRouteCoordinates, setDriverRouteCoordinates] = useState<LatLng[] | null>(null);

  const { reverseGeocode } = useLocationService();
  
  const checkServerStatus = useCallback(async () => {
    setServerStatus('connecting');
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setServerStatus('online');
        setServerError(null);
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    }
  }, [setServerError]);
  
  useEffect(() => {
    checkServerStatus();
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            checkServerStatus();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkServerStatus]);

  useEffect(() => {
    window.gm_authFailure = () => {
      setServerError("Google Maps Authentication Failed. This is a critical configuration error in your Google Cloud project.");
    };
    const timer = setTimeout(() => {
      if (!window.google) {
        setServerError("Failed to load Google Maps script. Check your internet connection, ad blockers, or the script tag in index.html.");
      }
    }, 5000);
    return () => {
      clearTimeout(timer);
      if (window.gm_authFailure) {
        delete window.gm_authFailure;
      }
    };
  }, [setServerError]);

  // --- Socket.IO Connection Management ---
  useEffect(() => {
    if (serverStatus !== 'online') {
        socketRef.current?.disconnect();
        return;
    }

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connection established with ID:', socket.id);
      setServerError(null);
    });

    socket.on('ride-list-update', (payload: RideRequest[]) => {
      setAvailableRides(payload);
    });
    
    socket.on('ride-accepted', (payload: RideRequest) => {
      if (!isDriverModeRef.current && userRideRequestIdRef.current === payload.id) {
        // A driver accepted our ride request. Join the chat room.
        socket.emit('join-ride-room', payload.id);
        
        const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
        const randomVehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
        const currentPickup = rideDetailsRef.current.pickup;
        
        updateRideDetails({ driver: randomDriver, vehicle: randomVehicle });
        
        if (currentPickup) {
          const driverStartPos = { lat: currentPickup.lat + 0.005, lng: currentPickup.lng + 0.005 };
          setDriverLocation(driverStartPos);
        }
        setAppState(AppState.DRIVER_EN_ROUTE);
      }
    });

    socket.on('new-message', (payload: { rideId: string, message: ChatMessage }) => {
       if (currentRideRequestRef.current && payload.rideId === currentRideRequestRef.current.id) {
            setChatHistory(prev => [...prev, payload.message]);
       }
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO connection lost.');
      if (serverStatus === 'online') {
          setServerError("Real-time connection lost. Reconnecting...");
      }
    });
    
    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setServerError("Could not connect to the real-time server.");
    });

    return () => {
      socket.disconnect();
    };
  }, [serverStatus, updateRideDetails, setServerError]);
  
  useEffect(() => {
      if (isDriverMode && serverStatus === 'online') {
          const fetchInitialRides = async () => {
              try {
                  const response = await fetch(`${API_BASE_URL}/api/rides`);
                  if (!response.ok) throw new Error('Failed to fetch initial rides');
                  const rides = await response.json();
                  setAvailableRides(rides);
              } catch (error) {
                  console.error(error);
                  setServerError("Could not fetch available rides.");
              }
          };
          fetchInitialRides();
      }
  }, [isDriverMode, serverStatus, setServerError]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  
  const handleFocusLocationInput = (mode: SelectionMode) => {
    setSelectionMode(mode);
    setIsPanelMinimized(true);
  };

  const calculateRouteDetails = useCallback(async (pickup: LatLng, dropoff: LatLng, rideOption: RideOption) => {
    setAppState(AppState.CALCULATING);
    const service = getDirectionsService();
    if (!service || !window.google) {
        setServerError("Google Maps API not loaded. Cannot calculate route.");
        setAppState(AppState.IDLE);
        return;
    }
    try {
        const response = await service.route({
            origin: pickup,
            destination: dropoff,
            travelMode: google.maps.TravelMode.DRIVING,
        });
        if (response.routes && response.routes.length > 0) {
            const route = response.routes[0];
            const leg = route.legs[0];
            if (leg.distance && leg.duration) {
                const distanceKm = leg.distance.value / 1000;
                const travelTimeMinutes = leg.duration.value / 60;
                const suggestedFare = distanceKm * BASE_RATE_PER_KM * rideOption.multiplier;
                updateRideDetails({
                    distanceInKm: parseFloat(distanceKm.toFixed(1)),
                    travelTimeInMinutes: Math.round(travelTimeMinutes),
                    suggestedFare: parseFloat(suggestedFare.toFixed(2)),
                });
                const routeCoords = route.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
                setRouteCoordinates(routeCoords);
                setAppState(AppState.IDLE);
                setIsPanelMinimized(false);
            } else {
                 throw new Error("Route calculation did not return distance or duration.");
            }
        } else {
            throw new Error("No routes found between the selected locations.");
        }
    } catch (error: any) {
        console.error("Error calculating route details:", error);
        let errorMessage = "Google failed to calculate route. Please check addresses and try again.";
        if (error.code === google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
            errorMessage = "Google Maps traffic is high. Please try again in a moment.";
        }
        setServerError(errorMessage);
        updateRideDetails({
            distanceInKm: 0,
            travelTimeInMinutes: 0,
            suggestedFare: 0,
        });
        setRouteCoordinates(null);
        setAppState(AppState.IDLE);
    }
  }, [updateRideDetails, setServerError]);
  
  const handleStartBooking = (mode: SelectionMode) => {
      setAppState(AppState.IDLE);
      setSelectionMode(mode);
      setIsPanelMinimized(true);
  };

  const handleSetPickup = useCallback((latlng: LatLng, address: string | null) => {
    setRouteCoordinates(null);
    const currentDropoff = rideDetails.dropoff;
    updateRideDetails({ 
      pickup: latlng, 
      pickupAddress: address,
      distanceInKm: 0,
      travelTimeInMinutes: 0,
      suggestedFare: 0,
      finalFare: 0
    });
    setPickupQuery(address || '');
    setSelectionMode('dropoff');
    if (currentDropoff) {
        calculateRouteDetails(latlng, currentDropoff, rideDetails.rideOption);
    }
  }, [rideDetails.dropoff, rideDetails.rideOption, calculateRouteDetails, updateRideDetails]);

  const handleSetDropoff = useCallback((latlng: LatLng, address: string | null) => {
    updateRideDetails({ dropoff: latlng, dropoffAddress: address });
    setDropoffQuery(address || '');
    setSelectionMode(null);
    if (rideDetails.pickup) {
        calculateRouteDetails(rideDetails.pickup, latlng, rideDetails.rideOption);
    }
  }, [rideDetails.pickup, rideDetails.rideOption, calculateRouteDetails, updateRideDetails]);

  const handleLocationSelect = useCallback(async (latlng: LatLng, address: string | null, forceMode?: SelectionMode) => {
    const currentSelectionMode = forceMode || selectionMode;
    if (!currentSelectionMode) return;

    let finalAddress = address;

    if (finalAddress === null) {
        const tempAddress = t('fetching_address', language);
        if (currentSelectionMode === 'pickup') setPickupQuery(tempAddress);
        else setDropoffQuery(tempAddress);

        try {
            setServerError(null);
            finalAddress = await reverseGeocode(latlng, language);
        } catch (error) {
            console.error("Reverse geocode failed:", error);
            setServerError(t('error_reverse_geocode_failed', language));
            if (currentSelectionMode === 'pickup') setPickupQuery('');
            else setDropoffQuery('');
            return;
        }
    }
    
    if (currentSelectionMode === 'pickup') {
        handleSetPickup(latlng, finalAddress);
    } else {
        handleSetDropoff(latlng, finalAddress);
    }
  }, [selectionMode, language, handleSetPickup, handleSetDropoff, reverseGeocode, setServerError]);

  const handleReset = useCallback(async (returnToBooking = false) => {
    if (userRideRequestId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/rides/${userRideRequestId}`, { method: 'DELETE' });
            if (response.ok) {
                socketRef.current?.emit('ride-cancelled', { rideId: userRideRequestId });
            }
        } catch (error) {
            console.error("Failed to cancel ride request:", error);
        }
        setUserRideRequestId(null);
    }
    
    currentRideRequestRef.current = null;
    setDriverLocation(null);
    setIsPanelMinimized(true);
    setIsTripPanelMinimized(true);
    setSelectionMode(null);
    setRouteCoordinates(null);
    setDriverRouteCoordinates(null);
    setTripProgress(0);
    setIsChatVisible(false);
    setChatHistory([]);
    setCallDetails({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
    
    setPickupQuery('');
    setDropoffQuery('');

    if (returnToBooking && rideDetails.pickup) {
        updateRideDetails({
          dropoff: null,
          dropoffAddress: null,
          suggestedFare: 0,
          finalFare: 0,
          distanceInKm: 0,
          travelTimeInMinutes: 0,
          driver: undefined,
          vehicle: undefined,
          charity: undefined,
        });
        setAppState(AppState.IDLE);
    } else {
        setRideDetails({
          pickup: null,
          dropoff: null,
          pickupAddress: null,
          dropoffAddress: null,
          rideOption: rideOptions[0],
          suggestedFare: 0,
          finalFare: 0,
          distanceInKm: 0,
          travelTimeInMinutes: 0,
          driver: undefined,
          vehicle: undefined,
          charity: undefined,
        });
        setAppState(AppState.IDLE);
    }
  }, [rideOptions, rideDetails.pickup, userRideRequestId, updateRideDetails]);

  const handleBookingSubmit = async (rideOption: RideOption, offeredFare: number, charityId: string) => {
    setChatHistory([]);
    setIsChatVisible(false);
    setCallDetails({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
    const selectedCharity = charities.find(c => c.id === charityId);
    const rideDataForServer = { ...rideDetails, rideOption, finalFare: offeredFare, charity: selectedCharity };
    updateRideDetails({ rideOption, finalFare: offeredFare, charity: selectedCharity });
    try {
        setServerError(null);
        const response = await fetch(`${API_BASE_URL}/api/rides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rideDataForServer),
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Failed to create ride request.' }));
            throw new Error(errorBody.message || `Server Error: ${response.status}`);
        }
        const createdRide: RideRequest = await response.json();
        setUserRideRequestId(createdRide.id);
        currentRideRequestRef.current = createdRide;
        socketRef.current?.emit('new-ride', createdRide);
        setIsPanelMinimized(true);
        setAppState(AppState.AWAITING_DRIVER);
    } catch (error) {
        console.error("Error creating ride request:", error);
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
             setServerError("Could not connect to the server. Please ensure it's running and try again.");
        } else {
             setServerError(error instanceof Error ? error.message : "An unknown error occurred.");
        }
    }
  };
  
  const handleCancelRequest = () => {
      handleReset(true);
  };
  
  const handleDriverArrived = useCallback(() => {
    setDriverLocation(null);
    setDriverRouteCoordinates(null);
    setIsTripPanelMinimized(true);
    setAppState(AppState.IN_PROGRESS);
  }, []);

  const handleToggleDriverMode = () => {
      handleReset();
      setServerError(null);
      setIsDriverMode(prev => !prev);
  };

  const handleAcceptRide = async (rideId: string) => {
      const rideToAccept = availableRides.find(r => r.id === rideId);
      if (!rideToAccept || !rideToAccept.pickup) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}/accept`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to accept ride');
        
        // As the driver, we've accepted. Join the chat room.
        socketRef.current?.emit('join-ride-room', rideId);
        
        const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
        const randomVehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
        const acceptedRideDetails: RideRequest = { ...rideToAccept, driver: randomDriver, vehicle: randomVehicle };
        
        setRideDetails(acceptedRideDetails);
        currentRideRequestRef.current = acceptedRideDetails;
        socketRef.current?.emit('accept-ride', acceptedRideDetails);
        
        const driverStartPos = { lat: rideToAccept.pickup.lat + 0.005, lng: rideToAccept.pickup.lng + 0.005 };
        setDriverLocation(driverStartPos);
        setAppState(AppState.DRIVER_EN_ROUTE);
      } catch (error) {
          console.error("Error accepting ride:", error);
          setServerError("Failed to accept the ride. It may have been taken by another driver.");
      }
  };

  const handleTripComplete = useCallback(() => {
    setIsPanelMinimized(false);
    setIsTripPanelMinimized(true);
    setAppState(AppState.PAYMENT_PENDING);
  }, []);

  const handleConfirmPayment = () => {
    setAppState(AppState.VERIFYING_PAYMENT);
    setTimeout(() => {
        setAppState(AppState.CONFIRMED);
        setTimeout(() => handleReset(), 3000);
    }, 2500);
  };

  const handleRecenterMap = () => {
    setRecenterMapTimestamp(Date.now());
  };
  
  const handleTestConnection = useCallback(async () => {
      setIsTestingConnection(true);
      setServerError('Testing connection...');
      await checkServerStatus();
      setIsTestingConnection(false);
  }, [checkServerStatus, setServerError]);

  const toggleChat = () => {
    setIsChatVisible(prev => !prev);
  };

  const sendMessage = (text: string) => {
    const rideId = currentRideRequestRef.current?.id;
    if (!rideId) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isDriverMode ? 'driver' : 'rider',
      text,
      timestamp: new Date().toISOString(),
    };
    socketRef.current?.emit('send-message', { rideId, message: newMessage });
  };

  const initiateCall = (type: 'voice' | 'video') => {
    const caller = isDriverMode ? 'driver' : 'rider';
    setCallDetails({ status: CallStatus.RINGING, type, caller });
    setIsChatVisible(false);
    setTimeout(() => {
      setCallDetails(prev => {
        if (prev.status === CallStatus.RINGING) {
          return { ...prev, status: CallStatus.ACTIVE };
        }
        return prev;
      });
    }, 3000);
  };
  
  const answerCall = () => {
    setCallDetails(prev => ({ ...prev, status: CallStatus.ACTIVE }));
  };
  
  const endCall = () => {
    setCallDetails({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
  };

  const value: AppContextType = {
    appState,
    setAppState,
    selectionMode,
    setSelectionMode,
    isPanelMinimized,
    setIsPanelMinimized,
    isTripPanelMinimized,
    setIsTripPanelMinimized,
    language,
    setLanguage,
    rideDetails,
    updateRideDetails,
    rideOptions,
    charities,
    confirmationMessage,
    routeCoordinates,
    setRouteCoordinates,
    driverRouteCoordinates,
    setDriverRouteCoordinates,
    tripProgress,
    setTripProgress,
    driverLocation,
    handleBookingSubmit,
    handleTripComplete,
    handleReset,
    handleLocationSelect,
    handleSetPickup,
    handleSetDropoff,
    handleFocusLocationInput,
    handleStartBooking,
    isDriverMode,
    availableRides,
    handleToggleDriverMode,
    handleAcceptRide,
    handleCancelRequest,
    handleRecenterMap,
    recenterMapTimestamp,
    handleDriverArrived,
    calculateRouteDetails,
    handleConfirmPayment,
    isChatVisible,
    toggleChat,
    chatHistory,
    sendMessage,
    callDetails,
    initiateCall,
    answerCall,
    endCall,
    serverError,
    setServerError,
    isTestingConnection,
    handleTestConnection,
    serverStatus,
    checkServerStatus,
    pickupQuery,
    setPickupQuery,
    dropoffQuery,
    setDropoffQuery,
  };
<<<<<<< HEAD
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// --------------------------------------------------------
// 🧩 Hook: useAppContext
// --------------------------------------------------------
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

=======

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
>>>>>>> d19edb3 (Finalize all changes before rebase)

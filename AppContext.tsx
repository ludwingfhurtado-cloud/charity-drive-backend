
import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef, useMemo } from 'react';
import { AppState, RideDetails, RideOption, LatLng, SelectionMode, Language, RideRequest, Driver, Vehicle, Charity, ChatMessage, CallDetails, CallStatus } from '../types';
import { RIDE_OPTIONS } from '../constants';
import { getConfirmationMessage } from '../services/geminiService';
import { t } from '../i18n';
import { useLocationService } from '../hooks/useLocationService';

// ====================================================================================
// FINAL URL - CONNECTION COMPLETE!
// ====================================================================================
// The placeholder has been replaced with your live server URL.
// Your application is now fully connected!
// ====================================================================================
const API_BASE_URL = 'https://charity-drive-backend-production.up.railway.app/api';


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
  setServerError: React.Dispatch<React.SetStateAction<string | null>>;
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(true);
  const [isTripPanelMinimized, setIsTripPanelMinimized] = useState(true);
  const [language, setLanguageState] = useState<Language>('es');
  const [tripProgress, setTripProgress] = useState(0);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [recenterMapTimestamp, setRecenterMapTimestamp] = useState(0);

  // --- Driver Mode State ---
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [userRideRequestId, setUserRideRequestId] = useState<string | null>(null);
  const currentRideRequestRef = useRef<RideRequest | null>(null);

  // --- Chat and Call State ---
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [callDetails, setCallDetails] = useState<CallDetails>({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
  const [serverError, setServerError] = useState<string | null>(null);


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

  // Fetches available rides from the backend server.
  const fetchAvailableRides = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/rides`);
        if (!response.ok) {
            // This handles HTTP errors like 404, 500
            throw new Error(`Server responded with status: ${response.status}`);
        }
        const rides: RideRequest[] = await response.json();
        setAvailableRides(rides);
        if (serverError) setServerError(null); // Clear error on success
    } catch (error) {
        console.error("Error fetching available rides:", error);
        // This will catch network errors (like "Failed to fetch") and the thrown error above
        setServerError("Could not connect to the server. Please ensure it's running and try again.");
        setAvailableRides([]); // Clear stale data
    }
  };

  // Poll for available rides when in driver mode.
  useEffect(() => {
    if (isDriverMode && appState !== AppState.DRIVER_EN_ROUTE && appState !== AppState.IN_PROGRESS) {
      fetchAvailableRides(); // Fetch immediately on mode switch
      
      const interval = setInterval(fetchAvailableRides, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isDriverMode, appState]);
  
  // Poll for ride acceptance when user is waiting for a driver
  useEffect(() => {
    if (isDriverMode || appState !== AppState.AWAITING_DRIVER || !userRideRequestId) {
        return;
    }

    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/rides`);
            if (!response.ok) {
                console.error("Polling for ride status failed");
                return;
            }
            const currentRides: RideRequest[] = await response.json();
            const rideStillAvailable = currentRides.some(ride => ride.id === userRideRequestId);

            if (!rideStillAvailable) {
                // The ride is no longer available, meaning a driver accepted it.
                clearInterval(pollInterval);

                const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
                const randomVehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];

                updateRideDetails({ driver: randomDriver, vehicle: randomVehicle });

                if (rideDetails.pickup) {
                    const driverStartPos = { lat: rideDetails.pickup.lat + 0.005, lng: rideDetails.pickup.lng + 0.005 };
                    setDriverLocation(driverStartPos);
                }
                setAppState(AppState.DRIVER_EN_ROUTE);
            }
        } catch (error) {
            console.error("Error polling for ride status:", error);
            // In a real app, you might want to handle this more gracefully
        }
    }, 2500); // Poll every 2.5 seconds

    return () => clearInterval(pollInterval); // Cleanup on component unmount or state change

  }, [appState, userRideRequestId, rideDetails.pickup, isDriverMode, updateRideDetails]);
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  
  const handleFocusLocationInput = (mode: SelectionMode) => {
    setSelectionMode(mode);
    setIsPanelMinimized(true);
  };

  const calculateRouteDetails = useCallback((pickup: LatLng, dropoff: LatLng, rideOption: RideOption) => {
    setAppState(AppState.CALCULATING);
    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    
    const distanceKm = getDistanceFromLatLonInKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const travelTimeMinutes = (distanceKm / 25) * 60; 
    const suggestedFare = distanceKm * BASE_RATE_PER_KM * rideOption.multiplier;

    updateRideDetails({
        distanceInKm: parseFloat(distanceKm.toFixed(1)),
        travelTimeInMinutes: Math.round(travelTimeMinutes),
        suggestedFare: parseFloat(suggestedFare.toFixed(2)),
    });
    setTimeout(() => { // Simulate calculation time
        setAppState(AppState.IDLE);
        setIsPanelMinimized(false);
    }, 500);
  }, [updateRideDetails]);
  
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
    setSelectionMode('dropoff');

    if (currentDropoff) {
        calculateRouteDetails(latlng, currentDropoff, rideDetails.rideOption);
    }
  }, [rideDetails.dropoff, rideDetails.rideOption, calculateRouteDetails, updateRideDetails]);

  const handleSetDropoff = useCallback((latlng: LatLng, address: string | null) => {
    updateRideDetails({ dropoff: latlng, dropoffAddress: address });
    setSelectionMode(null);

    if (rideDetails.pickup) {
        calculateRouteDetails(rideDetails.pickup, latlng, rideDetails.rideOption);
    }
  }, [rideDetails.pickup, rideDetails.rideOption, calculateRouteDetails, updateRideDetails]);

  const handleLocationSelect = useCallback((latlng: LatLng, address: string | null) => {
    if (!selectionMode) return;
    
    const currentSelectionMode = selectionMode;

    if (address === null) {
        const tempAddress = t('fetching_address', language);
        if (currentSelectionMode === 'pickup') {
            handleSetPickup(latlng, tempAddress);
        } else {
            handleSetDropoff(latlng, tempAddress);
        }

        reverseGeocode(latlng).then(realAddress => {
            if (currentSelectionMode === 'pickup') {
                updateRideDetails({ pickupAddress: realAddress });
            } else {
                updateRideDetails({ dropoffAddress: realAddress });
            }
        });
    } else { 
        if (currentSelectionMode === 'pickup') {
            handleSetPickup(latlng, address);
        } else {
            handleSetDropoff(latlng, address);
        }
    }
  }, [selectionMode, language, handleSetPickup, handleSetDropoff, reverseGeocode, updateRideDetails]);

  const handleReset = useCallback(async (returnToBooking = false) => {
    // If there was a user-created ride request, cancel it via the API
    if (userRideRequestId) {
        try {
            await fetch(`${API_BASE_URL}/rides/${userRideRequestId}`, { method: 'DELETE' });
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
    // Reset chat and call state
    setIsChatVisible(false);
    setChatHistory([]);
    setCallDetails({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });

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
    
    const rideDataForServer = {
      ...rideDetails,
      rideOption,
      finalFare: offeredFare,
      charity: selectedCharity,
    };
    
    updateRideDetails({ rideOption, finalFare: offeredFare, charity: selectedCharity });
    
    try {
        setServerError(null); // Clear previous errors
        const response = await fetch(`${API_BASE_URL}/rides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rideDataForServer),
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Failed to create ride request.' }));
            console.error("Server responded with error:", response.status, errorBody);
            throw new Error(errorBody.message || 'Failed to create ride request');
        }

        const createdRide: RideRequest = await response.json();
        setUserRideRequestId(createdRide.id); // Use the REAL ID from the server
        currentRideRequestRef.current = createdRide;

        setIsPanelMinimized(true);
        setAppState(AppState.AWAITING_DRIVER);
    } catch (error) {
        console.error("Error creating ride request:", error);
        setServerError("Could not create ride request. Please ensure the server is running and try again.");
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
      setIsDriverMode(prev => !prev);
  };

  const handleAcceptRide = async (rideId: string) => {
      const rideToAccept = availableRides.find(r => r.id === rideId);
      if (!rideToAccept || !rideToAccept.pickup) return;

      try {
        const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to accept ride');
        
        const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
        const randomVehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
        
        const acceptedRideDetails: RideRequest = {
            ...rideToAccept,
            driver: randomDriver,
            vehicle: randomVehicle,
        };

        setRideDetails(acceptedRideDetails);
        currentRideRequestRef.current = acceptedRideDetails;
        
        fetchAvailableRides(); // Refresh ride list for driver UI

        const driverStartPos = { lat: rideToAccept.pickup.lat + 0.005, lng: rideToAccept.pickup.lng + 0.005 };
        setDriverLocation(driverStartPos);
        setAppState(AppState.DRIVER_EN_ROUTE);
      } catch (error) {
          console.error("Error accepting ride:", error);
      }
  };

  const handleTripComplete = useCallback(() => {
    setIsPanelMinimized(false);
    setIsTripPanelMinimized(true);
    setAppState(AppState.PAYMENT_PENDING);
  }, []);

  const handleConfirmPayment = () => {
    setAppState(AppState.VERIFYING_PAYMENT);
    // Simulate a network call to a payment verification endpoint
    setTimeout(() => {
        setAppState(AppState.CONFIRMED);
        // Automatically reset after showing confirmation for a bit
        setTimeout(() => handleReset(), 3000);
    }, 2500); // 2.5 second delay to simulate verification
  };

  const handleRecenterMap = () => {
    setRecenterMapTimestamp(Date.now());
  };

  // --- Chat and Call Handlers ---
  const toggleChat = () => {
    setIsChatVisible(prev => !prev);
  };

  const sendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isDriverMode ? 'driver' : 'rider',
      text,
      timestamp: new Date().toISOString(),
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const initiateCall = (type: 'voice' | 'video') => {
    // In our simulation, the other party is always available.
    // The person initiating the call is the 'caller'.
    const caller = isDriverMode ? 'driver' : 'rider';
    setCallDetails({ status: CallStatus.RINGING, type, caller });
    setIsChatVisible(false); // Close chat when call starts

    // Simulate the other person answering after a short delay
    setTimeout(() => {
      setCallDetails(prev => {
        // Only proceed if the call wasn't cancelled
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

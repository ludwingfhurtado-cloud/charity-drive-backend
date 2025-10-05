import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, RideDetails, RideOption, LatLng, SelectionMode, Language, RideRequest, Driver, Vehicle, Charity, ChatMessage, CallDetails, CallStatus } from '../types';
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

const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || '/api';
const SOCKET_URL = API_BASE_URL.startsWith('http') ? API_BASE_URL : window.location.origin;

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
  isTestingConnection: boolean;
  handleTestConnection: () => void;
  isMapsApiLoaded: boolean;
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

  const [isDriverMode, setIsDriverMode] = useState(false);
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [userRideRequestId, setUserRideRequestId] = useState<string | null>(null);
  const currentRideRequestRef = useRef<RideRequest | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [callDetails, setCallDetails] = useState<CallDetails>({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
  const [serverError, setServerError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);


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
  
  useEffect(() => {
    // This robust loader creates the script tag dynamically, eliminating race conditions.
    if (window.google?.maps || document.getElementById('google-maps-script')) {
      setIsMapsApiLoaded(true);
      return;
    }

    const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
        setServerError("API Key is missing. Please create a .env file and add your VITE_GOOGLE_MAPS_API_KEY.");
        return;
    }

    // Set up the authentication failure callback *before* loading the script.
    window.gm_authFailure = () => {
      setServerError("Google Maps Authentication Failed. This is a configuration issue. Please follow the checklist in index.html to fix it.");
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=routes,places,marker&v=beta`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
        setIsMapsApiLoaded(true);
        // Clean up the global callback after successful load
        delete window.gm_authFailure;
    };

    script.onerror = () => {
        setServerError("Failed to load Google Maps script. Please check your internet connection.");
    };
    
    document.body.appendChild(script);

    return () => {
      // Clean up the script and callback if the component unmounts.
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
      delete window.gm_authFailure;
    };
  }, []);


  const fetchAvailableRides = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/rides`);
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        const rides: RideRequest[] = await response.json();
        setAvailableRides(rides);
        if (serverError) setServerError(null);
    } catch (error) {
        console.error("Error fetching available rides:", error);
        setServerError("Could not connect to the server. Please ensure it's running and try again.");
        setAvailableRides([]);
    }
  };
  
  // Real-time WebSocket connection management
  useEffect(() => {
    // Connect to the socket server
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket.IO connected');
      if (serverError?.includes('connect')) setServerError(null);
    });

    socketRef.current.on('connect_error', () => {
      console.error('Socket.IO connection error');
      setServerError("Real-time connection failed. The server may be offline.");
    });
    
    // Listen for new rides (for drivers)
    socketRef.current.on('newRide', (newRide: RideRequest) => {
      if (isDriverMode) {
        setAvailableRides(prevRides => [newRide, ...prevRides]);
      }
    });

    // Listen for ride acceptance (for the specific rider)
    socketRef.current.on('rideAccepted', (acceptedRideId: string) => {
        if (!isDriverMode && acceptedRideId === userRideRequestId) {
            const randomDriver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
            const randomVehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
            updateRideDetails({ driver: randomDriver, vehicle: randomVehicle });
            if (rideDetails.pickup) {
                const driverStartPos = { lat: rideDetails.pickup.lat + 0.005, lng: rideDetails.pickup.lng + 0.005 };
                setDriverLocation(driverStartPos);
            }
            setAppState(AppState.DRIVER_EN_ROUTE);
        }
    });

    // Listen for updates to the ride list (e.g., a ride was accepted or cancelled)
    socketRef.current.on('rideListUpdate', (updatedRides: RideRequest[]) => {
      if (isDriverMode) {
        setAvailableRides(updatedRides);
      }
    });


    // Cleanup on component unmount
    return () => {
        socketRef.current?.disconnect();
    };
  }, [isDriverMode, userRideRequestId, rideDetails.pickup, updateRideDetails]);


  // Initial fetch for drivers when they switch to driver mode
  useEffect(() => {
    if (isDriverMode && appState !== AppState.DRIVER_EN_ROUTE && appState !== AppState.IN_PROGRESS) {
      fetchAvailableRides();
    }
  }, [isDriverMode, appState]);
  
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
        console.error("Google Maps API not loaded.");
        setServerError("Could not connect to mapping service. Check your API key and internet connection.");
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
        
        let errorMessage = "Failed to calculate route. Please check addresses and try again.";
        if (error.code === google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
            errorMessage = "We are experiencing high traffic right now. Please try again in a moment.";
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

        reverseGeocode(latlng, language).then(realAddress => {
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

  const handleReset = useCallback((returnToBooking = true) => {
      setAppState(AppState.IDLE);
      setRideDetails({
        pickup: null,
        dropoff: null,
        pickupAddress: null,
        dropoffAddress: null,
        rideOption: rideOptions[0],
        suggestedFare: 0,
        finalFare: 0,
      });
      setRouteCoordinates(null);
      setDriverRouteCoordinates(null);
      setSelectionMode(null);
      setIsPanelMinimized(true);
      setTripProgress(0);
      setDriverLocation(null);
      setUserRideRequestId(null);
      currentRideRequestRef.current = null;
      setIsChatVisible(false);
      setChatHistory([]);
      setCallDetails({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
  }, [rideOptions]);

  const handleBookingSubmit = useCallback(async (rideOption: RideOption, offeredFare: number, charityId: string) => {
    if (serverError) setServerError(null);
    const selectedCharity = charities.find(c => c.id === charityId);

    const newRideRequest: Omit<RideRequest, 'id'> = {
        ...rideDetails,
        rideOption,
        finalFare: offeredFare,
        charity: selectedCharity,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/rides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRideRequest),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create ride request.');
        }

        const savedRide: RideRequest = await response.json();
        setUserRideRequestId(savedRide.id);
        if(socketRef.current) {
          socketRef.current.emit('joinRideRoom', savedRide.id);
        }
        updateRideDetails({ finalFare: offeredFare, charity: selectedCharity });
        setAppState(AppState.AWAITING_DRIVER);
    } catch (error: any) {
        console.error("Error submitting ride request:", error);
        setServerError(`Submission failed: ${error.message}`);
    }
  }, [rideDetails, charities, serverError, updateRideDetails]);
  
  const handleCancelRequest = useCallback(async () => {
    if (userRideRequestId) {
        try {
            await fetch(`${API_BASE_URL}/rides/${userRideRequestId}`, {
                method: 'DELETE',
            });
            // The server will emit an event to notify drivers, so no need for client-side emission
        } catch (error) {
            console.error("Failed to cancel ride on server:", error);
        }
    }
    handleReset();
  }, [userRideRequestId, handleReset]);
  
  const handleToggleDriverMode = useCallback(() => {
    handleReset();
    setIsDriverMode(prev => !prev);
  }, [handleReset]);

  const handleAcceptRide = useCallback(async (rideId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to accept ride.');
        }
        
        const acceptedRide = availableRides.find(r => r.id === rideId);
        if (acceptedRide) {
            currentRideRequestRef.current = acceptedRide;
            updateRideDetails({ ...acceptedRide });
            if (acceptedRide.pickup) {
              const driverStartPos = { lat: acceptedRide.pickup.lat + 0.005, lng: acceptedRide.pickup.lng + 0.005 };
              setDriverLocation(driverStartPos);
            }
            setAppState(AppState.DRIVER_EN_ROUTE);
        }
    } catch (error) {
        console.error("Error accepting ride:", error);
        setServerError("Could not accept the ride. It may have been taken by another driver.");
    }
  }, [availableRides, updateRideDetails]);

  const handleDriverArrived = useCallback(() => {
    setAppState(AppState.IN_PROGRESS);
  }, []);

  const handleTripComplete = useCallback(() => {
    setAppState(AppState.PAYMENT_PENDING);
    setIsPanelMinimized(false);
    setIsTripPanelMinimized(true);
  }, []);
  
  const handleConfirmPayment = useCallback(async () => {
    setAppState(AppState.VERIFYING_PAYMENT);
    const msg = await getConfirmationMessage(rideDetails.finalFare, language);
    setConfirmationMessage(msg);
    // Simulate payment verification delay
    setTimeout(() => {
      // In a real app, you'd handle this after a webhook from the payment provider
      if (isDriverMode && currentRideRequestRef.current) {
          handleReset(); // Driver goes back to dashboard
      } else {
          setAppState(AppState.CONFIRMED); // Rider sees confirmation
      }
    }, 2000);
  }, [rideDetails.finalFare, language, isDriverMode, handleReset]);

  const handleRecenterMap = useCallback(() => {
    setRecenterMapTimestamp(Date.now());
  }, []);

  const toggleChat = useCallback(() => setIsChatVisible(prev => !prev), []);
  
  const sendMessage = useCallback((text: string) => {
    const sender = isDriverMode ? 'driver' : 'rider';
    const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender,
        text,
        timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, newMessage]);
    // Simulate a reply
    setTimeout(() => {
        const reply: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: sender === 'rider' ? 'driver' : 'rider',
            text: "Ok, I'm on my way.",
            timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, reply]);
    }, 1500);
  }, [isDriverMode]);
  
  const initiateCall = useCallback((type: 'voice' | 'video') => {
    setCallDetails({ status: CallStatus.RINGING, type, caller: isDriverMode ? 'driver' : 'rider' });
    // Simulate call being answered
    setTimeout(() => {
        if (callDetails.status === CallStatus.RINGING) { // Check if call wasn't cancelled
            setCallDetails(prev => ({ ...prev, status: CallStatus.ACTIVE }));
        }
    }, 4000);
  }, [isDriverMode, callDetails.status]);

  const answerCall = useCallback(() => {
    setCallDetails(prev => ({ ...prev, status: CallStatus.ACTIVE }));
  }, []);
  
  const endCall = useCallback(() => {
    setCallDetails({ status: CallStatus.NONE, type: 'voice', caller: 'rider' });
  }, []);
  
  const handleTestConnection = useCallback(async () => {
    setIsTestingConnection(true);
    setServerError(null);
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        // If successful, the error will be cleared. No success message needed here.
    } catch (error: any) {
        setServerError(`Connection failed. The server is offline or unreachable.`);
    } finally {
        setIsTestingConnection(false);
    }
  }, []);

  const contextValue = {
    appState, setAppState,
    selectionMode, setSelectionMode,
    isPanelMinimized, setIsPanelMinimized,
    isTripPanelMinimized, setIsTripPanelMinimized,
    language, setLanguage,
    rideDetails, updateRideDetails,
    rideOptions,
    charities,
    confirmationMessage,
    routeCoordinates, setRouteCoordinates,
    driverRouteCoordinates, setDriverRouteCoordinates,
    tripProgress, setTripProgress,
    driverLocation,
    isDriverMode,
    availableRides,
    handleToggleDriverMode,
    handleAcceptRide,
    handleCancelRequest,
    handleBookingSubmit,
    handleTripComplete,
    handleReset,
    handleLocationSelect,
    handleSetPickup,
    handleSetDropoff,
    handleFocusLocationInput,
    handleStartBooking,
    handleRecenterMap,
    recenterMapTimestamp,
    handleDriverArrived,
    calculateRouteDetails,
    handleConfirmPayment,
    isChatVisible, toggleChat,
    chatHistory, sendMessage,
    callDetails, initiateCall, answerCall, endCall,
    serverError, setServerError,
    isTestingConnection, handleTestConnection,
    isMapsApiLoaded,
  };
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


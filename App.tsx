import React, { useRef, useEffect, useState } from 'react';
import { AppState, CallStatus } from './types';
import BookingForm from './components/BookingForm';
import Confirmation from './components/Confirmation';
import InteractiveMap from './components/InteractiveMap';
import LoadingSpinner from './components/LoadingSpinner';
import TripProgress from './components/TripProgress';
import { useAppContext } from './hooks/useAppContext';
import { t } from './i18n';
import AwaitingDriver from './components/AwaitingDriver';
import DriverDashboard from './components/DriverDashboard';
import DriverEnRoute from './components/DriverEnRoute';
import FloatingLocationBar from './components/FloatingLocationBar';
import PaymentRequest from './components/PaymentRequest';
import ChatButton from './components/ChatButton';
import ChatPanel from './components/ChatPanel';
import CallInterface from './components/CallInterface';

const ChevronIcon = ({ isMinimized }: { isMinimized: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${!isMinimized ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const App: React.FC = () => {
  const { 
    appState, 
    language, 
    isPanelMinimized, 
    setIsPanelMinimized,
    isTripPanelMinimized,
    setIsTripPanelMinimized,
    rideDetails,
    isDriverMode,
    isChatVisible,
    callDetails,
  } = useAppContext();
  
  const panelRef = useRef<HTMLDivElement>(null);
  const tripPanelRef = useRef<HTMLDivElement>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(0);

  useEffect(() => {
    // This effect calculates the height of the bottom panel to create padding for the map view.
    const bottomOffset = 16;
    let newHeight = 0;

    const mainPanel = panelRef.current;
    const tripPanel = tripPanelRef.current;

    // Consistent collapsed height for main panel (8rem = 128px)
    const collapsedMainPanelHeight = 128; 

    if (appState === AppState.IN_PROGRESS && tripPanel) {
        newHeight = isTripPanelMinimized ? 72 : tripPanel.offsetHeight + bottomOffset;
    } else if (appState === AppState.DRIVER_EN_ROUTE && mainPanel) {
        newHeight = mainPanel.offsetHeight + bottomOffset;
    } else if (mainPanel && ![AppState.IN_PROGRESS, AppState.PAYMENT_PENDING].includes(appState)) {
        newHeight = isPanelMinimized ? collapsedMainPanelHeight : mainPanel.offsetHeight + bottomOffset;
    } else if (appState === AppState.PAYMENT_PENDING && mainPanel) {
        newHeight = mainPanel.offsetHeight + bottomOffset;
    }
    
    setBottomPanelHeight(newHeight);
  }, [appState, isTripPanelMinimized, isPanelMinimized, isDriverMode, rideDetails, panelRef.current?.offsetHeight, tripPanelRef.current?.offsetHeight]);

  const handleTogglePanel = () => {
    setIsPanelMinimized(prev => !prev);
  };
  
  const handleToggleTripPanel = () => {
    setIsTripPanelMinimized(prev => !prev);
  };

  const renderRiderContent = () => {
    switch (appState) {
      case AppState.IDLE:
      case AppState.CALCULATING:
        return <BookingForm />;
      case AppState.AWAITING_DRIVER:
        return <AwaitingDriver />;
      case AppState.DRIVER_EN_ROUTE:
        return <DriverEnRoute />;
      case AppState.PAYMENT_PENDING:
        return <Confirmation />;
      default:
        return null;
    }
  };

  const renderDriverContent = () => {
    switch (appState) {
      case AppState.DRIVER_EN_ROUTE:
        return <DriverEnRoute />;
      case AppState.PAYMENT_PENDING:
        return <PaymentRequest />;
      default:
        return <DriverDashboard />;
    }
  };

  const getGrabberAriaLabel = () => {
    return t(isPanelMinimized ? 'panel_grabber_expand_aria' : 'panel_grabber_collapse_aria', language);
  }
  
  const getTripGrabberAriaLabel = () => {
    return t(isTripPanelMinimized ? 'panel_grabber_expand_aria' : 'panel_grabber_collapse_aria', language);
  }

  const getPanelTransformClass = () => {
    if (appState === AppState.IN_PROGRESS) {
      return 'translate-y-[calc(100%+1rem)]';
    }
    // Make the collapsed panel taller for better visibility, especially in driver mode.
    if (isPanelMinimized && appState !== AppState.DRIVER_EN_ROUTE) {
      return 'translate-y-[calc(100%-8rem)]'; 
    }
    return 'translate-y-0';
  };
  
  const getTripPanelTransformClass = () => {
    if (appState !== AppState.IN_PROGRESS) {
      return 'translate-y-[calc(100%+1rem)]';
    }
    return isTripPanelMinimized ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0';
  };
  
  const getPanelZIndexClass = () => {
    if (appState === AppState.DRIVER_EN_ROUTE) {
      return 'z-[51]'; // Higher than language selector (z-50)
    }
    return 'z-30';
  };

  const showLoadingSpinner = [AppState.CALCULATING, AppState.VERIFYING_PAYMENT].includes(appState);
  const getLoadingMessage = () => {
      if (appState === AppState.CALCULATING) return t('loading_calculating', language);
      if (appState === AppState.VERIFYING_PAYMENT) return t('loading_verifying_payment', language);
      return '';
  }

  const renderContent = isDriverMode ? renderDriverContent() : renderRiderContent();
  const showLocationBar = !isDriverMode && [AppState.IDLE, AppState.CALCULATING].includes(appState);
  
  const showChatButton = [AppState.AWAITING_DRIVER, AppState.DRIVER_EN_ROUTE, AppState.IN_PROGRESS].includes(appState);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-900 font-sans antialiased">
      <InteractiveMap bottomPanelHeight={bottomPanelHeight} />
      
      {showLocationBar && <FloatingLocationBar />}
      
      <div 
        ref={panelRef} 
        className={`absolute bottom-4 left-4 right-4 transition-transform duration-500 ease-in-out ${getPanelTransformClass()} ${getPanelZIndexClass()}`}
      >
        <div className="bg-[#2C2A4A]/95 text-white rounded-2xl shadow-2xl backdrop-blur-md max-w-md mx-auto">
          {/* Universal Grabber with Arrow */}
          <div 
            className="w-full h-8 flex justify-center items-center cursor-pointer"
            onClick={handleTogglePanel}
            role="button"
            aria-expanded={!isPanelMinimized}
            aria-label={getGrabberAriaLabel()}
            tabIndex={0}
          >
            <ChevronIcon isMinimized={isPanelMinimized} />
          </div>
          
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {renderContent}
          </div>
        </div>
      </div>

      <div 
        ref={tripPanelRef} 
        className={`absolute bottom-4 left-4 right-4 transition-transform duration-500 ease-in-out ${getTripPanelTransformClass()} z-[51]`}
      >
        <div className="bg-[#2C2A4A]/95 text-white rounded-2xl shadow-2xl backdrop-blur-md max-w-md mx-auto">
            <div 
                className="w-full h-8 flex justify-center items-center"
                onClick={handleToggleTripPanel}
                role="button"
                aria-expanded={!isTripPanelMinimized}
                aria-label={getTripGrabberAriaLabel()}
                tabIndex={0}
            >
                <ChevronIcon isMinimized={isTripPanelMinimized} />
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <TripProgress />
            </div>
        </div>
      </div>
      
      {/* Communication UI */}
      {showChatButton && <ChatButton />}
      {isChatVisible && <ChatPanel />}
      {callDetails.status !== CallStatus.NONE && <CallInterface />}

      {/* Fullscreen Loading Spinner */}
      {showLoadingSpinner && (
        <LoadingSpinner 
          message={getLoadingMessage()} 
        />
      )}
    </div>
  );
};

export default App;
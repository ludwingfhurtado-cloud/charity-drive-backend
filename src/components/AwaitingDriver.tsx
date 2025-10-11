import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../../i18n';

const AwaitingDriver: React.FC = () => {
    const { language, handleCancelRequest, rideDetails } = useAppContext();

    return (
        <div className="w-full max-w-lg mx-auto text-center animate-fade-in flex flex-col items-center">
            <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                {/* Radar/Beacon Pulses */}
                <div className="absolute w-full h-full rounded-full border-2 border-blue-500" style={{ animation: 'radar-pulse 2s infinite ease-out' }}></div>
                <div className="absolute w-full h-full rounded-full border-2 border-blue-500" style={{ animation: 'radar-pulse 2s infinite ease-out', animationDelay: '0.5s' }}></div>
                <div className="absolute w-full h-full rounded-full border-2 border-blue-500" style={{ animation: 'radar-pulse 2s infinite ease-out', animationDelay: '1s' }}></div>

                {/* Central Icon */}
                <div className="relative w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">{t('awaiting_driver_title', language)}</h2>
            <p className="text-gray-400 mb-6">{t('awaiting_driver_subtitle', language)}</p>

            <div className="bg-gray-800/50 rounded-lg p-3 text-center w-full mb-6">
              <p className="text-sm text-gray-400">{t('your_offer_was', language)}</p>
              <p className="text-2xl font-bold text-emerald-400">Bs. {rideDetails.finalFare.toFixed(2)}</p>
            </div>

            <button
                onClick={handleCancelRequest}
                className="w-full bg-red-800/50 text-red-300 font-bold py-3 px-4 rounded-lg hover:bg-red-800/80 hover:text-red-200 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-colors"
            >
                {t('cancel_request_button', language)}
            </button>
        </div>
    );
};

export default AwaitingDriver;

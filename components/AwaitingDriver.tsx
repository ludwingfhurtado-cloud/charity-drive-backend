import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';

const AwaitingDriver: React.FC = () => {
    const { language, handleCancelRequest, rideDetails } = useAppContext();

    return (
        <div className="w-full max-w-lg mx-auto text-center animate-fade-in flex flex-col items-center">
            <div className="relative w-24 h-24 mb-6">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.3"/>
                    <circle cx="50" cy="50" r="35" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.5"/>
                    <circle cx="50" cy="50" r="22" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.8"/>
                    <path d="M50 0 A 50 50 0 0 1 85.35 14.64" stroke="#60A5FA" strokeWidth="3">
                        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="2s" repeatCount="indefinite" />
                    </path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
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
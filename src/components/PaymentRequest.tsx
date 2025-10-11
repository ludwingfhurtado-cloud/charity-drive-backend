import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../../i18n';

const PaymentRequest: React.FC = () => {
    const { language, rideDetails } = useAppContext();

    return (
        <div className="w-full max-w-lg mx-auto text-center animate-fade-in flex flex-col items-center">
            <div className="relative w-24 h-24 mb-6">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.3"/>
                    <path d="M50 0 A 50 50 0 0 1 85.35 14.64" stroke="#60A5FA" strokeWidth="3">
                        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="2s" repeatCount="indefinite" />
                    </path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
            </div>
            
             <h2 className="text-2xl font-bold text-white mb-2">{t('payment_request_title', language)}</h2>
             <p className="text-gray-400 mb-6">{t('payment_request_subtitle', language)}</p>

            <div className="bg-gray-800/50 rounded-lg p-3 text-center w-full">
              <p className="text-sm text-gray-400">{t('final_fare_label', language)}</p>
              <p className="text-3xl font-bold text-emerald-400">Bs. {rideDetails.finalFare.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default PaymentRequest;
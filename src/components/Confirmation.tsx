import React from 'react';
import { LatLng } from '../../types';
import { t } from '../../i18n';
import { useAppContext } from '../hooks/useAppContext';
import { COMPANY_QR_CODE_IMAGE } from '../../assets/images';

const formatLocation = (address: string | null, latlng: LatLng | null) => {
    if (address) return address;
    if (latlng) return `Lat: ${latlng.lat.toFixed(2)}, Lng: ${latlng.lng.toFixed(2)}`;
    return "N/A";
};

const Confirmation: React.FC = () => {
  const { rideDetails, language, handleConfirmPayment } = useAppContext();

  return (
    <div className="w-full max-w-lg mx-auto text-center animate-fade-in">
        <div className="mx-auto bg-emerald-900 border-4 border-emerald-500 rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{t('payment_title', language)}</h2>
        <p className="text-gray-400 mb-4 text-base">{t('payment_subtitle', language)}</p>
        
        <div className="bg-gray-800 rounded-xl p-4 mb-4 text-center space-y-2 flex flex-col items-center">
            <p className="text-gray-400 font-semibold text-sm">{t('final_fare_label', language)}</p>
            <p className="font-bold text-4xl text-emerald-500 mb-3">Bs. {rideDetails.finalFare.toFixed(2)}</p>
            <img src={COMPANY_QR_CODE_IMAGE} alt="Payment QR Code" className="w-48 h-48 rounded-lg bg-white p-2" />
        </div>
        
        <button
            onClick={handleConfirmPayment}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
        >
            {t('payment_confirm_button', language)}
        </button>
    </div>
  );
};

export default Confirmation;
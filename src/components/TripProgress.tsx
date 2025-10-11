import React from 'react';
import { LatLng } from '../../types';
import { t } from '../../i18n';
import { useAppContext } from '../hooks/useAppContext';

const TripProgress: React.FC = () => {
    const { rideDetails, handleReset, language, tripProgress } = useAppContext();
    const initialTime = rideDetails.travelTimeInMinutes || 10;
    const eta = Math.max(0, Math.ceil(initialTime * (1 - (tripProgress / 100))));
    const { dropoffAddress, dropoff, rideOption, driver, vehicle } = rideDetails;

    const formatDropoff = () => {
        if (dropoffAddress) return dropoffAddress;
        if (dropoff) return `Lat: ${dropoff.lat.toFixed(2)}, Lng: ${dropoff.lng.toFixed(2)}`;
        return "N/A";
    };

    return (
        <div className="w-full max-w-lg mx-auto text-white animate-fade-in">
            <h2 className="text-xl font-bold text-center mb-4">{t('trip_progress_title', language)}</h2>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-5">
                <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${tripProgress}%`, transition: 'width 0.2s linear' }}
                ></div>
            </div>

            <div className="space-y-4">
                {/* ETA and Destination */}
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center">
                        <div className="text-gray-400 text-sm font-medium">{t('eta_label', language)}</div>
                        <div className="text-3xl font-bold text-blue-400">~{eta} <span className="text-lg font-semibold">min</span></div>
                    </div>
                    <div className="text-left min-w-0"> {/* min-w-0 is crucial for text truncation in flex/grid */}
                        <div className="text-gray-400 text-sm font-medium">{t('to_label', language)}</div>
                        <div className="font-semibold truncate" title={formatDropoff()}>{formatDropoff()}</div>
                    </div>
                </div>

                {/* Driver and Vehicle Info */}
                {driver && vehicle && (
                    <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                                <div className="text-gray-400 text-xs font-medium">{t('driver_name_label', language)}</div>
                                <div className="font-semibold">{driver.name}</div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs font-medium">{t('license_plate_label', language)}</div>
                                <div className="font-semibold">{driver.licensePlate}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-gray-400 text-xs font-medium">{t('vehicle_label', language)}</div>
                                <div className="font-semibold">{vehicle.color} {vehicle.model}</div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Ride Type */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-700">
                    <span className="font-bold text-lg">{t(`ride_${rideOption.id}_name`, language)}</span>
                    <img src={rideOption.icon} alt={t(`ride_${rideOption.id}_name`, language)} className="w-16 h-10 object-contain" />
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={() => handleReset()}
                    className="w-full bg-red-800/50 text-red-300 font-bold py-3 px-4 rounded-lg hover:bg-red-800/80 hover:text-red-200 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-colors"
                >
                    {t('cancel_journey_button', language)}
                </button>
            </div>
        </div>
    );
};

export default TripProgress;
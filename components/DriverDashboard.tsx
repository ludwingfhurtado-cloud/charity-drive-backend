import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';
import { RideRequest } from '../types';

const DriverDashboard: React.FC = () => {
    const { availableRides, handleAcceptRide, language, updateRideDetails, serverError, isTestingConnection, handleTestConnection } = useAppContext();

    const handleSelectRide = (ride: RideRequest) => {
        // Set the ride details to show the route on the map
        updateRideDetails(ride);
    };

    if (serverError) {
        return (
            <div className="text-center p-4 bg-red-900/50 border border-red-700 rounded-lg space-y-3">
                <h2 className="text-xl font-bold text-red-300 mb-2">Connection Error</h2>
                <p className="text-red-400">{serverError}</p>
                <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-4 py-2 text-sm bg-red-800/60 text-red-200 rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isTestingConnection ? 'Testing...' : 'Test Server Connection'}
                </button>
            </div>
        );
    }

    if (availableRides.length === 0) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-bold mb-4">{t('driver_dashboard_title', language)}</h2>
                <p className="text-gray-400">{t('no_rides_available', language)}</p>
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <h2 className="text-xl font-bold text-center mb-4">{t('driver_dashboard_title', language)}</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {availableRides.map(ride => (
                    <div 
                        key={ride.id} 
                        className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50"
                        onClick={() => handleSelectRide(ride)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">{t('from_label', language)}</div>
                                <p className="font-semibold truncate" title={ride.pickupAddress || ''}>{ride.pickupAddress}</p>
                                <div className="text-xs text-gray-400 mt-2">{t('to_label', language)}</div>
                                <p className="font-semibold truncate" title={ride.dropoffAddress || ''}>{ride.dropoffAddress}</p>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                                <div className="text-xs text-gray-400">{t('fare_offered_label', language)}</div>
                                <p className="font-bold text-lg text-emerald-400">Bs. {ride.finalFare.toFixed(2)}</p>
                                {ride.distanceInKm != null && (
                                     <p className="text-xs text-gray-400 mt-1">{ride.distanceInKm.toFixed(1)} km</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                             <button
                                onClick={(e) => { e.stopPropagation(); handleAcceptRide(ride.id); }}
                                className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                             >
                                {t('accept_ride_button', language)}
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriverDashboard;

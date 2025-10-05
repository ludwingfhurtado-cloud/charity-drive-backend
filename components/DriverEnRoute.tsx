import React, { useState, useEffect } from 'react';
import { LatLng } from '../types';
import { t } from '../i18n';
import { useAppContext } from '../hooks/useAppContext';

const DriverEnRoute: React.FC = () => {
    const { rideDetails, language, driverLocation, handleReset } = useAppContext();
    const { pickupAddress, pickup, rideOption, driver, vehicle } = rideDetails;
    const [eta, setEta] = useState(0);

    const formatPickup = () => {
        if (pickupAddress) return pickupAddress;
        if (pickup) return `Lat: ${pickup.lat.toFixed(2)}, Lng: ${pickup.lng.toFixed(2)}`;
        return "N/A";
    };
    
    // Calculate ETA
    useEffect(() => {
        if (driverLocation && pickup) {
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
            const distance = getDistanceFromLatLonInKm(driverLocation.lat, driverLocation.lng, pickup.lat, pickup.lng);
            const timeInMinutes = Math.max(1, Math.round((distance / 30) * 60)); // Assume 30km/h avg speed
            setEta(timeInMinutes);
        }
    }, [driverLocation, pickup]);

    return (
        <div className="w-full max-w-lg mx-auto text-white animate-fade-in">
            <h2 className="text-xl font-bold text-center mb-4">{t('driver_en_route_title', language)}</h2>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center">
                        <div className="text-gray-400 text-sm font-medium">{t('driver_eta_label', language)}</div>
                        <div className="text-3xl font-bold text-blue-400">~{eta} <span className="text-lg font-semibold">min</span></div>
                    </div>
                    <div className="text-left min-w-0">
                        <div className="text-gray-400 text-sm font-medium">{t('pickup_label', language)}</div>
                        <div className="font-semibold truncate" title={formatPickup()}>{formatPickup()}</div>
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

export default DriverEnRoute;
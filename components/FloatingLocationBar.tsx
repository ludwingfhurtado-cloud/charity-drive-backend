import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import LocationSearchInput from './LocationSearchInput';

const FloatingLocationBar: React.FC = () => {
    const { rideDetails, handleSetPickup, handleSetDropoff } = useAppContext();

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 animate-fade-in">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-3 space-y-2">
                <LocationSearchInput 
                    mode="pickup"
                    initialValue={rideDetails.pickupAddress}
                    onLocationSelect={handleSetPickup}
                />
                <LocationSearchInput 
                    mode="dropoff"
                    initialValue={rideDetails.dropoffAddress}
                    onLocationSelect={handleSetDropoff}
                />
            </div>
        </div>
    );
};

export default FloatingLocationBar;
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import LocationSearchInput from './LocationSearchInput';

const FloatingLocationBar: React.FC = () => {
    const { 
        handleSetPickup, 
        handleSetDropoff,
        pickupQuery,
        setPickupQuery,
        dropoffQuery,
        setDropoffQuery
    } = useAppContext();

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 animate-fade-in">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-3 space-y-2">
                <LocationSearchInput 
                    mode="pickup"
                    query={pickupQuery}
                    onQueryChange={setPickupQuery}
                    onLocationSelect={handleSetPickup}
                />
                <LocationSearchInput 
                    mode="dropoff"
                    query={dropoffQuery}
                    onQueryChange={setDropoffQuery}
                    onLocationSelect={handleSetDropoff}
                />
            </div>
        </div>
    );
};

export default FloatingLocationBar;
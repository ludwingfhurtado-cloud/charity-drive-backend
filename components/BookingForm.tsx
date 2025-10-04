import React, { useState, useEffect } from 'react';
import { RideOption } from '../types';
import { t } from '../i18n';
import { useAppContext } from '../hooks/useAppContext';

const BookingForm: React.FC = () => {
  const {
    rideOptions,
    charities,
    handleBookingSubmit,
    appState,
    rideDetails,
    updateRideDetails,
    language,
    calculateRouteDetails,
    serverError,
    setServerError,
    isTestingConnection,
    handleTestConnection,
  } = useAppContext();

  const [selectedRide, setSelectedRide] = useState<RideOption>(rideOptions[0]);
  const [offeredFare, setOfferedFare] = useState('');
  const [selectedCharityId, setSelectedCharityId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (charities.length > 0 && !selectedCharityId) {
      setSelectedCharityId(charities[0].id);
    }
  }, [charities, selectedCharityId]);
  
  // Clear server error when component unmounts or user starts new action
  useEffect(() => {
      return () => {
          if (serverError) {
              setServerError(null);
          }
      };
  }, [serverError, setServerError]);

  useEffect(() => {
    // This effect now also handles recalculating the fare if the ride type changes
    // after a pickup and dropoff have already been selected.
    if (rideDetails.rideOption.id !== selectedRide.id) {
        updateRideDetails({ rideOption: selectedRide });
        if (rideDetails.pickup && rideDetails.dropoff) {
            calculateRouteDetails(rideDetails.pickup, rideDetails.dropoff, selectedRide);
        }
    }
  }, [selectedRide, rideDetails.rideOption, rideDetails.pickup, rideDetails.dropoff, updateRideDetails, calculateRouteDetails]);
  
  useEffect(() => {
    if (rideDetails.suggestedFare > 0) {
      setOfferedFare(rideDetails.suggestedFare.toFixed(2));
    } else {
      setOfferedFare('');
    }
  }, [rideDetails.suggestedFare]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideDetails.pickup || !rideDetails.dropoff || !rideDetails.pickupAddress || !rideDetails.dropoffAddress) {
      setError(t('error_set_both_locations', language));
      return;
    }
    const fare = parseFloat(offeredFare);
    if (isNaN(fare) || fare <= 0) {
      setError('Please enter a valid fare amount.');
      return;
    }
    if (!selectedCharityId) {
        setError('Please select a charity.'); // This should ideally not happen
        return;
    }
    setError(null);
    handleBookingSubmit(selectedRide, fare, selectedCharityId);
  };

  const handleFareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setOfferedFare(value);
      if (serverError) setServerError(null); // Clear server error on interaction
      if (error) setError(null); // Clear validation error on interaction
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-around mb-6 bg-black/20 p-1 rounded-full">
          {rideOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedRide(option)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors flex-shrink-0 ${
                selectedRide.id === option.id 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-indigo-900/50'
              }`}
              aria-pressed={selectedRide.id === option.id}
            >
              <span>{t(`ride_${option.id}_name`, language)}</span>
            </button>
          ))}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {rideDetails.suggestedFare > 0 && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-[#1E1B3A] rounded-lg p-3 text-center">
              <p className="text-sm text-indigo-300">{t('suggested_fare_label', language)}</p>
              <p className="text-2xl font-bold text-teal-400">Bs. {rideDetails.suggestedFare.toFixed(2)}</p>
            </div>
            
            <div>
              <label htmlFor="fare-input" className="block text-sm font-medium text-indigo-300 mb-1 text-center">
                {t('your_offer_label', language)}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-300">Bs.</span>
                <input
                  id="fare-input"
                  type="text"
                  inputMode="decimal"
                  value={offeredFare}
                  onChange={handleFareChange}
                  className="w-full bg-[#1E1B3A] rounded-lg p-3 pl-10 text-center text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('fare_input_placeholder', language)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="charity-select" className="block text-sm font-medium text-indigo-300 mb-1 text-center">
                {t('charity_select_label', language)}
              </label>
              <select
                id="charity-select"
                value={selectedCharityId}
                onChange={(e) => setSelectedCharityId(e.target.value)}
                className="w-full bg-[#1E1B3A] rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-center"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                }}
              >
                {charities.map(charity => (
                  <option key={charity.id} value={charity.id} className="bg-[#1E1B3A] text-white">
                    {charity.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        
        {serverError && (
          <div className="text-center bg-red-900/40 p-3 rounded-lg space-y-2">
            <p className="text-red-300 text-sm">{serverError}</p>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="px-3 py-1 text-xs bg-red-800/60 text-red-200 rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-wait"
            >
              {isTestingConnection ? 'Testing...' : 'Test Server Connection'}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={appState === 'CALCULATING' || !rideDetails.suggestedFare || rideDetails.suggestedFare <= 0}
          className="w-full bg-rose-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-rose-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          aria-label={t('request_ride_aria', language)}
        >
          <span>{t('request_ride_button', language)}</span>
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
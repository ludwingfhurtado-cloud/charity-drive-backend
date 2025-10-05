import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocationService } from '../hooks/useLocationService';
import { LatLng } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../i18n';

const SearchSpinner = () => (
    <div className="w-4 h-4 border-2 border-t-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
);

const GpsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
    
    return debounced;
}

interface LocationSearchInputProps {
    mode: 'pickup' | 'dropoff';
    initialValue: string | null;
    onLocationSelect: (latlng: LatLng, address: string) => void;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({ mode, initialValue, onLocationSelect }) => {
    const { language, handleStartBooking, setServerError } = useAppContext();
    const { locateUser, searchLocations } = useLocationService();
    const [query, setQuery] = useState(initialValue || '');
    const [suggestions, setSuggestions] = useState<{ lat: number; lng: number; address: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update query if initialValue changes from context
    useEffect(() => {
        setQuery(initialValue || '');
    }, [initialValue]);
    
    // Debounced search function
    const debouncedSearch = useCallback(debounce(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        const results = await searchLocations(searchQuery, language);
        setSuggestions(results);
        setIsSearching(false);
    }, 500), [searchLocations, language]);

    useEffect(() => {
        // Prevent searching for the fallback coordinate string to break the infinite loop
        if (query.startsWith('Lat:')) {
            setSuggestions([]);
            return;
        }
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    // Handle clicks outside the component to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUseCurrentLocation = () => {
        setIsLocating(true);
        setServerError(null); // Clear previous errors
        locateUser(
            language,
            (latlng, address) => {
                onLocationSelect(latlng, address || '');
                setQuery(address || `Lat: ${latlng.lat.toFixed(3)}, Lng: ${latlng.lng.toFixed(3)}`);
                setIsLocating(false);
                setIsFocused(false);
            },
            (error) => {
                setServerError(error); // Show error in the main UI
                setIsLocating(false);
            }
        );
    };

    const handleSelectSuggestion = (suggestion: { lat: number; lng: number; address: string }) => {
        onLocationSelect({ lat: suggestion.lat, lng: suggestion.lng }, suggestion.address);
        setQuery(suggestion.address);
        setSuggestions([]);
        setIsFocused(false);
    };
    
    const handleFocus = () => {
        setIsFocused(true);
        handleStartBooking(mode);
    };

    const color = mode === 'pickup' ? 'bg-green-500' : 'bg-red-500';
    const placeholder = mode === 'pickup' ? t('pickup_location_label', language) : t('dropoff_location_label', language);

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${color}`}></div>
                <div className="flex-grow relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                        placeholder={placeholder}
                        className="w-full bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none"
                    />
                </div>
                {isSearching || isLocating ? (
                    <SearchSpinner />
                ) : (
                    <button
                        onClick={handleUseCurrentLocation}
                        className="text-white hover:text-blue-400"
                        aria-label={t('use_current_location_aria', language) + ' ' + placeholder}
                    >
                        <GpsIcon />
                    </button>
                )}
            </div>
            
            {isFocused && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-2 bg-[#1E1B3A] border border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    {suggestions.map((s, index) => (
                        <li 
                            key={index}
                            onClick={() => handleSelectSuggestion(s)}
                            className="px-4 py-2 text-sm text-gray-300 hover:bg-indigo-900/50 cursor-pointer"
                        >
                            {s.address}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LocationSearchInput;
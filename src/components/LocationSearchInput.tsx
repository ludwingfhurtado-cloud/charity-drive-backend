import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocationService } from '../hooks/useLocationService';
import { LatLng } from '../../types';
import { useAppContext } from '../hooks/useAppContext';
import { t } from '../../i18n';

const SearchSpinner = () => (
    <div className="w-4 h-4 border-2 border-t-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
);

const GpsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>): void => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
    
    return debounced;
}

interface LocationSearchInputProps {
    mode: 'pickup' | 'dropoff';
    query: string;
    onQueryChange: (query: string) => void;
    onLocationSelect: (latlng: LatLng, address: string) => void;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({ mode, query, onQueryChange, onLocationSelect }) => {
    const { language, handleStartBooking, setServerError } = useAppContext();
    const { locateUser, searchLocations } = useLocationService();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const debouncedSearch = useMemo(() => 
        debounce(async (searchQuery: string) => {
            setIsSearching(true);
            try {
                setServerError(null);
                const results = await searchLocations(searchQuery);
                setSuggestions(results);
            } catch (error) {
                console.error("Search failed:", error);
                const errorMessage = error instanceof Error ? error.message : t('error_search_failed', language);
                setServerError(errorMessage);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 500), 
    [searchLocations, language, setServerError]);

    useEffect(() => {
        const fetchingAddressText = t('fetching_address', language);
        if (!query || query.length < 3 || query === fetchingAddressText) {
            setSuggestions([]);
            return;
        }
        debouncedSearch(query);
    }, [query, debouncedSearch, language]);

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
        setServerError(null);
        locateUser(
            language,
            (latlng, address) => {
                onLocationSelect(latlng, address || '');
                setIsLocating(false);
                setIsFocused(false);
            },
            (error) => {
                setServerError(error);
                setIsLocating(false);
            }
        );
    };

    const handleSelectSuggestion = (suggestion: { lat: number; lng: number; address: string }) => {
        onQueryChange(suggestion.address);
        setSuggestions([]);
        setIsFocused(false);
        onLocationSelect({ lat: suggestion.lat, lng: suggestion.lng }, suggestion.address);
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
                        onChange={(e) => onQueryChange(e.target.value)}
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
                            key={`${s.lat}-${index}`}
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
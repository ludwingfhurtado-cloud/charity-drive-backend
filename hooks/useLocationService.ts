import { LatLng, Language } from '../types';
import { t } from '../i18n';

// The API base URL will be an empty string in development (to use the proxy)
// or the production URL when deployed.
// FIX: Made access to import.meta.env robust to prevent runtime errors.
const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || '';

export const useLocationService = () => {

    const reverseGeocode = async (latlng: LatLng, language: Language): Promise<string | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reverse?lat=${latlng.lat}&lng=${latlng.lng}&lang=${language}`);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || 'Reverse geocode failed on server');
            }
            const data = await response.json();
            return data.address;
        } catch (error) {
            console.error("Backend reverse geocode error:", error);
            throw error; // Re-throw to be caught by the caller
        }
    };
    
    // This function can be kept for future use or if direct Places API access is needed,
    // but the main search functionality now uses the backend.
    const getPlaceDetails = async (suggestion: { lat: number, lng: number, address: string }): Promise<{ lat: number; lng: number; address: string }> => {
        // Since our new backend search returns full details, we just need to resolve it.
        return Promise.resolve(suggestion);
    };

    const searchLocations = async (query: string): Promise<any[]> => {
        if (query.trim().length < 3) {
            return [];
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/search-locations?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || 'Location search failed on server');
            }
            return await response.json();
        } catch (error) {
            console.error("Backend search error:", error);
            throw error; // Re-throw to be caught by the caller
        }
    };

    const locateUser = (
        language: Language,
        onSuccess: (latlng: LatLng, address: string | null) => void,
        onError: (error: string) => void,
    ) => {
        if (!navigator.geolocation) {
            onError(t('error_geolocation_not_supported', language));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const latlng = { lat: latitude, lng: longitude };
                try {
                    const address = await reverseGeocode(latlng, language);
                    onSuccess(latlng, address);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : t('error_reverse_geocode_failed', language);
                    onError(errorMessage);
                }
            },
            (err) => {
                let messageKey: string;
                if (err.code === 1) { // PERMISSION_DENIED
                    messageKey = "error_permission_denied";
                } else if (err.code === 3) { // TIMEOUT
                    messageKey = "error_timeout";
                } else {
                    messageKey = "error_unable_to_retrieve_location";
                }
                onError(t(messageKey, language));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    };

    return { reverseGeocode, locateUser, searchLocations, getPlaceDetails };
};
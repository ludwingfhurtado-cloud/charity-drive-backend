import { LatLng, Language } from '../types';
import { t } from '../i18n';

// Fix: Add a global declaration for the 'google' object to resolve TypeScript errors.
declare global {
  var google: any;
}

// A global geocoder instance to avoid creating new ones repeatedly.
// This is safe because the Google Maps script is loaded once in index.html.
// FIX: Replaced specific Google Maps API types with 'any' to resolve namespace errors.
let geocoder: any | null = null;
// FIX: Replaced specific Google Maps API types with 'any' to resolve namespace errors.
const getGeocoder = (): any | null => {
    if (!geocoder && window.google?.maps) {
        geocoder = new window.google.maps.Geocoder();
    }
    return geocoder;
}

export const useLocationService = () => {
  const reverseGeocode = async (latlng: LatLng, language: Language): Promise<string | null> => {
    const geocoder = getGeocoder();
    if (!geocoder) {
      console.error("Google Maps API is not loaded or failed to initialize.");
      return `Lat: ${latlng.lat.toFixed(3)}, Lng: ${latlng.lng.toFixed(3)}`;
    }

    try {
      const response = await geocoder.geocode({ location: latlng, language });
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      } else {
        console.warn("Reverse geocoding found no results for:", latlng);
        return `Lat: ${latlng.lat.toFixed(3)}, Lng: ${latlng.lng.toFixed(3)}`;
      }
    } catch (error: any) {
      if (error.code === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        console.error("Reverse geocoding failed: The application has exceeded the Google Maps API query limit.");
      } else {
        console.error("Reverse geocoding failed", error);
      }
      return `Lat: ${latlng.lat.toFixed(3)}, Lng: ${latlng.lng.toFixed(3)}`;
    }
  };

  const searchLocations = async (query: string, language: Language): Promise<{ lat: number; lng: number; address: string }[]> => {
    if (!query || query.trim().length < 3) {
      return [];
    }
    const geocoder = getGeocoder();
    if (!geocoder) {
      console.error("Google Maps API is not loaded or failed to initialize.");
      return [];
    }

    try {
      const response = await geocoder.geocode({ address: query, language });
      if (response.results && response.results.length > 0) {
        return response.results.map(result => ({
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        }));
      }
      return [];
    } catch (error: any) {
      if (error.code === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        console.error("Geocoding search failed: The application has exceeded the Google Maps API query limit.");
      } else {
        console.error("Geocoding search failed", error);
      }
      return [];
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
        const address = await reverseGeocode(latlng, language);
        onSuccess(latlng, address);
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
  
  return { reverseGeocode, locateUser, searchLocations };
};

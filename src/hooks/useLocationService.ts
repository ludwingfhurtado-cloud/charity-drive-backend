import { useEffect, useState } from "react";

// Define coordinates type
export interface LatLng {
  lat: number;
  lng: number;
}

export const useLocationService = () => {
  const [location, setLocation] = useState<LatLng | null>(null);

  // Automatically locate the user on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("⚠️ Geolocation failed:", err.message);
        }
      );
    }
  }, []);

  // Reverse geocoding helper (Google Maps API)
  const reverseGeocode = async (
    latlng: LatLng,
    language: string
  ): Promise<string | null> => {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ location: latlng, language }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          resolve(results[0].formatted_address);
        } else resolve(null);
      });
    });
  };

  // Optional: search places
  const searchLocations = async (query: string): Promise<google.maps.places.AutocompletePrediction[]> => {
    const service = new google.maps.places.AutocompleteService();
    return new Promise((resolve) => {
      service.getPlacePredictions({ input: query }, (predictions) => {
        resolve(predictions || []);
      });
    });
  };

  // Optional: fetch details of a place
  const getPlaceDetails = async (suggestion: { place_id: string }) => {
    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    return new Promise((resolve) => {
      service.getDetails(
        { placeId: suggestion.place_id },
        (place: any, status: any) => {
          if (status === "OK") resolve(place);
          else resolve(null);
        }
      );
    });
  };

  // ✅ Return both location and helpers
  return {
    location,
    reverseGeocode,
    searchLocations,
    getPlaceDetails,
  };
};

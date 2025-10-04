import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { AppState } from '../types';

// Define a lightweight LatLng type for type-safety.
type LatLng = { lat: number; lng: number };

// ===============================
// Interactive Map Component
// ===============================
interface InteractiveMapProps {
  bottomPanelHeight: number;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ bottomPanelHeight }) => {
  const {
    pickup,
    dropoff,
    driverLocation,
    appState,
    isDriverMode,
    handleLocationSelect,
  } = useAppContext() as any;

  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const dropoffMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(!!window.google);

  // ----------------------------------------------------
  // ✅ Watch for Google Maps API readiness
  // ----------------------------------------------------
  useEffect(() => {
    if (isApiLoaded) return;

    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsApiLoaded(true);
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isApiLoaded]);

  // ----------------------------------------------------
  // 🗺️ Initialize Map Once
  // ----------------------------------------------------
  useEffect(() => {
    if (!isApiLoaded || mapRef.current) return;

    const mapElement = document.getElementById('map') as HTMLElement;
    mapRef.current = new google.maps.Map(mapElement, {
      center: { lat: -17.7833, lng: -63.1821 }, // Santa Cruz – default
      zoom: 13,
      disableDefaultUI: true,
      mapId: '3dbb10e80099880f6f7c3a5b',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
      ],
    });
  }, [isApiLoaded]);

  // ----------------------------------------------------
  // 📍 Handle Pickup & Dropoff Markers
  // ----------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 🔹 Create a styled marker node
    const createMarkerNode = (color: string) => {
      const div = document.createElement('div');
      div.style.width = '16px';
      div.style.height = '16px';
      div.style.borderRadius = '50%';
      div.style.backgroundColor = color;
      div.style.border = '2px solid white';
      div.style.boxShadow = '0 0 8px rgba(0,0,0,0.4)';
      return div;
    };

    // 🟢 Pickup Marker
    if (pickup) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: createMarkerNode('#4ADE80'),
        });
      }
      pickupMarkerRef.current.position = pickup;
    }

    // 🔴 Dropoff Marker
    if (dropoff) {
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: createMarkerNode('#F87171'),
        });
      }
      dropoffMarkerRef.current.position = dropoff;
    }

    // Adjust map bounds when both points exist
    if (pickup && dropoff) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickup);
      bounds.extend(dropoff);
      map.fitBounds(bounds, { top: 50, bottom: bottomPanelHeight + 50, left: 50, right: 50 });
    }
  }, [pickup, dropoff, bottomPanelHeight]);

  // ----------------------------------------------------
  // 🚗 Track Driver in Real Time
  // ----------------------------------------------------
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    mapRef.current.panTo(driverLocation);
  }, [driverLocation]);

  // ----------------------------------------------------
  // 🧹 Cleanup
  // ----------------------------------------------------
  useEffect(() => {
    return () => {
      if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
      if (dropoffMarkerRef.current) dropoffMarkerRef.current.map = null;
    };
  }, []);

  // ----------------------------------------------------
  // 🖼️ Render Map Container
  // ----------------------------------------------------
  return (
    <div
      id="map"
      style={{
        width: '100%',
        height: `calc(100vh - ${bottomPanelHeight}px)`,
      }}
    />
  );
};

export default InteractiveMap;

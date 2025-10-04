import React, { useEffect, useRef, useState } from 'react';
import { LatLng, AppState } from '../types';
import { useAppContext } from '../hooks/useAppContext';

// Fix: Add a global declaration for the 'google' object to resolve TypeScript errors.
declare global {
  var google: any;
}

// --- Google Maps Dark Theme Style ---
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];


// --- SVG & Icon Helpers ---

const DriverMarkerSvg = () => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-10 h-10 drop-shadow-lg">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#10B981"/>
  </svg>
`;

const createMarkerNode = (color: string) => {
    const node = document.createElement('div');
    node.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" class="w-8 h-8 drop-shadow-lg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return node;
};

const createRideNode = () => {
    const node = document.createElement('div');
    node.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" class="w-7 h-7 drop-shadow-lg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return node;
};

interface InteractiveMapProps {
  bottomPanelHeight: number;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ bottomPanelHeight }) => {
  const { 
    rideDetails, 
    selectionMode, 
    handleLocationSelect, 
    appState, 
    handleTripComplete, 
    routeCoordinates: tripRoute,
    setTripProgress,
    isDriverMode,
    availableRides,
    driverLocation,
    driverRouteCoordinates,
    recenterMapTimestamp,
    handleDriverArrived,
    isMapsApiLoaded,
  } = useAppContext();
  
  const { pickup, dropoff } = rideDetails;
  
  const mapRef = useRef<any | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const pickupMarkerRef = useRef<any | null>(null);
  const dropoffMarkerRef = useRef<any | null>(null);
  const mainRouteLayerRef = useRef<any | null>(null);
  const driverRouteLayerRef = useRef<any | null>(null);
  const tripMarkerRef = useRef<any | null>(null);
  const driverMarkerRef = useRef<any | null>(null);
  const availableRidesLayerRef = useRef<any[]>([]);
  
  useEffect(() => {
    if (!isMapsApiLoaded || !mapContainerRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: -17.7833, lng: -63.1812 },
        zoom: 13,
        disableDefaultUI: true,
        styles: mapStyles,
    });
    mapRef.current = map;

    map.addListener('click', (e: any) => {
        if (!selectionMode || !e.latLng) return;
        handleLocationSelect({ lat: e.latLng.lat(), lng: e.latLng.lng() }, null);
    });

  }, [isMapsApiLoaded, selectionMode, handleLocationSelect]);

  useEffect(() => {
    if (recenterMapTimestamp > 0 && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          mapRef.current?.panTo(pos);
          mapRef.current?.setZoom(16);
        },
        () => console.error("Geolocation failed or was denied."),
        { enableHighAccuracy: true }
      );
    }
  }, [recenterMapTimestamp]);

  // Effect for displaying available rides in driver mode
  useEffect(() => {
      if (!mapRef.current) return;

      // Clear previous ride markers
      availableRidesLayerRef.current.forEach(marker => marker.map = null);
      availableRidesLayerRef.current = [];

      if (isDriverMode && appState !== AppState.IN_PROGRESS) {
          availableRides.forEach(ride => {
              if (ride.pickup) {
                  const rideMarker = new google.maps.marker.AdvancedMarkerElement({
                      position: ride.pickup,
                      map: mapRef.current,
                      content: createRideNode(),
                  });
                  availableRidesLayerRef.current.push(rideMarker);
              }
          });
      }
  }, [isDriverMode, availableRides, appState, isMapsApiLoaded]);

  // DISPLAY: Main Trip Route
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (mainRouteLayerRef.current) {
        mainRouteLayerRef.current.setMap(null);
        mainRouteLayerRef.current = null;
    }

    const shouldShowStaticRoute = tripRoute && [AppState.IDLE, AppState.CALCULATING, AppState.AWAITING_DRIVER, AppState.DRIVER_EN_ROUTE, AppState.IN_PROGRESS].includes(appState);

    if (shouldShowStaticRoute) {
        mainRouteLayerRef.current = new google.maps.Polyline({
            path: tripRoute,
            geodesic: true,
            strokeColor: '#FBBF24',
            strokeOpacity: 0.9,
            strokeWeight: 7,
        });
        mainRouteLayerRef.current.setMap(mapRef.current);

        if (![AppState.DRIVER_EN_ROUTE, AppState.IN_PROGRESS].includes(appState)) {
            const bounds = new google.maps.LatLngBounds();
            tripRoute.forEach(point => bounds.extend(point));
            mapRef.current.fitBounds(bounds, { top: 100, bottom: bottomPanelHeight + 50, left: 50, right: 50 });
        }
    }
  }, [tripRoute, appState, bottomPanelHeight, isMapsApiLoaded]);

  // DISPLAY: Driver Approach Route
  useEffect(() => {
    if (!mapRef.current) return;

    if (driverRouteLayerRef.current) {
        driverRouteLayerRef.current.setMap(null);
        driverRouteLayerRef.current = null;
    }
    if (appState === AppState.DRIVER_EN_ROUTE && driverRouteCoordinates) {
        driverRouteLayerRef.current = new google.maps.Polyline({
            path: driverRouteCoordinates,
            geodesic: true,
            strokeColor: '#FBBF24',
            strokeOpacity: 0.9,
            strokeWeight: 7,
        });
        driverRouteLayerRef.current.setMap(mapRef.current);
    }
  }, [appState, driverRouteCoordinates, isMapsApiLoaded]);

   // Effect for driver marker
  useEffect(() => {
      if (!mapRef.current) return;

      if (appState === AppState.DRIVER_EN_ROUTE && driverLocation) {
          if (!driverMarkerRef.current) {
              const driverNode = document.createElement('div');
              driverNode.innerHTML = DriverMarkerSvg();
              driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
                  position: driverLocation,
                  map: mapRef.current,
                  content: driverNode,
                  zIndex: 1000,
              });
          }
      } else {
          if (driverMarkerRef.current) {
              driverMarkerRef.current.map = null;
              driverMarkerRef.current = null;
          }
      }
  }, [appState, driverLocation, isMapsApiLoaded]);
    
  // Driver approach animation effect
  useEffect(() => {
      let animationInterval: number | null = null;
      
      const cleanupAnimation = () => {
          if (animationInterval) {
              clearInterval(animationInterval);
              animationInterval = null;
          }
      };

      if (appState === AppState.DRIVER_EN_ROUTE && driverMarkerRef.current && driverRouteCoordinates && driverRouteCoordinates.length > 1) {
          let index = 0;
          const coordinates = driverRouteCoordinates;
          driverMarkerRef.current.position = coordinates[index];

          animationInterval = window.setInterval(() => {
              index++;
              if (index >= coordinates.length) {
                  cleanupAnimation();
                  handleDriverArrived();
                  return;
              }
              if (driverMarkerRef.current) {
                  driverMarkerRef.current.position = coordinates[index];
              }
          }, 120);
      }
      return cleanupAnimation;
  }, [appState, driverRouteCoordinates, handleDriverArrived]);

  // Effect for managing pickup/dropoff markers and map view
  useEffect(() => {
    if (!mapRef.current || !isMapsApiLoaded) return;
    
    const shouldShowTripMarkers = !isDriverMode || [AppState.IN_PROGRESS, AppState.DRIVER_EN_ROUTE].includes(appState);

    // Pickup Marker
    if (pickup && shouldShowTripMarkers) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current, content: createMarkerNode('#4ADE80') });
      }
      pickupMarkerRef.current.position = pickup;
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.map = null;
      pickupMarkerRef.current = null;
    }
    
    // Dropoff Marker
    if (dropoff && shouldShowTripMarkers) {
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current, content: createMarkerNode('#F87171') });
      }
      dropoffMarkerRef.current.position = dropoff;
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.map = null;
      dropoffMarkerRef.current = null;
    }

    if (appState === AppState.DRIVER_EN_ROUTE && driverLocation && pickup) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(driverLocation);
        bounds.extend(pickup);
        mapRef.current.fitBounds(bounds, { top: 50, bottom: bottomPanelHeight + 50, left: 50, right: 50 });
    } else if (appState !== AppState.IN_PROGRESS && pickup && !dropoff) {
      mapRef.current.panTo(pickup);
      mapRef.current.setZoom(15);
    }
  }, [pickup, dropoff, appState, bottomPanelHeight, isDriverMode, driverLocation, isMapsApiLoaded]);

  // Trip simulation effect
  useEffect(() => {
    let animationInterval: number | null = null;

    const cleanUpTripAnimation = () => {
      if (animationInterval) {
          clearInterval(animationInterval);
          animationInterval = null;
      }
      if (tripMarkerRef.current) {
          tripMarkerRef.current.map = null;
          tripMarkerRef.current = null;
      }
    };

    if (appState !== AppState.IN_PROGRESS || !mapRef.current) {
        cleanUpTripAnimation();
        return;
    }

    if (!tripRoute || tripRoute.length < 2) {
        console.error("CRITICAL: Trip animation cannot start because route is not available.");
        handleTripComplete();
        return;
    }

    const driverNode = document.createElement('div');
    driverNode.innerHTML = DriverMarkerSvg();
    tripMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: tripRoute[0],
        map: mapRef.current,
        content: driverNode,
        zIndex: 1000,
    });
    
    let index = 0;
    
    mapRef.current.setZoom(16);

    animationInterval = window.setInterval(() => {
      index++;
      if (index >= tripRoute.length) {
        setTripProgress(100);
        cleanUpTripAnimation();
        handleTripComplete();
        return;
      }
      
      const nextLatLng = tripRoute[index];
      if (tripMarkerRef.current) {
        tripMarkerRef.current.position = nextLatLng;
      }
      
      if (mapRef.current) {
          // Adjust center to keep marker in view above the bottom panel
          const mapProjection = mapRef.current.getProjection();
          if (mapProjection) {
              const markerPoint = mapProjection.fromLatLngToPoint(new google.maps.LatLng(nextLatLng));
              const scale = Math.pow(2, mapRef.current.getZoom() || 1);
              const offset = new google.maps.Point(0, (-bottomPanelHeight / 2) / scale);
              const newCenterPoint = new google.maps.Point(markerPoint.x - offset.x, markerPoint.y - offset.y);
              mapRef.current.panTo(mapProjection.fromPointToLatLng(newCenterPoint));
          } else {
             mapRef.current.panTo(nextLatLng);
          }
      }

      const progress = (index / tripRoute.length) * 100;
      setTripProgress(progress);

    }, 120);

    return cleanUpTripAnimation;
  }, [appState, handleTripComplete, tripRoute, setTripProgress, isMapsApiLoaded, bottomPanelHeight]);

  const getCursor = () => {
    if (selectionMode) return 'crosshair';
    if (appState === AppState.IN_PROGRESS || appState === AppState.DRIVER_EN_ROUTE) return 'default';
    return 'grab';
  }

  return (
    <div className="absolute inset-0 h-full w-full bg-gray-800 z-0">
      <div 
        ref={mapContainerRef} 
        style={{ cursor: getCursor() }}
        className="h-full w-full"
      />
    </div>
  );
};

export default InteractiveMap;
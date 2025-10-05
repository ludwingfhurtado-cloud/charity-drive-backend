import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { AppState } from "../types";

interface InteractiveMapProps {
  bottomPanelHeight: number;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ bottomPanelHeight }) => {
  const {
    pickup,
    dropoff,
    appState,
    driverLocation,
    isMapsApiLoaded,
    handleLocationSelect,
  } = useAppContext();

  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const dropoffMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [ready, setReady] = useState(false);

  // --------------------------------------------------------
  // 🔲 Helper: Draw highlight box
  // --------------------------------------------------------
  const drawHighlightBox = (
    map: google.maps.Map,
    location: { lat: number; lng: number },
    color: string
  ) => {
    const box = new google.maps.Rectangle({
      strokeColor: color,
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.15,
      map,
      bounds: {
        north: location.lat + 0.0008,
        south: location.lat - 0.0008,
        east: location.lng + 0.0008,
        west: location.lng - 0.0008,
      },
    });
    setTimeout(() => box.setMap(null), 5000);
  };

  // --------------------------------------------------------
  // 🗺️ Initialize Map
  // --------------------------------------------------------
  useEffect(() => {
    if (!isMapsApiLoaded || mapRef.current) return;

    const mapElement = document.getElementById("map") as HTMLElement;
    mapRef.current = new google.maps.Map(mapElement, {
      center: { lat: -17.7833, lng: -63.1821 }, // Santa Cruz
      zoom: 13,
      disableDefaultUI: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
      ],
    });

    setReady(true);
  }, [isMapsApiLoaded]);

  // --------------------------------------------------------
  // 📍 Handle pickup/dropoff markers
  // --------------------------------------------------------
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    // 🔴 Pickup marker
    if (pickup) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: createMarkerNode("#4ADE80"),
        });
      }
      pickupMarkerRef.current.position = pickup;
      drawHighlightBox(map, pickup, "#FF0000");
    }

    // 🟢 Dropoff marker
    if (dropoff) {
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: createMarkerNode("#F87171"),
        });
      }
      dropoffMarkerRef.current.position = dropoff;
      drawHighlightBox(map, dropoff, "#00FF00");
    }

    // 🧭 Auto-propose route
    if (pickup && dropoff && appState === AppState.IDLE) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickup,
          destination: dropoff,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (
          result: google.maps.DirectionsResult,
          status: google.maps.DirectionsStatus
        ) => {
          if (status === "OK" && result?.routes?.length) {
            const path = result.routes[0].overview_path.map((p: any) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));
            handleLocationSelect(null, path);
          }
        }
      );
    }
  }, [pickup, dropoff, appState, ready]);

  // --------------------------------------------------------
  // 🚗 Center map on driver (if available)
  // --------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    mapRef.current.panTo(driverLocation);
  }, [driverLocation]);

  // --------------------------------------------------------
  // 🧹 Cleanup
  // --------------------------------------------------------
  useEffect(() => {
    return () => {
      if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
      if (dropoffMarkerRef.current) dropoffMarkerRef.current.map = null;
    };
  }, []);

  // --------------------------------------------------------
  // 🧩 Marker UI Node
  // --------------------------------------------------------
  const createMarkerNode = (color: string) => {
    const div = document.createElement("div");
    div.style.width = "16px";
    div.style.height = "16px";
    div.style.borderRadius = "50%";
    div.style.backgroundColor = color;
    div.style.border = "2px solid white";
    div.style.boxShadow = "0 0 8px rgba(0,0,0,0.4)";
    return div;
  };

  // --------------------------------------------------------
  // 🖼️ Render
  // --------------------------------------------------------
  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: `calc(100vh - ${bottomPanelHeight}px)`,
      }}
    />
  );
};

export default InteractiveMap;

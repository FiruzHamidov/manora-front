import { useState, useEffect } from "react";

// Event emitter for location changes
type LocationChangeListener = (locationId: string) => void;
const locationChangeListeners: LocationChangeListener[] = [];

export const emitLocationChange = (locationId: string) => {
  locationChangeListeners.forEach((listener) => listener(locationId));
};

export const onLocationChange = (listener: LocationChangeListener) => {
  locationChangeListeners.push(listener);
  // Return cleanup function
  return () => {
    const index = locationChangeListeners.indexOf(listener);
    if (index > -1) {
      locationChangeListeners.splice(index, 1);
    }
  };
};

export const useSelectedLocation = () => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  useEffect(() => {
    const savedLocationId = localStorage.getItem("selectedLocationId");
    if (savedLocationId !== null) {
      setSelectedLocationId(savedLocationId);
    } else {
      localStorage.setItem("selectedLocationId", "");
      setSelectedLocationId("");
    }

    const cleanup = onLocationChange((locationId: string) => {
      setSelectedLocationId(locationId);
    });

    return cleanup;
  }, []);

  const setLocation = (locationId: string | number) => {
    const normalized = String(locationId);
    setSelectedLocationId(normalized);
    localStorage.setItem("selectedLocationId", normalized);
    emitLocationChange(normalized);
  };

  return {
    selectedLocationId,
    setLocation,
  };
};

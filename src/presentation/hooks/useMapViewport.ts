// Presentation Layer: Map viewport state management hook

import { useState, useCallback } from 'react';
import { MapViewport } from '../../domain/value-objects';
import { ServiceContainer } from '../../infrastructure/service-container';

export function useMapViewport() {
  const settingsService = ServiceContainer.getInstance().settingsService;
  const [viewport, setViewport] = useState<MapViewport>(() => 
    settingsService.loadMapViewport()
  );

  const updateViewport = useCallback((lat: number, lng: number, zoom: number) => {
    const newViewport = settingsService.updateMapViewport(lat, lng, zoom);
    setViewport(newViewport);
  }, [settingsService]);

  return {
    viewport,
    updateViewport
  };
}

// Presentation Layer: Map viewport state management hook

import { useState, useCallback, useMemo } from 'react';
import { MapViewport } from '../../domains/settings';
import { SettingsService } from '../../application/settings-service';
import { SettingsRepository } from '../../infrastructure/repositories/settings-repository';

interface ViewportState {
  lat: number;
  lng: number;
  zoom: number;
}

export function useMapViewport() {
  const service = useMemo(() => new SettingsService(new SettingsRepository()), []);
  
  // Load initial viewport from service
  const [viewport, setViewport] = useState<ViewportState>(() => {
    const saved = service.loadViewport();
    return {
      lat: saved.getLat(),
      lng: saved.getLng(),
      zoom: saved.getZoom()
    };
  });

  const updateViewport = useCallback((lat: number, lng: number, zoom: number) => {
    const newViewport = { lat, lng, zoom };
    setViewport(newViewport);
    
    // Save through service with domain validation
    const viewportVO = MapViewport.create(lat, lng, zoom);
    service.updateViewport(viewportVO);
  }, [service]);

  return {
    viewport,
    updateViewport
  };
}

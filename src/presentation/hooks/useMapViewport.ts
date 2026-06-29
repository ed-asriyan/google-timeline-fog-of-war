// Presentation Layer: Map viewport state management hook

import { useState, useCallback, useMemo } from 'react';
import { UISettingsRepository, MapViewport } from '../../infrastructure/repositories/UISettingsRepository';

export function useMapViewport() {
  const repo = useMemo(() => new UISettingsRepository(), []);
  
  // Load initial viewport from repository
  const [viewport, setViewport] = useState<MapViewport>(() => repo.loadViewport());

  const updateViewport = useCallback((lat: number, lng: number, zoom: number) => {
    const newViewport = { lat, lng, zoom };
    setViewport(newViewport);
    repo.saveViewport(newViewport);
  }, [repo]);

  return {
    viewport,
    updateViewport
  };
}
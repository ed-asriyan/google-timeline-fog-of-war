// Presentation Layer: Custom hook for fog settings

import { useState, useCallback, useEffect } from 'react';
import { FogSettings } from '../../domain/value-objects';
import { SettingsService } from '../../application/settings-service';

export function useFogSettings(service: SettingsService) {
  const [settings, setSettings] = useState<FogSettings>(() => service.loadSettings());

  // Responsive panel state
  const [isPanelOpen, setIsPanelOpen] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsPanelOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateRadius = useCallback((radiusKm: number) => {
    const newSettings = service.updateRadius(settings, radiusKm);
    setSettings(newSettings);
  }, [service, settings]);

  const toggleRoads = useCallback(() => {
    const newSettings = service.toggleRoads(settings);
    setSettings(newSettings);
  }, [service, settings]);

  const updateMaxLinkDistance = useCallback((maxLinkDistanceKm: number) => {
    const newSettings = service.updateMaxLinkDistance(settings, maxLinkDistanceKm);
    setSettings(newSettings);
  }, [service, settings]);

  const resetToDefaults = useCallback(() => {
    const newSettings = service.resetToDefaults();
    setSettings(newSettings);
  }, [service]);

  return {
    settings,
    isPanelOpen,
    setIsPanelOpen,
    updateRadius,
    toggleRoads,
    updateMaxLinkDistance,
    resetToDefaults,
  };
}

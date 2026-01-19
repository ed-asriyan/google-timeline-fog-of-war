// Presentation Layer: Custom hook for fog settings

import { useState, useCallback, useEffect } from 'react';
import { FogSettings } from '../../domains/settings';
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
    const newSettings = service.updateRadius(radiusKm);
    setSettings(newSettings);
  }, [service]);

  const toggleConnectPaths = useCallback(() => {
    const newSettings = service.toggleConnectPaths();
    setSettings(newSettings);
  }, [service]);

  const updatePathLength = useCallback((pathLengthKm: number) => {
    const newSettings = service.updatePathLength(pathLengthKm);
    setSettings(newSettings);
  }, [service]);

  const resetToDefaults = useCallback(() => {
    const newSettings = service.resetToDefaults();
    setSettings(newSettings);
  }, [service]);

  return {
    settings,
    isPanelOpen,
    setIsPanelOpen,
    updateRadius,
    toggleConnectPaths,
    updatePathLength,
    resetToDefaults,
  };
}

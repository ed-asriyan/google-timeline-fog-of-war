// Presentation Layer: Custom hook for fog settings

import { useState, useCallback, useEffect, useMemo } from 'react';
import { UISettingsRepository, FogSettings, DEFAULT_FOG_SETTINGS } from '../../infrastructure/repositories/UISettingsRepository';

export function useFogSettings() {
  const repo = useMemo(() => new UISettingsRepository(), []);
  const [settings, setSettings] = useState<FogSettings>(() => repo.loadFogSettings());

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

  const updateSettings = useCallback((newSettings: FogSettings) => {
    setSettings(newSettings);
    repo.saveFogSettings(newSettings);
  }, [repo]);

  const updateRadius = useCallback((radiusKm: number) => {
    updateSettings({ ...settings, radius: radiusKm });
  }, [settings, updateSettings]);

  const toggleConnectPaths = useCallback(() => {
    updateSettings({ ...settings, connectPaths: !settings.connectPaths });
  }, [settings, updateSettings]);

  const updatePathLength = useCallback((pathLengthKm: number) => {
    updateSettings({ ...settings, pathLengthKm });
  }, [settings, updateSettings]);

  const resetToDefaults = useCallback(() => {
    updateSettings(DEFAULT_FOG_SETTINGS);
  }, [updateSettings]);

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

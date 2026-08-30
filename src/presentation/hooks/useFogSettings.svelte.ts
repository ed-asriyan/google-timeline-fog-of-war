// Presentation Layer: Fog settings composable (Svelte)

import {
  UISettingsRepository,
  DEFAULT_FOG_SETTINGS,
  type FogSettings,
} from '../../infrastructure/repositories/UISettingsRepository';

export function createFogSettings() {
  const repo = new UISettingsRepository();
  let settings = $state<FogSettings>(repo.loadFogSettings());

  // Responsive panel state
  let isPanelOpen = $state(window.innerWidth >= 768);

  $effect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        isPanelOpen = false;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  function updateSettings(newSettings: FogSettings) {
    settings = newSettings;
    repo.saveFogSettings(newSettings);
  }

  function updateRadius(radiusKm: number) {
    updateSettings({ ...settings, radius: radiusKm });
  }

  function toggleConnectPaths() {
    updateSettings({ ...settings, connectPaths: !settings.connectPaths });
  }

  function updatePathLength(pathLengthKm: number) {
    updateSettings({ ...settings, pathLengthKm });
  }

  function updatePathVelocity(pathVelocityKmh: number) {
    updateSettings({ ...settings, pathVelocityKmh });
  }

  function resetToDefaults() {
    updateSettings(DEFAULT_FOG_SETTINGS);
  }

  return {
    get settings() {
      return settings;
    },
    get isPanelOpen() {
      return isPanelOpen;
    },
    setIsPanelOpen(value: boolean) {
      isPanelOpen = value;
    },
    updateRadius,
    toggleConnectPaths,
    updatePathLength,
    updatePathVelocity,
    resetToDefaults,
  };
}

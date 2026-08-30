// Presentation Layer: Map viewport state composable (Svelte)

import { UISettingsRepository, type MapViewport } from '../../infrastructure/repositories/UISettingsRepository';

export function createMapViewport() {
  const repo = new UISettingsRepository();

  // Load initial viewport from repository
  let viewport = $state<MapViewport>(repo.loadViewport());

  function updateViewport(lat: number, lng: number, zoom: number) {
    viewport = { lat, lng, zoom };
    repo.saveViewport(viewport);
  }

  return {
    get viewport() {
      return viewport;
    },
    updateViewport,
  };
}

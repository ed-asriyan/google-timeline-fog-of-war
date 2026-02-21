// Application Layer: Settings management use case

import { SettingsRepository } from '@/domains/ports';
import { FogSettings, MapViewport } from '@/domains/settings';
import { createLogger } from '@/utils/log';

const log = createLogger('SettingsApplication');

/**
 * Use case for managing fog settings and viewport
 */
export class SettingsApplication {
  constructor(private repository: SettingsRepository) {}

  // Fog Settings
  loadSettings(): FogSettings {
    const settings = this.repository.loadFogSettings();
    log('Loaded fog settings', settings);
    return settings;
  }

  updateRadius(radiusKm: number): FogSettings {
    log(`Updating fog radius to ${radiusKm} km`);
    const settings = this.repository.loadFogSettings();
    settings.setRadius(radiusKm);
    this.repository.saveFogSettings(settings);
    return settings;
  }

  toggleConnectPaths(): FogSettings {
    const settings = this.repository.loadFogSettings();
    const next = !settings.getConnectPaths();
    log(`Toggling connectPaths to ${next}`);
    settings.setConnectPaths(next);
    this.repository.saveFogSettings(settings);
    return settings;
  }

  updatePathLength(pathLengthKm: number): FogSettings {
    log(`Updating path length to ${pathLengthKm} km`);
    const settings = this.repository.loadFogSettings();
    settings.setPathLengthKm(pathLengthKm);
    this.repository.saveFogSettings(settings);
    return settings;
  }

  saveSettings(settings: FogSettings): void {
    log('Saving fog settings', settings);
    this.repository.saveFogSettings(settings);
  }

  resetToDefaults(): FogSettings {
    log('Resetting fog settings to defaults');
    const defaults = FogSettings.default();
    this.repository.saveFogSettings(defaults);
    return defaults;
  }

  // Viewport Management
  loadViewport(): MapViewport {
    const viewport = this.repository.loadViewport();
    log('Loaded viewport', viewport);
    return viewport;
  }

  updateViewport(viewport: MapViewport): void {
    log('Updating viewport', viewport);
    this.repository.saveViewport(viewport);
  }

  updateViewportPosition(lat: number, lng: number): MapViewport {
    log(`Updating viewport position to (${lat}, ${lng})`);
    const current = this.repository.loadViewport();
    const updated = current.withPosition(lat, lng);
    this.repository.saveViewport(updated);
    return updated;
  }

  updateViewportZoom(zoom: number): MapViewport {
    log(`Updating viewport zoom to ${zoom}`);
    const current = this.repository.loadViewport();
    const updated = current.withZoom(zoom);
    this.repository.saveViewport(updated);
    return updated;
  }

  updateViewportAll(lat: number, lng: number, zoom: number): MapViewport {
    log(`Updating viewport to (${lat}, ${lng}, zoom: ${zoom})`);
    const current = this.repository.loadViewport();
    const updated = current.withAll(lat, lng, zoom);
    this.repository.saveViewport(updated);
    return updated;
  }
}

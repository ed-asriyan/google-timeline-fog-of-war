// Application Layer: Settings management use case

import { FogSettings, MapViewport } from '../domains/settings';
import { SettingsRepository } from '../infrastructure/repositories/settings-repository';

/**
 * Use case for managing fog settings and viewport
 */
export class SettingsService {
  constructor(private repository: SettingsRepository) {}

  // Fog Settings
  loadSettings(): FogSettings {
    return this.repository.loadFogSettings();
  }

  updateRadius(radiusKm: number): FogSettings {
    const settings = this.repository.loadFogSettings();
    settings.setRadius(radiusKm);
    this.repository.saveFogSettings(settings);
    return settings;
  }

  toggleConnectPaths(): FogSettings {
    const settings = this.repository.loadFogSettings();
    settings.setConnectPaths(!settings.getConnectPaths());
    this.repository.saveFogSettings(settings);
    return settings;
  }

  updatePathLength(pathLengthKm: number): FogSettings {
    const settings = this.repository.loadFogSettings();
    settings.setPathLengthKm(pathLengthKm);
    this.repository.saveFogSettings(settings);
    return settings;
  }

  saveSettings(settings: FogSettings): void {
    this.repository.saveFogSettings(settings);
  }

  resetToDefaults(): FogSettings {
    const defaults = FogSettings.default();
    this.repository.saveFogSettings(defaults);
    return defaults;
  }

  // Viewport Management
  loadViewport(): MapViewport {
    return this.repository.loadViewport();
  }

  updateViewport(viewport: MapViewport): void {
    this.repository.saveViewport(viewport);
  }

  updateViewportPosition(lat: number, lng: number): MapViewport {
    const current = this.repository.loadViewport();
    const updated = current.withPosition(lat, lng);
    this.repository.saveViewport(updated);
    return updated;
  }

  updateViewportZoom(zoom: number): MapViewport {
    const current = this.repository.loadViewport();
    const updated = current.withZoom(zoom);
    this.repository.saveViewport(updated);
    return updated;
  }

  updateViewportAll(lat: number, lng: number, zoom: number): MapViewport {
    const current = this.repository.loadViewport();
    const updated = current.withAll(lat, lng, zoom);
    this.repository.saveViewport(updated);
    return updated;
  }
}

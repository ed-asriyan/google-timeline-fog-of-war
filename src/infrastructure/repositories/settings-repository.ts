// Infrastructure Layer: Settings repository

import { FogSettings, MapViewport } from '../../domain/value-objects';

const SETTINGS_KEY_PREFIX = 'fog_settings_';

/**
 * Repository for fog settings using localStorage
 */
export class SettingsRepository {
  private getKey(key: string): string {
    return `${SETTINGS_KEY_PREFIX}${key}`;
  }

  saveFogSettings(settings: FogSettings): void {
    try {
      localStorage.setItem(this.getKey('fog'), JSON.stringify(settings.toJSON()));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadFogSettings(): FogSettings {
    try {
      const saved = localStorage.getItem(this.getKey('fog'));
      if (saved) {
        return FogSettings.fromJSON(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return FogSettings.default();
  }

  saveMapViewport(viewport: MapViewport): void {
    try {
      localStorage.setItem(this.getKey('viewport'), JSON.stringify(viewport.toJSON()));
    } catch (error) {
      console.error('Failed to save viewport:', error);
    }
  }

  loadMapViewport(): MapViewport {
    try {
      const saved = localStorage.getItem(this.getKey('viewport'));
      if (saved) {
        return MapViewport.fromJSON(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load viewport:', error);
    }
    return MapViewport.default();
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(SETTINGS_KEY_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }
}

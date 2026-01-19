// Infrastructure Layer: Settings repository

import { FogSettings, MapViewport } from '../../domains/settings';

const SETTINGS_KEY_PREFIX = 'fog_settings_';

/**
 * Repository for fog settings and viewport using localStorage
 */
export class SettingsRepository {
  private getKey(key: string): string {
    return `${SETTINGS_KEY_PREFIX}${key}`;
  }

  saveFogSettings(settings: FogSettings): void {
    try {
      localStorage.setItem(this.getKey('fog'), JSON.stringify(settings.toJson()));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadFogSettings(): FogSettings {
    try {
      const saved = localStorage.getItem(this.getKey('fog'));
      if (saved) {
        return FogSettings.fromJson(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return FogSettings.default();
  }

  saveViewport(viewport: MapViewport): void {
    try {
      localStorage.setItem(this.getKey('viewport'), JSON.stringify(viewport.toJson()));
    } catch (error) {
      console.error('Failed to save viewport:', error);
    }
  }

  loadViewport(): MapViewport {
    try {
      const saved = localStorage.getItem(this.getKey('viewport'));
      if (saved) {
        return MapViewport.fromJson(JSON.parse(saved));
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

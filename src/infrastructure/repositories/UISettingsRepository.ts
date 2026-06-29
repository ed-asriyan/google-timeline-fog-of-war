const SETTINGS_KEY_PREFIX = 'fog_settings_';

export interface FogSettings {
  radius: number;
  connectPaths: boolean;
  pathLengthKm: number;
}

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

export const DEFAULT_FOG_SETTINGS: FogSettings = {
  radius: 0.2,
  connectPaths: false,
  pathLengthKm: 3
};

export const DEFAULT_VIEWPORT: MapViewport = {
  lat: 0,
  lng: 0,
  zoom: 2
};

export class UISettingsRepository {
  private getKey(key: string): string {
    return `${SETTINGS_KEY_PREFIX}${key}`;
  }

  saveFogSettings(settings: FogSettings): void {
    try {
      localStorage.setItem(this.getKey('fog'), JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  loadFogSettings(): FogSettings {
    try {
      const saved = localStorage.getItem(this.getKey('fog'));
      if (saved) {
        return { ...DEFAULT_FOG_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_FOG_SETTINGS };
  }

  saveViewport(viewport: MapViewport): void {
    try {
      localStorage.setItem(this.getKey('viewport'), JSON.stringify(viewport));
    } catch (error) {
      console.error('Failed to save viewport:', error);
    }
  }

  loadViewport(): MapViewport {
    try {
      const saved = localStorage.getItem(this.getKey('viewport'));
      if (saved) {
        return { ...DEFAULT_VIEWPORT, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load viewport:', error);
    }
    return { ...DEFAULT_VIEWPORT };
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

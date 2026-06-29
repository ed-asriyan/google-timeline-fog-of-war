import { SettingsRepository } from '@/domains/map/ports';
import { Settings } from '@/domains/map/ports';

const SETTINGS_KEY = 'fog_settings_fog';
const DEFAULT_PATH_LENGTH_KM = 3;

export class MapSettingsRepository implements SettingsRepository {
  async saveSettings(settings: Settings): Promise<void> {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.pathLengthKm = settings.maxPathDistanceKm;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to save map settings:', error);
    }
  }

  async loadSettings(): Promise<Settings> {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.pathLengthKm === 'number') {
          return { maxPathDistanceKm: parsed.pathLengthKm };
        }
      }
    } catch (error) {
      console.error('Failed to load map settings:', error);
    }
    return { maxPathDistanceKm: DEFAULT_PATH_LENGTH_KM };
  }
}

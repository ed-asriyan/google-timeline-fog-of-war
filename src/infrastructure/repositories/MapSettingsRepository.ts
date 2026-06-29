import { SettingsRepository } from '@/domains/map/ports';
import { Settings } from '@/domains/map/ports';

const SETTINGS_KEY = 'fog_settings_fog';
const DEFAULT_PATH_LENGTH_KM = 3;
const DEFAULT_PATH_VELOCITY_KMH = 1000;

export class MapSettingsRepository implements SettingsRepository {
  async saveSettings(settings: Settings): Promise<void> {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.pathLengthKm = settings.maxPathDistanceKm;
      parsed.pathVelocityKmh = settings.maxPathVelocityKmh;
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
        return { 
          maxPathDistanceKm: typeof parsed.pathLengthKm === 'number' ? parsed.pathLengthKm : DEFAULT_PATH_LENGTH_KM,
          maxPathVelocityKmh: typeof parsed.pathVelocityKmh === 'number' ? parsed.pathVelocityKmh : DEFAULT_PATH_VELOCITY_KMH
        };
      }
    } catch (error) {
      console.error('Failed to load map settings:', error);
    }
    return { 
      maxPathDistanceKm: DEFAULT_PATH_LENGTH_KM,
      maxPathVelocityKmh: DEFAULT_PATH_VELOCITY_KMH
    };
  }
}

// Application Layer: Settings management use case

import { FogSettings } from '../domain/value-objects';
import { SettingsRepository } from '../infrastructure/repositories/settings-repository';

/**
 * Use case for managing fog settings
 */
export class SettingsService {
  constructor(private repository: SettingsRepository) {}

  loadSettings(): FogSettings {
    return this.repository.loadFogSettings();
  }

  updateRadius(currentSettings: FogSettings, radiusKm: number): FogSettings {
    const newSettings = currentSettings.withRadius(radiusKm);
    this.repository.saveFogSettings(newSettings);
    return newSettings;
  }

  toggleRoads(currentSettings: FogSettings): FogSettings {
    const newSettings = currentSettings.withShowRoads(!currentSettings.showRoads);
    this.repository.saveFogSettings(newSettings);
    return newSettings;
  }

  updateMaxLinkDistance(currentSettings: FogSettings, maxLinkDistanceKm: number): FogSettings {
    const newSettings = currentSettings.withMaxLinkDistance(maxLinkDistanceKm);
    this.repository.saveFogSettings(newSettings);
    return newSettings;
  }

  resetToDefaults(): FogSettings {
    const defaults = FogSettings.default();
    this.repository.saveFogSettings(defaults);
    return defaults;
  }
}

// Infrastructure Layer: Dependency injection container

import { TimelineFileRepository } from './repositories/timeline-file-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { TimelineFileService } from '../application/timeline-file-service';
import { SettingsService } from '../application/settings-service';

/**
 * Service container for dependency injection
 * Implements Singleton pattern for service instances
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  private _timelineFileRepository?: TimelineFileRepository;
  private _settingsRepository?: SettingsRepository;
  private _timelineFileService?: TimelineFileService;
  private _settingsService?: SettingsService;

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  get timelineFileRepository(): TimelineFileRepository {
    if (!this._timelineFileRepository) {
      this._timelineFileRepository = new TimelineFileRepository();
    }
    return this._timelineFileRepository;
  }

  get settingsRepository(): SettingsRepository {
    if (!this._settingsRepository) {
      this._settingsRepository = new SettingsRepository();
    }
    return this._settingsRepository;
  }

  get timelineFileService(): TimelineFileService {
    if (!this._timelineFileService) {
      this._timelineFileService = new TimelineFileService(this.timelineFileRepository);
    }
    return this._timelineFileService;
  }

  get settingsService(): SettingsService {
    if (!this._settingsService) {
      this._settingsService = new SettingsService(this.settingsRepository);
    }
    return this._settingsService;
  }

  /**
   * Reset all services (useful for testing)
   */
  reset(): void {
    this._timelineFileRepository = undefined;
    this._settingsRepository = undefined;
    this._timelineFileService = undefined;
    this._settingsService = undefined;
  }
}

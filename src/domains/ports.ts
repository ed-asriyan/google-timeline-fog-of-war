import { MapSegment } from './map/MapSegment';
import { FogSettings, MapViewport } from './settings';

export interface MapSegmentRepository {
    saveSegment(segment: MapSegment): Promise<void>;
    loadSegment(id: number): Promise<MapSegment>;
    clear(): Promise<void>;
    hasData(): Promise<boolean>;
}

export interface SettingsRepository {
    saveFogSettings(settings: FogSettings): void;
    loadFogSettings(): FogSettings;

    saveViewport(viewport: MapViewport): void;
    loadViewport(): MapViewport;

    clear(): void;
}
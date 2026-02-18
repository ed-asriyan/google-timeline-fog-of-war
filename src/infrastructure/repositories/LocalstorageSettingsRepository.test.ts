import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageSettingsRepository } from './LocalStorageSettingsRepository';
import { FogSettings, DEFAULT_FOG_RADIUS_KM, DEFAULT_FOG_PATH_KM, DEFAULT_FOG_PATH_CONNECT } from '@/domains/settings/FogSettings';
import { MapViewport } from '@/domains/settings/MapViewport';

beforeEach(() => {
    localStorage.clear();
});

// ---------------------------------------------------------------------------
// FogSettings
// ---------------------------------------------------------------------------

describe('saveFogSettings / loadFogSettings', () => {
    it('returns defaults when nothing has been saved', () => {
        const repo = new LocalStorageSettingsRepository();
        const settings = repo.loadFogSettings();

        expect(settings.getRadius()).toBe(DEFAULT_FOG_RADIUS_KM);
        expect(settings.getConnectPaths()).toBe(DEFAULT_FOG_PATH_CONNECT);
        expect(settings.getPathLengthKm()).toBe(DEFAULT_FOG_PATH_KM);
    });

    it('round-trips fog settings', () => {
        const repo = new LocalStorageSettingsRepository();
        const settings = new FogSettings(0.5, true, 10);

        repo.saveFogSettings(settings);
        const loaded = repo.loadFogSettings();

        expect(loaded.getRadius()).toBe(0.5);
        expect(loaded.getConnectPaths()).toBe(true);
        expect(loaded.getPathLengthKm()).toBe(10);
    });

    it('overwrites previously saved fog settings', () => {
        const repo = new LocalStorageSettingsRepository();
        repo.saveFogSettings(new FogSettings(0.1, false, 1));
        repo.saveFogSettings(new FogSettings(0.9, true, 50));

        const loaded = repo.loadFogSettings();

        expect(loaded.getRadius()).toBe(0.9);
        expect(loaded.getConnectPaths()).toBe(true);
        expect(loaded.getPathLengthKm()).toBe(50);
    });

    it('persists fog settings values exactly (no rounding)', () => {
        const repo = new LocalStorageSettingsRepository();
        repo.saveFogSettings(new FogSettings(0.123, false, 7.89));

        const loaded = repo.loadFogSettings();

        expect(loaded.getRadius()).toBe(0.123);
        expect(loaded.getPathLengthKm()).toBe(7.89);
    });
});

// ---------------------------------------------------------------------------
// MapViewport
// ---------------------------------------------------------------------------

describe('saveViewport / loadViewport', () => {
    it('returns defaults when nothing has been saved', () => {
        const repo = new LocalStorageSettingsRepository();
        const viewport = repo.loadViewport();

        const def = MapViewport.default();
        expect(viewport.getLat()).toBe(def.getLat());
        expect(viewport.getLng()).toBe(def.getLng());
        expect(viewport.getZoom()).toBe(def.getZoom());
    });

    it('round-trips viewport', () => {
        const repo = new LocalStorageSettingsRepository();
        const viewport = MapViewport.create(48.8566, 2.3522, 12);

        repo.saveViewport(viewport);
        const loaded = repo.loadViewport();

        expect(loaded.getLat()).toBe(48.8566);
        expect(loaded.getLng()).toBe(2.3522);
        expect(loaded.getZoom()).toBe(12);
    });

    it('overwrites previously saved viewport', () => {
        const repo = new LocalStorageSettingsRepository();
        repo.saveViewport(MapViewport.create(10, 20, 5));
        repo.saveViewport(MapViewport.create(51.5074, -0.1278, 14));

        const loaded = repo.loadViewport();

        expect(loaded.getLat()).toBe(51.5074);
        expect(loaded.getLng()).toBe(-0.1278);
        expect(loaded.getZoom()).toBe(14);
    });

    it('persists negative coordinates correctly', () => {
        const repo = new LocalStorageSettingsRepository();
        repo.saveViewport(MapViewport.create(-33.8688, -70.6693, 9));

        const loaded = repo.loadViewport();

        expect(loaded.getLat()).toBe(-33.8688);
        expect(loaded.getLng()).toBe(-70.6693);
    });
});

// ---------------------------------------------------------------------------
// Isolation between instances
// ---------------------------------------------------------------------------

describe('isolation', () => {
    it('two instances share the same underlying localStorage', () => {
        const repo1 = new LocalStorageSettingsRepository();
        const repo2 = new LocalStorageSettingsRepository();

        repo1.saveFogSettings(new FogSettings(0.7, true, 20));
        const loaded = repo2.loadFogSettings();

        expect(loaded.getRadius()).toBe(0.7);
    });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('clear', () => {
    it('resets fog settings to defaults after clearing', () => {
        const repo = new LocalStorageSettingsRepository();
        repo.saveFogSettings(new FogSettings(0.8, true, 15));

        repo.clear();
        const loaded = repo.loadFogSettings();

        expect(loaded.getRadius()).toBe(DEFAULT_FOG_RADIUS_KM);
        expect(loaded.getConnectPaths()).toBe(DEFAULT_FOG_PATH_CONNECT);
        expect(loaded.getPathLengthKm()).toBe(DEFAULT_FOG_PATH_KM);
    });

    it('resets viewport to defaults after clearing', () => {
        const repo = new LocalStorageSettingsRepository();
        repo.saveViewport(MapViewport.create(48.8566, 2.3522, 12));

        repo.clear();
        const loaded = repo.loadViewport();

        const def = MapViewport.default();
        expect(loaded.getLat()).toBe(def.getLat());
        expect(loaded.getLng()).toBe(def.getLng());
        expect(loaded.getZoom()).toBe(def.getZoom());
    });

    it('only removes keys belonging to this repository, leaving others intact', () => {
        const repo = new LocalStorageSettingsRepository();
        localStorage.setItem('unrelated_key', 'keep_me');
        repo.saveFogSettings(new FogSettings(0.3, false, 5));

        repo.clear();

        expect(localStorage.getItem('unrelated_key')).toBe('keep_me');
    });

    it('is a no-op when nothing has been saved', () => {
        const repo = new LocalStorageSettingsRepository();
        expect(() => repo.clear()).not.toThrow();
    });
});

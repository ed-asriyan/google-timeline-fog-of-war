/**
 * Tests for Settings Domain Value Objects
 */

import { describe, it, expect } from 'vitest';
import { FogSettings, DEFAULT_FOG_RADIUS_KM, DEFAULT_FOG_PATH_KM, DEFAULT_FOG_PATH_CONNECT, MIN_FOG_RADIUS_KM, MAX_FOG_RADIUS_KM, MIN_FOG_PATH_KM, MAX_FOG_PATH_KM } from './FogSettings';

describe('FogSettings', () => {
  describe('constructor', () => {
    it('should create settings with provided values', () => {
      const settings = new FogSettings(0.5, true, 5);
      
      expect(settings.getRadius()).toBe(0.5);
      expect(settings.getConnectPaths()).toBe(true);
      expect(settings.getPathLengthKm()).toBe(5);
    });

    it('should handle minimum values', () => {
      const settings = new FogSettings(MIN_FOG_RADIUS_KM, false, MIN_FOG_PATH_KM);
      
      expect(settings.getRadius()).toBe(MIN_FOG_RADIUS_KM);
      expect(settings.getConnectPaths()).toBe(false);
      expect(settings.getPathLengthKm()).toBe(MIN_FOG_PATH_KM);
    });

    it('should handle maximum values', () => {
      const settings = new FogSettings(MAX_FOG_RADIUS_KM, true, MAX_FOG_PATH_KM);
      
      expect(settings.getRadius()).toBe(MAX_FOG_RADIUS_KM);
      expect(settings.getConnectPaths()).toBe(true);
      expect(settings.getPathLengthKm()).toBe(MAX_FOG_PATH_KM);
    });

    it('should handle decimal values', () => {
      const settings = new FogSettings(0.123, true, 4.567);
      
      expect(settings.getRadius()).toBe(0.123);
      expect(settings.getPathLengthKm()).toBe(4.567);
    });
  });

  describe('default', () => {
    it('should create default settings', () => {
      const settings = FogSettings.default();
      
      expect(settings).toBeInstanceOf(FogSettings);
      expect(settings.getRadius()).toBe(DEFAULT_FOG_RADIUS_KM);
      expect(settings.getConnectPaths()).toBe(DEFAULT_FOG_PATH_CONNECT);
      expect(settings.getPathLengthKm()).toBe(DEFAULT_FOG_PATH_KM);
    });

    it('should return consistent defaults', () => {
      const settings1 = FogSettings.default();
      const settings2 = FogSettings.default();
      
      expect(settings1.getRadius()).toBe(settings2.getRadius());
      expect(settings1.getConnectPaths()).toBe(settings2.getConnectPaths());
      expect(settings1.getPathLengthKm()).toBe(settings2.getPathLengthKm());
    });

    it('should create new instances each time', () => {
      const settings1 = FogSettings.default();
      const settings2 = FogSettings.default();
      
      expect(settings1).not.toBe(settings2);
    });
  });

  describe('getRadius', () => {
    it('should return current radius', () => {
      const settings = new FogSettings(0.7, false, 10);
      expect(settings.getRadius()).toBe(0.7);
    });

    it('should return updated radius after setRadius', () => {
      const settings = FogSettings.default();
      settings.setRadius(0.5);
      expect(settings.getRadius()).toBe(0.5);
    });
  });

  describe('setRadius', () => {
    it('should update radius', () => {
      const settings = FogSettings.default();
      settings.setRadius(0.8);
      
      expect(settings.getRadius()).toBe(0.8);
    });

    it('should accept minimum radius', () => {
      const settings = FogSettings.default();
      settings.setRadius(MIN_FOG_RADIUS_KM);
      
      expect(settings.getRadius()).toBe(MIN_FOG_RADIUS_KM);
    });

    it('should accept maximum radius', () => {
      const settings = FogSettings.default();
      settings.setRadius(MAX_FOG_RADIUS_KM);
      
      expect(settings.getRadius()).toBe(MAX_FOG_RADIUS_KM);
    });

    it('should accept decimal values', () => {
      const settings = FogSettings.default();
      settings.setRadius(0.456);
      
      expect(settings.getRadius()).toBe(0.456);
    });

    it('should mutate the same instance', () => {
      const settings = FogSettings.default();
      const result = settings.setRadius(0.9);
      
      expect(result).toBeUndefined();
      expect(settings.getRadius()).toBe(0.9);
    });
  });

  describe('getConnectPaths', () => {
    it('should return current connectPaths setting', () => {
      const settings = new FogSettings(0.5, true, 5);
      expect(settings.getConnectPaths()).toBe(true);
    });

    it('should return false when set to false', () => {
      const settings = new FogSettings(0.5, false, 5);
      expect(settings.getConnectPaths()).toBe(false);
    });

    it('should return updated value after setConnectPaths', () => {
      const settings = FogSettings.default();
      settings.setConnectPaths(true);
      expect(settings.getConnectPaths()).toBe(true);
    });
  });

  describe('setConnectPaths', () => {
    it('should update connectPaths to true', () => {
      const settings = FogSettings.default();
      settings.setConnectPaths(true);
      
      expect(settings.getConnectPaths()).toBe(true);
    });

    it('should update connectPaths to false', () => {
      const settings = new FogSettings(0.5, true, 5);
      settings.setConnectPaths(false);
      
      expect(settings.getConnectPaths()).toBe(false);
    });

    it('should toggle value', () => {
      const settings = FogSettings.default();
      const original = settings.getConnectPaths();
      
      settings.setConnectPaths(!original);
      expect(settings.getConnectPaths()).toBe(!original);
      
      settings.setConnectPaths(original);
      expect(settings.getConnectPaths()).toBe(original);
    });

    it('should mutate the same instance', () => {
      const settings = FogSettings.default();
      const result = settings.setConnectPaths(true);
      
      expect(result).toBeUndefined();
      expect(settings.getConnectPaths()).toBe(true);
    });
  });

  describe('getPathLengthKm', () => {
    it('should return current path length', () => {
      const settings = new FogSettings(0.5, false, 15);
      expect(settings.getPathLengthKm()).toBe(15);
    });

    it('should return updated value after setPathLengthKm', () => {
      const settings = FogSettings.default();
      settings.setPathLengthKm(20);
      expect(settings.getPathLengthKm()).toBe(20);
    });
  });

  describe('setPathLengthKm', () => {
    it('should update path length', () => {
      const settings = FogSettings.default();
      settings.setPathLengthKm(12);
      
      expect(settings.getPathLengthKm()).toBe(12);
    });

    it('should accept minimum path length', () => {
      const settings = FogSettings.default();
      settings.setPathLengthKm(MIN_FOG_PATH_KM);
      
      expect(settings.getPathLengthKm()).toBe(MIN_FOG_PATH_KM);
    });

    it('should accept maximum path length', () => {
      const settings = FogSettings.default();
      settings.setPathLengthKm(MAX_FOG_PATH_KM);
      
      expect(settings.getPathLengthKm()).toBe(MAX_FOG_PATH_KM);
    });

    it('should accept decimal values', () => {
      const settings = FogSettings.default();
      settings.setPathLengthKm(7.89);
      
      expect(settings.getPathLengthKm()).toBe(7.89);
    });

    it('should mutate the same instance', () => {
      const settings = FogSettings.default();
      const result = settings.setPathLengthKm(25);
      
      expect(result).toBeUndefined();
      expect(settings.getPathLengthKm()).toBe(25);
    });
  });

  describe('mutable behavior', () => {
    it('should allow multiple mutations on same instance', () => {
      const settings = FogSettings.default();
      
      settings.setRadius(0.6);
      settings.setConnectPaths(true);
      settings.setPathLengthKm(15);
      
      expect(settings.getRadius()).toBe(0.6);
      expect(settings.getConnectPaths()).toBe(true);
      expect(settings.getPathLengthKm()).toBe(15);
    });

    it('should preserve other properties when setting radius', () => {
      const settings = new FogSettings(0.5, true, 10);
      settings.setRadius(0.7);
      
      expect(settings.getRadius()).toBe(0.7);
      expect(settings.getConnectPaths()).toBe(true);
      expect(settings.getPathLengthKm()).toBe(10);
    });

    it('should preserve other properties when setting connectPaths', () => {
      const settings = new FogSettings(0.5, true, 10);
      settings.setConnectPaths(false);
      
      expect(settings.getRadius()).toBe(0.5);
      expect(settings.getConnectPaths()).toBe(false);
      expect(settings.getPathLengthKm()).toBe(10);
    });

    it('should preserve other properties when setting pathLengthKm', () => {
      const settings = new FogSettings(0.5, true, 10);
      settings.setPathLengthKm(20);
      
      expect(settings.getRadius()).toBe(0.5);
      expect(settings.getConnectPaths()).toBe(true);
      expect(settings.getPathLengthKm()).toBe(20);
    });
  });

  describe('constants', () => {
    it('should have valid minimum fog radius', () => {
      expect(MIN_FOG_RADIUS_KM).toBeGreaterThan(0);
      expect(MIN_FOG_RADIUS_KM).toBeLessThan(MAX_FOG_RADIUS_KM);
    });

    it('should have valid maximum fog radius', () => {
      expect(MAX_FOG_RADIUS_KM).toBeGreaterThan(MIN_FOG_RADIUS_KM);
    });

    it('should have valid minimum path length', () => {
      expect(MIN_FOG_PATH_KM).toBeGreaterThan(0);
      expect(MIN_FOG_PATH_KM).toBeLessThan(MAX_FOG_PATH_KM);
    });

    it('should have valid maximum path length', () => {
      expect(MAX_FOG_PATH_KM).toBeGreaterThan(MIN_FOG_PATH_KM);
    });

    it('should have default radius within bounds', () => {
      expect(DEFAULT_FOG_RADIUS_KM).toBeGreaterThanOrEqual(MIN_FOG_RADIUS_KM);
      expect(DEFAULT_FOG_RADIUS_KM).toBeLessThanOrEqual(MAX_FOG_RADIUS_KM);
    });

    it('should have default path length within bounds', () => {
      expect(DEFAULT_FOG_PATH_KM).toBeGreaterThanOrEqual(MIN_FOG_PATH_KM);
      expect(DEFAULT_FOG_PATH_KM).toBeLessThanOrEqual(MAX_FOG_PATH_KM);
    });

    it('should have boolean default for connectPaths', () => {
      expect(typeof DEFAULT_FOG_PATH_CONNECT).toBe('boolean');
    });
  });

  describe('toJson', () => {
    it('should serialize to JSON object', () => {
      const settings = new FogSettings(0.5, true, 10);
      const json = settings.toJson();
      
      expect(json).toEqual({
        radius: 0.5,
        connectPaths: true,
        pathLengthKm: 10
      });
    });

    it('should serialize default settings', () => {
      const settings = FogSettings.default();
      const json = settings.toJson();
      
      expect(json).toEqual({
        radius: DEFAULT_FOG_RADIUS_KM,
        connectPaths: DEFAULT_FOG_PATH_CONNECT,
        pathLengthKm: DEFAULT_FOG_PATH_KM
      });
    });

    it('should serialize with decimal values', () => {
      const settings = new FogSettings(0.123, false, 4.567);
      const json = settings.toJson();
      
      expect(json).toEqual({
        radius: 0.123,
        connectPaths: false,
        pathLengthKm: 4.567
      });
    });

    it('should create new object on each call', () => {
      const settings = new FogSettings(0.5, true, 10);
      const json1 = settings.toJson();
      const json2 = settings.toJson();
      
      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2);
    });
  });

  describe('fromJson', () => {
    it('should deserialize from JSON object', () => {
      const json = {
        radius: 0.5,
        connectPaths: true,
        pathLengthKm: 10
      };
      const settings = FogSettings.fromJson(json);
      
      expect(settings).toBeInstanceOf(FogSettings);
      expect(settings.getRadius()).toBe(0.5);
      expect(settings.getConnectPaths()).toBe(true);
      expect(settings.getPathLengthKm()).toBe(10);
    });

    it('should deserialize with decimal values', () => {
      const json = {
        radius: 0.123,
        connectPaths: false,
        pathLengthKm: 4.567
      };
      const settings = FogSettings.fromJson(json);
      
      expect(settings.getRadius()).toBe(0.123);
      expect(settings.getConnectPaths()).toBe(false);
      expect(settings.getPathLengthKm()).toBe(4.567);
    });

    it('should handle minimum values', () => {
      const json = {
        radius: MIN_FOG_RADIUS_KM,
        connectPaths: false,
        pathLengthKm: MIN_FOG_PATH_KM
      };
      const settings = FogSettings.fromJson(json);
      
      expect(settings.getRadius()).toBe(MIN_FOG_RADIUS_KM);
      expect(settings.getPathLengthKm()).toBe(MIN_FOG_PATH_KM);
    });

    it('should handle maximum values', () => {
      const json = {
        radius: MAX_FOG_RADIUS_KM,
        connectPaths: true,
        pathLengthKm: MAX_FOG_PATH_KM
      };
      const settings = FogSettings.fromJson(json);
      
      expect(settings.getRadius()).toBe(MAX_FOG_RADIUS_KM);
      expect(settings.getPathLengthKm()).toBe(MAX_FOG_PATH_KM);
    });

    it('should create new instance', () => {
      const json = { radius: 0.5, connectPaths: true, pathLengthKm: 10 };
      const settings1 = FogSettings.fromJson(json);
      const settings2 = FogSettings.fromJson(json);
      
      expect(settings1).not.toBe(settings2);
    });
  });

  describe('serialization round-trip', () => {
    it('should preserve values through toJson and fromJson', () => {
      const original = new FogSettings(0.7, true, 15);
      const json = original.toJson();
      const restored = FogSettings.fromJson(json);
      
      expect(restored.getRadius()).toBe(original.getRadius());
      expect(restored.getConnectPaths()).toBe(original.getConnectPaths());
      expect(restored.getPathLengthKm()).toBe(original.getPathLengthKm());
    });

    it('should preserve default settings', () => {
      const original = FogSettings.default();
      const restored = FogSettings.fromJson(original.toJson());
      
      expect(restored.getRadius()).toBe(DEFAULT_FOG_RADIUS_KM);
      expect(restored.getConnectPaths()).toBe(DEFAULT_FOG_PATH_CONNECT);
      expect(restored.getPathLengthKm()).toBe(DEFAULT_FOG_PATH_KM);
    });

    it('should preserve decimal precision', () => {
      const original = new FogSettings(0.123456, false, 7.891011);
      const restored = FogSettings.fromJson(original.toJson());
      
      expect(restored.getRadius()).toBe(0.123456);
      expect(restored.getPathLengthKm()).toBe(7.891011);
    });

    it('should preserve all boundary values', () => {
      const original = new FogSettings(MIN_FOG_RADIUS_KM, true, MAX_FOG_PATH_KM);
      const restored = FogSettings.fromJson(original.toJson());
      
      expect(restored.getRadius()).toBe(MIN_FOG_RADIUS_KM);
      expect(restored.getConnectPaths()).toBe(true);
      expect(restored.getPathLengthKm()).toBe(MAX_FOG_PATH_KM);
    });
  });
});

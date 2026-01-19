/**
 * Tests for Map Domain Value Objects
 */

import { describe, it, expect } from 'vitest';
import { LocationPoint, MapBounds, Statistics } from './value-objects';
import { MAX_LATITUDE, MIN_LATITUDE, MAX_LONGITUDE, MIN_LONGITUDE } from './consts';

describe('LocationPoint', () => {
  describe('constructor', () => {
    it('should create a valid point with valid coordinates', () => {
      const point = new LocationPoint(47.6062, -122.3321);
      expect(point.lat).toBe(47.6062);
      expect(point.lon).toBe(-122.3321);
    });

    it('should accept boundary values', () => {
      const minPoint = new LocationPoint(MIN_LATITUDE, MIN_LONGITUDE);
      expect(minPoint.lat).toBe(MIN_LATITUDE);
      expect(minPoint.lon).toBe(MIN_LONGITUDE);

      const maxPoint = new LocationPoint(MAX_LATITUDE, MAX_LONGITUDE);
      expect(maxPoint.lat).toBe(MAX_LATITUDE);
      expect(maxPoint.lon).toBe(MAX_LONGITUDE);
    });

    it('should throw error when latitude is below minimum', () => {
      expect(() => new LocationPoint(MIN_LATITUDE - 1, 0)).toThrow(`Latitude ${MIN_LATITUDE - 1} out of bounds`);
    });

    it('should throw error when latitude is above maximum', () => {
      expect(() => new LocationPoint(MAX_LATITUDE + 1, 0)).toThrow(`Latitude ${MAX_LATITUDE + 1} out of bounds`);
    });

    it('should throw error when longitude is below minimum', () => {
      expect(() => new LocationPoint(0, MIN_LONGITUDE - 1)).toThrow(`Longitude ${MIN_LONGITUDE - 1} out of bounds`);
    });

    it('should throw error when longitude is above maximum', () => {
      expect(() => new LocationPoint(0, MAX_LONGITUDE + 1)).toThrow(`Longitude ${MAX_LONGITUDE + 1} out of bounds`);
    });

    it('should handle zero coordinates', () => {
      const point = new LocationPoint(0, 0);
      expect(point.lat).toBe(0);
      expect(point.lon).toBe(0);
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance between two points', () => {
      const seattle = new LocationPoint(47.6062, -122.3321);
      const portland = new LocationPoint(45.5152, -122.6784);
      
      const distance = seattle.distanceTo(portland);
      
      // Seattle to Portland is approximately 233 km
      expect(distance).toBeGreaterThan(230);
      expect(distance).toBeLessThan(240);
    });

    it('should return zero for same point', () => {
      const point = new LocationPoint(47.6062, -122.3321);
      expect(point.distanceTo(point)).toBe(0);
    });

    it('should return zero for points with same coordinates', () => {
      const point1 = new LocationPoint(47.6062, -122.3321);
      const point2 = new LocationPoint(47.6062, -122.3321);
      expect(point1.distanceTo(point2)).toBe(0);
    });

    it('should calculate distance across the equator', () => {
      const northPole = new LocationPoint(90, 0);
      const southPole = new LocationPoint(-90, 0);
      
      const distance = northPole.distanceTo(southPole);
      
      // Half Earth's circumference ≈ 20,000 km
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(21000);
    });

    it('should handle distance across international date line', () => {
      const pointWest = new LocationPoint(0, 179);
      const pointEast = new LocationPoint(0, -179);
      
      const distance = pointWest.distanceTo(pointEast);
      
      // Should be small distance, not halfway around the world
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(300);
    });
  });
});

describe('MapBounds', () => {
  describe('constructor', () => {
    it('should create bounds with two points', () => {
      const a = new LocationPoint(47.0, -123.0);
      const b = new LocationPoint(48.0, -122.0);
      
      const bounds = new MapBounds(a, b);
      
      expect(bounds.a).toBe(a);
      expect(bounds.b).toBe(b);
    });

    it('should accept same point for both corners', () => {
      const point = new LocationPoint(47.6062, -122.3321);
      const bounds = new MapBounds(point, point);
      
      expect(bounds.a).toBe(point);
      expect(bounds.b).toBe(point);
    });

    it('should work with points in any order', () => {
      const sw = new LocationPoint(47.0, -123.0);
      const ne = new LocationPoint(48.0, -122.0);
      
      const bounds1 = new MapBounds(sw, ne);
      const bounds2 = new MapBounds(ne, sw);
      
      expect(bounds1.a).toBe(sw);
      expect(bounds1.b).toBe(ne);
      expect(bounds2.a).toBe(ne);
      expect(bounds2.b).toBe(sw);
    });

    it('should handle world-spanning bounds', () => {
      const sw = new LocationPoint(MIN_LATITUDE, MIN_LONGITUDE);
      const ne = new LocationPoint(MAX_LATITUDE, MAX_LONGITUDE);
      
      const bounds = new MapBounds(sw, ne);
      
      expect(bounds.a.lat).toBe(MIN_LATITUDE);
      expect(bounds.a.lon).toBe(MIN_LONGITUDE);
      expect(bounds.b.lat).toBe(MAX_LATITUDE);
      expect(bounds.b.lon).toBe(MAX_LONGITUDE);
    });
  });
});

describe('Statistics', () => {
  describe('constructor', () => {
    it('should create statistics with valid values', () => {
      const stats = new Statistics(100, 50);
      expect(stats.totalPoints).toBe(100);
      expect(stats.totalPaths).toBe(50);
    });

    it('should accept zero values', () => {
      const stats = new Statistics(0, 0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.totalPaths).toBe(0);
    });

    it('should throw error for negative points count', () => {
      expect(() => new Statistics(-1, 50)).toThrow('Total points cannot be negative');
    });

    it('should throw error for negative paths count', () => {
      expect(() => new Statistics(100, -1)).toThrow('Total paths cannot be negative');
    });

    it('should handle large values', () => {
      const stats = new Statistics(1000000, 500000);
      expect(stats.totalPoints).toBe(1000000);
      expect(stats.totalPaths).toBe(500000);
    });
  });
});

/**
 * Tests for TimelinePoint Entity
 */

import { describe, it, expect } from 'vitest';
import { TimelinePoint } from './TimelinePoint';
import { MAX_LATITUDE, MAX_LONGITUDE, MIN_LATITUDE } from './consts';

describe('TimelinePoint', () => {
  describe('constructor', () => {
    it('should create a timeline point with coordinates and timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const point = new TimelinePoint(47.6062, -122.3321, timestamp);
      
      expect(point.lat).toBe(47.6062);
      expect(point.lon).toBe(-122.3321);
      expect(point.timestamp).toBe(timestamp);
    });

    it('should inherit validation from LocationPoint', () => {
      const timestamp = new Date();
      expect(() => new TimelinePoint(MIN_LATITUDE - 1, 0, timestamp)).toThrow(`Latitude ${MIN_LATITUDE - 1} out of bounds`);
      expect(() => new TimelinePoint(0, MAX_LONGITUDE + 1, timestamp)).toThrow(`Longitude ${MAX_LONGITUDE + 1} out of bounds`);
    });

    it('should handle boundary coordinates', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const point = new TimelinePoint(MAX_LATITUDE, MAX_LONGITUDE, timestamp);
      
      expect(point.lat).toBe(MAX_LATITUDE);
      expect(point.lon).toBe(MAX_LONGITUDE);
    });

    it('should preserve timestamp precision', () => {
      const timestamp = new Date('2024-01-15T10:30:45.123Z');
      const point = new TimelinePoint(47.6062, -122.3321, timestamp);
      
      expect(point.timestamp.getMilliseconds()).toBe(123);
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance between timeline points', () => {
      const timestamp = new Date();
      const seattle = new TimelinePoint(47.6062, -122.3321, timestamp);
      const portland = new TimelinePoint(45.5152, -122.6784, timestamp);
      
      const distance = seattle.distanceTo(portland);
      
      expect(distance).toBeGreaterThan(230);
      expect(distance).toBeLessThan(240);
    });
  });
});

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

  describe('key', () => {
    it('returns the same key for the same values', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      const a = new TimelinePoint(48.8566, 2.3522, ts);
      const b = new TimelinePoint(48.8566, 2.3522, ts);

      expect(a.key()).toBe(b.key());
    });

    it('returns different keys for different latitudes', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      expect(new TimelinePoint(1, 0, ts).key()).not.toBe(new TimelinePoint(2, 0, ts).key());
    });

    it('returns different keys for different longitudes', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      expect(new TimelinePoint(0, 1, ts).key()).not.toBe(new TimelinePoint(0, 2, ts).key());
    });

    it('returns different keys for different timestamps', () => {
      const a = new TimelinePoint(0, 0, new Date('2024-01-01T00:00:00.000Z'));
      const b = new TimelinePoint(0, 0, new Date('2024-01-01T00:00:00.001Z'));

      expect(a.key()).not.toBe(b.key());
    });

    it('is stable across multiple calls', () => {
      const p = new TimelinePoint(51.5074, -0.1278, new Date('2023-03-15T12:00:00Z'));

      expect(p.key()).toBe(p.key());
    });
  });

  describe('equals', () => {
    it('returns true for points with the same lat, lon and timestamp', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      const a = new TimelinePoint(48.8566, 2.3522, ts);
      const b = new TimelinePoint(48.8566, 2.3522, ts);

      expect(a.equals(b)).toBe(true);
    });

    it('returns true when compared with itself', () => {
      const p = new TimelinePoint(0, 0, new Date());

      expect(p.equals(p)).toBe(true);
    });

    it('returns false for different latitude', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      expect(new TimelinePoint(1, 0, ts).equals(new TimelinePoint(2, 0, ts))).toBe(false);
    });

    it('returns false for different longitude', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      expect(new TimelinePoint(0, 1, ts).equals(new TimelinePoint(0, 2, ts))).toBe(false);
    });

    it('returns false for different timestamp', () => {
      const a = new TimelinePoint(0, 0, new Date('2024-01-01T00:00:00.000Z'));
      const b = new TimelinePoint(0, 0, new Date('2024-01-01T00:00:00.001Z'));

      expect(a.equals(b)).toBe(false);
    });

    it('is consistent with key(): two points are equal iff their keys match', () => {
      const ts = new Date('2024-06-01T00:00:00Z');
      const a = new TimelinePoint(48.8566, 2.3522, ts);
      const b = new TimelinePoint(48.8566, 2.3522, ts);
      const c = new TimelinePoint(51.5074, -0.1278, ts);

      expect(a.equals(b)).toBe(a.key() === b.key());
      expect(a.equals(c)).toBe(a.key() === c.key());
    });
  });
});

// Tests for domain entities

import { describe, it, expect } from 'vitest';
import { LocationPoint, LocationSegment, TimelineData, TimelineFile } from '../domain/entities';

describe('Domain Entities', () => {
  describe('LocationPoint', () => {
    it('should create valid location point', () => {
      const point = new LocationPoint(47.6062, -122.3321);
      expect(point.lat).toBe(47.6062);
      expect(point.lon).toBe(-122.3321);
    });

    it('should reject invalid coordinates', () => {
      expect(() => new LocationPoint(NaN, 0)).toThrow();
      expect(() => new LocationPoint(91, 0)).toThrow();
      expect(() => new LocationPoint(0, 181)).toThrow();
    });

    it('should compare points correctly', () => {
      const point1 = new LocationPoint(47.6062, -122.3321);
      const point2 = new LocationPoint(47.6062, -122.3321);
      const point3 = new LocationPoint(47.6063, -122.3321);
      
      expect(point1.equals(point2)).toBe(true);
      expect(point1.equals(point3)).toBe(false);
    });
  });

  describe('TimelineData', () => {
    it('should create empty timeline data', () => {
      const data = new TimelineData([], []);
      expect(data.isEmpty()).toBe(true);
      expect(data.pointCount).toBe(0);
      expect(data.segmentCount).toBe(0);
    });

    it('should merge timeline data', () => {
      const point1 = new LocationPoint(47.6062, -122.3321);
      const point2 = new LocationPoint(47.6063, -122.3322);
      const segment = new LocationSegment(point1, point2, 0.1);
      
      const data1 = new TimelineData([point1], [segment]);
      const data2 = new TimelineData([point2], []);
      
      const merged = data1.merge(data2);
      expect(merged.pointCount).toBe(2);
      expect(merged.segmentCount).toBe(1);
    });
  });

  describe('TimelineFile', () => {
    it('should create timeline file', () => {
      const point = new LocationPoint(47.6062, -122.3321);
      const data = new TimelineData([point], []);
      const file = new TimelineFile('test-id', 'test.json', data);
      
      expect(file.id).toBe('test-id');
      expect(file.name).toBe('test.json');
      expect(file.pointCount).toBe(1);
    });

    it('should serialize and deserialize', () => {
      const point = new LocationPoint(47.6062, -122.3321);
      const data = new TimelineData([point], []);
      const file = new TimelineFile('test-id', 'test.json', data);
      
      const json = file.toJSON();
      const restored = TimelineFile.fromJSON(json);
      
      expect(restored.id).toBe(file.id);
      expect(restored.name).toBe(file.name);
      expect(restored.pointCount).toBe(file.pointCount);
    });
  });
});

/**
 * Tests for TimelinePath Entity
 */

import { describe, it, expect } from 'vitest';
import { TimelinePath } from './TimelinePath';
import { TimelinePoint } from './TimelinePoint';

describe('TimelinePath', () => {
  describe('constructor', () => {
    it('should create a path between two points', () => {
      const timestamp1 = new Date('2024-01-15T10:00:00Z');
      const timestamp2 = new Date('2024-01-15T11:00:00Z');
      const pointA = new TimelinePoint(47.6062, -122.3321, timestamp1);
      const pointB = new TimelinePoint(47.6205, -122.3493, timestamp2);
      
      const path = new TimelinePath(pointA, pointB);
      
      expect(path.a).toBe(pointA);
      expect(path.b).toBe(pointB);
      expect(path.length).toBeGreaterThan(0);
    });

    it('should calculate length as absolute value', () => {
      const timestamp = new Date();
      const point1 = new TimelinePoint(47.0, -122.0, timestamp);
      const point2 = new TimelinePoint(48.0, -122.0, timestamp);
      
      const path = new TimelinePath(point1, point2);
      
      expect(path.length).toBeGreaterThan(0);
    });

    it('should handle path from same point', () => {
      const timestamp = new Date();
      const point = new TimelinePoint(47.6062, -122.3321, timestamp);
      
      const path = new TimelinePath(point, point);
      
      expect(path.a).toBe(point);
      expect(path.b).toBe(point);
      expect(path.length).toBe(0);
    });

    it('should create path regardless of point order', () => {
      const timestamp = new Date();
      const pointA = new TimelinePoint(47.0, -122.0, timestamp);
      const pointB = new TimelinePoint(48.0, -123.0, timestamp);
      
      const path1 = new TimelinePath(pointA, pointB);
      const path2 = new TimelinePath(pointB, pointA);
      
      expect(path1.length).toBe(path2.length);
    });

    it('should handle very long paths', () => {
      const timestamp = new Date();
      const newYork = new TimelinePoint(40.7128, -74.0060, timestamp);
      const london = new TimelinePoint(51.5074, -0.1278, timestamp);
      
      const path = new TimelinePath(newYork, london);
      
      // NYC to London ≈ 5,570 km
      expect(path.length).toBeGreaterThan(5000);
      expect(path.length).toBeLessThan(6000);
    });
  });
});

/**
 * Tests for TimelineData Entity
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineData } from './TimelineData';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { Statistics } from './value-objects';

describe('TimelineData', () => {
  let point1: TimelinePoint;
  let point2: TimelinePoint;
  let point3: TimelinePoint;
  let path1: TimelinePath;
  let path2: TimelinePath;

  beforeEach(() => {
    const timestamp = new Date();
    point1 = new TimelinePoint(47.0, -122.0, timestamp);
    point2 = new TimelinePoint(47.5, -122.5, timestamp);
    point3 = new TimelinePoint(48.0, -123.0, timestamp);
    path1 = new TimelinePath(point1, point2);
    path2 = new TimelinePath(point2, point3);
  });

  describe('constructor', () => {
    it('should create timeline data with points and paths', () => {
      const data = new TimelineData([point1, point2], [path1]);
      
      expect(data.points.size).toBe(2);
      expect(data.paths.size).toBe(1);
      expect(data.points.has(point1)).toBe(true);
      expect(data.points.has(point2)).toBe(true);
      expect(data.paths.has(path1)).toBe(true);
    });

    it('should create empty timeline data', () => {
      const data = new TimelineData([], []);
      
      expect(data.points.size).toBe(0);
      expect(data.paths.size).toBe(0);
    });

    it('should handle duplicate points', () => {
      const data = new TimelineData([point1, point1, point2], []);
      
      // Sets automatically deduplicate
      expect(data.points.size).toBe(2);
    });

    it('should handle duplicate paths', () => {
      const data = new TimelineData([], [path1, path1]);
      
      expect(data.paths.size).toBe(1);
    });

    it('should store references, not copies', () => {
      const data = new TimelineData([point1], [path1]);
      
      expect(data.points.has(point1)).toBe(true);
      expect(Array.from(data.points)[0]).toBe(point1);
    });
  });

  describe('addPoints', () => {
    it('should add single point', () => {
      const data = new TimelineData([], []);
      data.addPoints(point1);
      
      expect(data.points.size).toBe(1);
      expect(data.points.has(point1)).toBe(true);
    });

    it('should add multiple points', () => {
      const data = new TimelineData([], []);
      data.addPoints(point1, point2, point3);
      
      expect(data.points.size).toBe(3);
    });

    it('should not duplicate existing points', () => {
      const data = new TimelineData([point1], []);
      data.addPoints(point1);
      
      expect(data.points.size).toBe(1);
    });
  });

  describe('addPaths', () => {
    it('should add single path', () => {
      const data = new TimelineData([], []);
      data.addPaths(path1);
      
      expect(data.paths.size).toBe(1);
      expect(data.paths.has(path1)).toBe(true);
    });

    it('should add multiple paths', () => {
      const data = new TimelineData([], []);
      data.addPaths(path1, path2);
      
      expect(data.paths.size).toBe(2);
    });

    it('should not duplicate existing paths', () => {
      const data = new TimelineData([], [path1]);
      data.addPaths(path1);
      
      expect(data.paths.size).toBe(1);
    });
  });

  describe('removePoints', () => {
    it('should remove single point', () => {
      const data = new TimelineData([point1, point2], []);
      data.removePoints(point1);
      
      expect(data.points.size).toBe(1);
      expect(data.points.has(point1)).toBe(false);
      expect(data.points.has(point2)).toBe(true);
    });

    it('should remove multiple points in batch', () => {
      const data = new TimelineData([point1, point2, point3], []);
      data.removePoints(point1, point3);
      
      expect(data.points.size).toBe(1);
      expect(data.points.has(point2)).toBe(true);
    });

    it('should handle removing non-existent point', () => {
      const data = new TimelineData([point1], []);
      data.removePoints(point2);
      
      expect(data.points.size).toBe(1);
    });

    it('should handle empty removal', () => {
      const data = new TimelineData([point1], []);
      data.removePoints();
      
      expect(data.points.size).toBe(1);
    });
  });

  describe('removePaths', () => {
    it('should remove single path', () => {
      const data = new TimelineData([], [path1, path2]);
      data.removePaths(path1);
      
      expect(data.paths.size).toBe(1);
      expect(data.paths.has(path2)).toBe(true);
    });

    it('should remove multiple paths in batch', () => {
      const data = new TimelineData([], [path1, path2]);
      data.removePaths(path1, path2);
      
      expect(data.paths.size).toBe(0);
    });

    it('should handle removing non-existent path', () => {
      const data = new TimelineData([], [path1]);
      data.removePaths(path2);
      
      expect(data.paths.size).toBe(1);
    });
  });

  describe('getPoints', () => {
    it('should return array of all points', () => {
      const data = new TimelineData([point1, point2], []);
      const points = data.getPoints();
      
      expect(Array.isArray(points)).toBe(true);
      expect(points).toHaveLength(2);
      expect(points).toContain(point1);
      expect(points).toContain(point2);
    });

    it('should return empty array when no points', () => {
      const data = new TimelineData([], []);
      expect(data.getPoints()).toEqual([]);
    });
  });

  describe('getPaths', () => {
    it('should return array of all paths', () => {
      const data = new TimelineData([], [path1, path2]);
      const paths = data.getPaths();
      
      expect(Array.isArray(paths)).toBe(true);
      expect(paths).toHaveLength(2);
      expect(paths).toContain(path1);
      expect(paths).toContain(path2);
    });

    it('should return empty array when no paths', () => {
      const data = new TimelineData([], []);
      expect(data.getPaths()).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics with correct counts', () => {
      const data = new TimelineData([point1, point2, point3], [path1, path2]);
      const stats = data.getStatistics();
      
      expect(stats).toBeInstanceOf(Statistics);
      expect(stats.totalPoints).toBe(3);
      expect(stats.totalPaths).toBe(2);
    });

    it('should return zero statistics for empty data', () => {
      const data = new TimelineData([], []);
      const stats = data.getStatistics();
      
      expect(stats.totalPoints).toBe(0);
      expect(stats.totalPaths).toBe(0);
    });
  });
});

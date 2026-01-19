/**
 * Tests for TimelineFile Entity
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineFile } from './TimelineFile';
import { TimelineData } from './TimelineData';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';

describe('TimelineFile', () => {
  let data: TimelineData;

  beforeEach(() => {
    const timestamp = new Date();
    const point1 = new TimelinePoint(47.0, -122.0, timestamp);
    const point2 = new TimelinePoint(48.0, -123.0, timestamp);
    const path = new TimelinePath(point1, point2);
    data = new TimelineData([point1, point2], [path]);
  });

  describe('constructor', () => {
    it('should create file with name and data', () => {
      const file = new TimelineFile('my-timeline.json', data);
      
      expect(file.name).toBe('my-timeline.json');
      expect(file.data).toBe(data);
      expect(file.id).toBeDefined();
      expect(typeof file.id).toBe('string');
    });

    it('should generate unique IDs automatically', () => {
      const file1 = new TimelineFile('test.json', data);
      const file2 = new TimelineFile('test.json', data);
      
      expect(file1.id).not.toBe(file2.id);
    });

    it('should accept custom ID', () => {
      const customId = 'custom-id-123';
      const file = new TimelineFile('test.json', data, customId);
      
      expect(file.id).toBe(customId);
    });

    it('should store reference to data, not copy', () => {
      const file = new TimelineFile('test.json', data);
      
      expect(file.data).toBe(data);
    });

    it('should handle various file names', () => {
      const file1 = new TimelineFile('timeline-2024.json', data);
      const file2 = new TimelineFile('export (1).json', data);
      const file3 = new TimelineFile('data', data);
      
      expect(file1.name).toBe('timeline-2024.json');
      expect(file2.name).toBe('export (1).json');
      expect(file3.name).toBe('data');
    });

    it('should handle empty timeline data', () => {
      const emptyData = new TimelineData([], []);
      const file = new TimelineFile('empty.json', emptyData);
      
      expect(file.data.points.size).toBe(0);
      expect(file.data.paths.size).toBe(0);
    });
  });
});

/**
 * Tests for Map Aggregate Root
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Map } from './Map';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { MapBounds, LocationPoint } from './value-objects';

describe('Map', () => {
  let map: Map;
  const now = new Date();

  beforeEach(() => {
    map = new Map();
  });

  describe('getSegmentIdForPoint', () => {
    it('returns correct segment ID for origin (0,0)', () => {
      const point = new TimelinePoint(0, 0, now);
      expect(map.getSegmentIdForPoint(point)).toBe(32580);
    });

    it('returns correct segment ID for minimum bounds (-90, -180)', () => {
      const point = new TimelinePoint(-90, -180, now);
      expect(map.getSegmentIdForPoint(point)).toBe(0);
    });

    it('returns correct segment ID for maximum bounds', () => {
      const point = new TimelinePoint(89.999, 179.999, now);
      expect(map.getSegmentIdForPoint(point)).toBe(64799);
    });

    it('handles negative coordinates correctly', () => {
        const point = new TimelinePoint(-45, -90, now);
        expect(map.getSegmentIdForPoint(point)).toBe(16290);
    });
  });

  describe('getSegmentIdsForBound', () => {
    it('returns single segment ID for small bounds within a segment', () => {
      const p1 = new LocationPoint(0.1, 0.1);
      const p2 = new LocationPoint(0.2, 0.2);
      const bounds = new MapBounds(p1, p2);
      
      const ids = map.getSegmentIdsForBound(bounds);
      expect(ids).toHaveLength(1);
      expect(ids[0]).toBe(32580);
    });

    it('returns multiple segment IDs for bounds crossing segment lines', () => {
      const p1 = new LocationPoint(0.9, 0.9);
      const p2 = new LocationPoint(1.1, 1.1);
      const bounds = new MapBounds(p1, p2);

      const ids = map.getSegmentIdsForBound(bounds);
      expect(ids).toHaveLength(4);
      expect(ids).toContain(32580);
      expect(ids).toContain(32581);
      expect(ids).toContain(32940);
      expect(ids).toContain(32941);
    });
  });

  describe('getSegmentIdsForPath', () => {
    it('returns segments for path within single segment', () => {
        const p1 = new TimelinePoint(0.1, 0.1, now);
        const p2 = new TimelinePoint(0.2, 0.2, now);
        const path = new TimelinePath(p1, p2);

        const ids = map.getSegmentIdsForPath(path);
        expect(ids).toHaveLength(1);
        expect(ids[0]).toBe(32580);
    });

    it('returns segments for path crossing boundary', () => {
        const p1 = new TimelinePoint(0.5, 0.5, now);
        const p2 = new TimelinePoint(0.5, 1.5, now);
        const path = new TimelinePath(p1, p2);

        const ids = map.getSegmentIdsForPath(path);
        
        expect(ids).toContain(32580);
        expect(ids).toContain(32581);
        expect(ids.length).toBeGreaterThanOrEqual(2);
    });

    it('returns segments for path crossing 3 horizontal segments', () => {
        const p1 = new TimelinePoint(0.5, 0.5, now);
        const p2 = new TimelinePoint(0.5, 2.5, now);
        const path = new TimelinePath(p1, p2);

        const ids = map.getSegmentIdsForPath(path);
        
        expect(ids).toHaveLength(3);
        expect(ids).toContain(32580);
        expect(ids).toContain(32581);
        expect(ids).toContain(32582);
    });
  });
});

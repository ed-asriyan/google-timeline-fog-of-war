/**
 * Tests for MapSegment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MapSegment } from './MapSegment';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';

describe('MapSegment', () => {
    let point1: TimelinePoint;
    let point2: TimelinePoint;
    let point3: TimelinePoint;
    let path1: TimelinePath;
    let path2: TimelinePath;

    beforeEach(() => {
        const timestamp = new Date();
        point1 = new TimelinePoint(47.6062, -122.3321, timestamp);
        point2 = new TimelinePoint(47.6205, -122.3493, timestamp);
        point3 = new TimelinePoint(47.6152, -122.3784, timestamp);
        path1 = new TimelinePath(point1, point2);
        path2 = new TimelinePath(point2, point3);
    });

    describe('createEmpty', () => {
        it('should create an empty segment', () => {
            const segment = MapSegment.createEmpty();

            expect(segment).toBeInstanceOf(MapSegment);
        });

        it('should have no points initially', () => {
            const segment = MapSegment.createEmpty();
            expect(segment.getPoints()).toEqual([]);
        });

        it('should have no paths initially', () => {
            const segment = MapSegment.createEmpty();
            expect(segment.getPaths()).toEqual([]);
        });

        it('should have zero statistics initially', () => {
            const segment = MapSegment.createEmpty();
            const stats = segment.getStatistics();

            expect(stats.totalPoints).toBe(0);
            expect(stats.totalPaths).toBe(0);
        });
    });

    describe('addPoints', () => {
        it('should add a single point', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1);

            const points = segment.getPoints();
            expect(points).toHaveLength(1);
            expect(points[0]).toBe(point1);
            expect(segment.getStatistics()).toEqual({ totalPoints: 1, totalPaths: 0 });
        });

        it('should add multiple points', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2, point3);

            const points = segment.getPoints();
            expect(points).toHaveLength(3);
            expect(segment.getStatistics()).toEqual({ totalPoints: 3, totalPaths: 0 });
        });

        it('should handle adding duplicate points', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1);
            segment.addPoints(point1);

            const points = segment.getPoints();
            expect(points.length).toBe(1);
            expect(segment.getStatistics()).toEqual({ totalPoints: 1, totalPaths: 0 });
        });
    });

    describe('addPaths', () => {
        it('should add a single path', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1);

            const paths = segment.getPaths();
            expect(paths).toHaveLength(1);
            expect(paths[0]).toBe(path1);
            expect(segment.getStatistics()).toEqual({ totalPoints: 0, totalPaths: 1 });
        });

        it('should add multiple paths', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1, path2);

            const paths = segment.getPaths();
            expect(paths).toHaveLength(2);
            expect(segment.getStatistics()).toEqual({ totalPoints: 0, totalPaths: 2 });
        });

        it('should update statistics when adding paths', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1, path2);

            const stats = segment.getStatistics();
            expect(stats.totalPaths).toBe(2);
            expect(stats.totalPoints).toBe(0);
        });
    });

    describe('removePoints', () => {
        it('should remove a point', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2);
            segment.removePoints(point1);

            const points = segment.getPoints();
            expect(points).toHaveLength(1);
            expect(points[0]).toBe(point2);
            expect(segment.getStatistics()).toEqual({ totalPoints: 1, totalPaths: 0 });
        });

        it('should remove multiple points', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2, point3);
            segment.removePoints(point1, point3);

            const points = segment.getPoints();
            expect(points).toHaveLength(1);
            expect(points[0]).toBe(point2);
            expect(segment.getStatistics()).toEqual({ totalPoints: 1, totalPaths: 0 });
        });

        it('should update statistics when removing points', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2);
            segment.removePoints(point1);

            const stats = segment.getStatistics();
            expect(stats.totalPoints).toBe(1);
            expect(stats.totalPaths).toBe(0);
        });

        it('should handle removing non-existent point gracefully', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1);

            expect(() => segment.removePoints(point2)).not.toThrow();
            expect(segment.getPoints()).toHaveLength(1);
            expect(segment.getStatistics()).toEqual({ totalPoints: 1, totalPaths: 0 });
        });
    });

    describe('removePaths', () => {
        it('should remove a path', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1, path2);
            segment.removePaths(path1);

            const paths = segment.getPaths();
            expect(paths).toHaveLength(1);
            expect(paths[0]).toBe(path2);
            expect(segment.getStatistics()).toEqual({ totalPoints: 0, totalPaths: 1 });
        });

        it('should remove multiple paths', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1, path2);
            segment.removePaths(path1, path2);

            expect(segment.getPaths()).toEqual([]);
            expect(segment.getStatistics()).toEqual({ totalPoints: 0, totalPaths: 0 });
        });

        it('should update statistics when removing paths', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1, path2);
            segment.removePaths(path1);

            const stats = segment.getStatistics();
            expect(stats.totalPaths).toBe(1);
            expect(stats.totalPoints).toBe(0);
        });

        it('should handle removing non-existent path gracefully', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1);

            expect(() => segment.removePaths(path2)).not.toThrow();
            expect(segment.getPaths()).toHaveLength(1);
        });
    });

    describe('getPoints', () => {
        it('should return all points in segment', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2);

            const points = segment.getPoints();
            expect(points).toContain(point1);
            expect(points).toContain(point2);
        });

        it('should return empty array for empty segment', () => {
            const segment = MapSegment.createEmpty();
            expect(segment.getPoints()).toEqual([]);
        });
    });

    describe('getPaths', () => {
        it('should return all paths in segment', () => {
            const segment = MapSegment.createEmpty();
            segment.addPaths(path1, path2);

            const paths = segment.getPaths();
            expect(paths).toContain(path1);
            expect(paths).toContain(path2);
        });

        it('should return empty array for empty segment', () => {
            const segment = MapSegment.createEmpty();
            expect(segment.getPaths()).toEqual([]);
        });
    });

    describe('getStatistics', () => {
        it('should return accurate statistics', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2);
            segment.addPaths(path1);

            const stats = segment.getStatistics();
            expect(stats.totalPoints).toBe(2);
            expect(stats.totalPaths).toBe(1);
        });

        it('should reflect changes after additions and removals', () => {
            const segment = MapSegment.createEmpty();
            segment.addPoints(point1, point2, point3);
            segment.addPaths(path1, path2);
            segment.removePoints(point1);
            segment.removePaths(path1);

            const stats = segment.getStatistics();
            expect(stats.totalPoints).toBe(2);
            expect(stats.totalPaths).toBe(1);
        });
    });
});

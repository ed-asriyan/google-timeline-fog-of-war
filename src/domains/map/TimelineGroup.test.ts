/**
 * Tests for TimelineGroup Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineGroup } from './TimelineGroup';
import { MapSegment } from './MapSegment';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { Statistics } from './value-objects';


describe('TimelineGroup', () => {
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
        it('should create group with points and paths', () => {
            const group = new TimelineGroup([point1, point2], [path1]);

            expect(group.points.length).toBe(2);
            expect(group.paths.length).toBe(1);
            expect(group.points.includes(point1)).toBe(true);
            expect(group.points.includes(point2)).toBe(true);
            expect(group.paths.includes(path1)).toBe(true);
        });

        it('should create empty group when no arguments provided', () => {
            const group = new TimelineGroup([], []);

            expect(group.points.length).toBe(0);
            expect(group.paths.length).toBe(0);
        });

        it('should create group with only points', () => {
            const group = new TimelineGroup([point1, point2], []);

            expect(group.points.length).toBe(2);
            expect(group.paths.length).toBe(0);
        });

        it('should create group with only paths', () => {
            const group = new TimelineGroup([], [path1, path2]);

            expect(group.points.length).toBe(0);
            expect(group.paths.length).toBe(2);
        });

        it('should store duplicate point references in constructor (no dedup)', () => {
            const group = new TimelineGroup([point1, point1, point2], []);

            // Arrays do not deduplicate; use removeDuplicates() explicitly
            expect(group.points.length).toBe(3);
        });

        it('should store duplicate path references in constructor (no dedup)', () => {
            const group = new TimelineGroup([], [path1, path1]);

            expect(group.paths.length).toBe(2);
        });

        it('should store equal points in constructor without dedup', () => {
            const point2: TimelinePoint = new TimelinePoint(point1.lat, point1.lon, point1.timestamp);

            const group = new TimelineGroup([point1, point2], []);

            // No dedup on construction; call removeDuplicates() to deduplicate
            expect(group.points.length).toBe(2);
        });

        it('should store equal paths in constructor without dedup', () => {
            const path2: TimelinePath = new TimelinePath(point1, point2);

            const group = new TimelineGroup([], [path1, path2]);

            expect(group.paths.length).toBe(2);
        });

        it('should store equal paths in constructor without dedup 2', () => {
            const point3 = new TimelinePoint(point1.lat, point1.lon, point1.timestamp);
            const point4 = new TimelinePoint(point2.lat, point2.lon, point2.timestamp);

            const path1: TimelinePath = new TimelinePath(point1, point2);
            const path2: TimelinePath = new TimelinePath(point3, point4);

            const group = new TimelineGroup([], [path1, path2]);

            expect(group.paths.length).toBe(2);
        });

        it('should store references, not copies', () => {
            const group = new TimelineGroup([point1], [path1]);

            expect(group.points.includes(point1)).toBe(true);
            expect(group.points[0]).toBe(point1);
            expect(group.paths.includes(path1)).toBe(true);
            expect(group.paths[0]).toBe(path1);
        });

        it('should handle empty arrays', () => {
            const group = new TimelineGroup([], []);

            expect(group.points.length).toBe(0);
            expect(group.paths.length).toBe(0);
        });
    });

    describe('addPoints', () => {
        it('should add single point', () => {
            const group = new TimelineGroup([], []);
            group.addPoints(point1);

            expect(group.points.length).toBe(1);
            expect(group.points.includes(point1)).toBe(true);
        });

        it('should add multiple points', () => {
            const group = new TimelineGroup([], []);
            group.addPoints(point1, point2, point3);

            expect(group.points.length).toBe(3);
            expect(group.points.includes(point1)).toBe(true);
            expect(group.points.includes(point2)).toBe(true);
            expect(group.points.includes(point3)).toBe(true);
        });

        it('should allow duplicate point references (no dedup)', () => {
            const group = new TimelineGroup([point1], []);
            group.addPoints(point1);

            expect(group.points.length).toBe(2);
        });

        it('should allow equal points without dedup', () => {
            const group = new TimelineGroup([point1], []);
            const point2 = new TimelinePoint(point1.lat, point1.lon, point1.timestamp);
            group.addPoints(point2);

            expect(group.points.length).toBe(2);
        });

        it('should handle empty arguments', () => {
            const group = new TimelineGroup([point1], []);
            group.addPoints();

            expect(group.points.length).toBe(1);
        });

        it('should add to existing points', () => {
            const group = new TimelineGroup([point1], []);
            group.addPoints(point2);

            expect(group.points.length).toBe(2);
            expect(group.points.includes(point1)).toBe(true);
            expect(group.points.includes(point2)).toBe(true);
        });
    });

    describe('addPaths', () => {
        it('should add single path', () => {
            const group = new TimelineGroup([], []);
            group.addPaths(path1);

            expect(group.paths.length).toBe(1);
            expect(group.paths.includes(path1)).toBe(true);
        });

        it('should add multiple paths', () => {
            const group = new TimelineGroup([], []);
            group.addPaths(path1, path2);

            expect(group.paths.length).toBe(2);
            expect(group.paths.includes(path1)).toBe(true);
            expect(group.paths.includes(path2)).toBe(true);
        });

        it('should allow duplicate path references (no dedup)', () => {
            const group = new TimelineGroup([], [path1]);
            group.addPaths(path1);

            expect(group.paths.length).toBe(2);
        });

        it('should handle empty arguments', () => {
            const group = new TimelineGroup([], [path1]);
            group.addPaths();

            expect(group.paths.length).toBe(1);
        });

        it('should add to existing paths', () => {
            const group = new TimelineGroup([], [path1]);
            group.addPaths(path2);

            expect(group.paths.length).toBe(2);
            expect(group.paths.includes(path1)).toBe(true);
            expect(group.paths.includes(path2)).toBe(true);
        });

        it('should allow equal paths without dedup', () => {
            const group = new TimelineGroup([], [path1]);
            const path2 = new TimelinePath(path1.a, path1.b);
            group.addPaths(path2);

            expect(group.paths.length).toBe(2);
        });
    });

    describe('removePoints', () => {
        it('should remove single point', () => {
            const group = new TimelineGroup([point1, point2], []);
            group.removePoints(point1);

            expect(group.points.length).toBe(1);
            expect(group.points.includes(point1)).toBe(false);
            expect(group.points.includes(point2)).toBe(true);
        });

        it('should remove multiple points in batch', () => {
            const group = new TimelineGroup([point1, point2, point3], []);
            group.removePoints(point1, point3);

            expect(group.points.length).toBe(1);
            expect(group.points.includes(point2)).toBe(true);
            expect(group.points.includes(point1)).toBe(false);
            expect(group.points.includes(point3)).toBe(false);
        });

        it('should handle removing non-existent point', () => {
            const group = new TimelineGroup([point1], []);
            group.removePoints(point2);

            expect(group.points.length).toBe(1);
            expect(group.points.includes(point1)).toBe(true);
        });

        it('should handle empty arguments', () => {
            const group = new TimelineGroup([point1], []);
            group.removePoints();

            expect(group.points.length).toBe(1);
        });

        it('should remove all points when all are specified', () => {
            const group = new TimelineGroup([point1, point2], []);
            group.removePoints(point1, point2);

            expect(group.points.length).toBe(0);
        });
    });

    describe('removePaths', () => {
        it('should remove single path', () => {
            const group = new TimelineGroup([], [path1, path2]);
            group.removePaths(path1);

            expect(group.paths.length).toBe(1);
            expect(group.paths.includes(path1)).toBe(false);
            expect(group.paths.includes(path2)).toBe(true);
        });

        it('should remove multiple paths in batch', () => {
            const group = new TimelineGroup([], [path1, path2]);
            group.removePaths(path1, path2);

            expect(group.paths.length).toBe(0);
        });

        it('should handle removing non-existent path', () => {
            const group = new TimelineGroup([], [path1]);
            group.removePaths(path2);

            expect(group.paths.length).toBe(1);
            expect(group.paths.includes(path1)).toBe(true);
        });

        it('should handle empty arguments', () => {
            const group = new TimelineGroup([], [path1]);
            group.removePaths();

            expect(group.paths.length).toBe(1);
        });
    });

    describe('getPoints', () => {
        it('should return array of all points', () => {
            const group = new TimelineGroup([point1, point2], []);
            const points = group.getPoints();

            expect(Array.isArray(points)).toBe(true);
            expect(points).toHaveLength(2);
            expect(points).toContain(point1);
            expect(points).toContain(point2);
        });

        it('should return empty array when no points', () => {
            const group = new TimelineGroup([], []);
            const points = group.getPoints();

            expect(points).toEqual([]);
        });

        it('should return references to actual points', () => {
            const group = new TimelineGroup([point1], []);
            const points = group.getPoints();

            expect(points[0]).toBe(point1);
        });
    });

    describe('getPaths', () => {
        it('should return array of all paths', () => {
            const group = new TimelineGroup([], [path1, path2]);
            const paths = group.getPaths();

            expect(Array.isArray(paths)).toBe(true);
            expect(paths).toHaveLength(2);
            expect(paths).toContain(path1);
            expect(paths).toContain(path2);
        });

        it('should return empty array when no paths', () => {
            const group = new TimelineGroup([], []);
            const paths = group.getPaths();

            expect(paths).toEqual([]);
        });

        it('should return references to actual paths', () => {
            const group = new TimelineGroup([], [path1]);
            const paths = group.getPaths();

            expect(paths[0]).toBe(path1);
        });
    });

    describe('getStatistics', () => {
        it('should return statistics with correct counts', () => {
            const group = new TimelineGroup([point1, point2, point3], [path1, path2]);
            const stats = group.getStatistics();

            expect(stats).toBeInstanceOf(Statistics);
            expect(stats.totalPoints).toBe(3);
            expect(stats.totalPaths).toBe(2);
        });

        it('should return zero statistics for empty group', () => {
            const group = new TimelineGroup([], []);
            const stats = group.getStatistics();

            expect(stats.totalPoints).toBe(0);
            expect(stats.totalPaths).toBe(0);
        });

        it('should return statistics with only points', () => {
            const group = new TimelineGroup([point1, point2], []);
            const stats = group.getStatistics();

            expect(stats.totalPoints).toBe(2);
            expect(stats.totalPaths).toBe(0);
        });

        it('should return statistics with only paths', () => {
            const group = new TimelineGroup([], [path1, path2]);
            const stats = group.getStatistics();

            expect(stats.totalPoints).toBe(0);
            expect(stats.totalPaths).toBe(2);
        });

        it('should reflect changes after adding points', () => {
            const group = new TimelineGroup([], []);
            group.addPoints(point1);

            const stats = group.getStatistics();
            expect(stats.totalPoints).toBe(1);
        });

        it('should reflect changes after removing points', () => {
            const group = new TimelineGroup([point1, point2], []);
            group.removePoints(point1);

            const stats = group.getStatistics();
            expect(stats.totalPoints).toBe(1);
        });
    });

    describe('array accessors', () => {
        it('should expose points as readonly array', () => {
            const group = new TimelineGroup([point1], []);

            expect(Array.isArray(group.points)).toBe(true);
            expect(group.points.includes(point1)).toBe(true);
        });

        it('should expose paths as readonly array', () => {
            const group = new TimelineGroup([], [path1]);

            expect(Array.isArray(group.paths)).toBe(true);
            expect(group.paths.includes(path1)).toBe(true);
        });

        it('should allow direct array access', () => {
            const group = new TimelineGroup([point1, point2], [path1]);

            expect(group.points.length).toBe(2);
            expect(group.paths.length).toBe(1);
        });
    });

    describe('removeDuplicates', () => {
        it('should remove duplicate point references', () => {
            const group = new TimelineGroup([point1, point1, point2], []);
            group.removeDuplicates();

            expect(group.points.length).toBe(2);
            expect(group.points.includes(point1)).toBe(true);
            expect(group.points.includes(point2)).toBe(true);
        });

        it('should remove equal points (same key)', () => {
            const pointDup = new TimelinePoint(point1.lat, point1.lon, point1.timestamp);
            const group = new TimelineGroup([point1, pointDup, point2], []);
            group.removeDuplicates();

            expect(group.points.length).toBe(2);
        });

        it('should keep the first occurrence of a duplicate point', () => {
            const pointDup = new TimelinePoint(point1.lat, point1.lon, point1.timestamp);
            const group = new TimelineGroup([point1, pointDup], []);
            group.removeDuplicates();

            expect(group.points[0]).toBe(point1);
        });

        it('should remove duplicate path references', () => {
            const group = new TimelineGroup([], [path1, path1, path2]);
            group.removeDuplicates();

            expect(group.paths.length).toBe(2);
        });

        it('should remove equal paths (same key)', () => {
            const pathDup = new TimelinePath(point1, point2);
            const group = new TimelineGroup([], [path1, pathDup]);
            group.removeDuplicates();

            expect(group.paths.length).toBe(1);
        });

        it('should handle already-deduplicated group', () => {
            const group = new TimelineGroup([point1, point2], [path1, path2]);
            group.removeDuplicates();

            expect(group.points.length).toBe(2);
            expect(group.paths.length).toBe(2);
        });

        it('should handle empty group', () => {
            const group = new TimelineGroup([], []);
            group.removeDuplicates();

            expect(group.points.length).toBe(0);
            expect(group.paths.length).toBe(0);
        });

        it('should deduplicate after mergeFrom', () => {
            const group1 = new TimelineGroup([point1, point2], [path1]);
            const group2 = new TimelineGroup([point2, point3], [path1]);
            group1.mergeFrom(group2);
            group1.removeDuplicates();

            expect(group1.points.length).toBe(3);
            expect(group1.paths.length).toBe(1);
        });
    });
});

describe('MapSegment', () => {
    let point1: TimelinePoint;
    let point2: TimelinePoint;
    let path1: TimelinePath;

    beforeEach(() => {
        const timestamp = new Date();
        point1 = new TimelinePoint(47.6062, -122.3321, timestamp);
        point2 = new TimelinePoint(47.6205, -122.3493, timestamp);
        path1 = new TimelinePath(point1, point2);
    });

    it('is an instance of TimelineGroup', () => {
        expect(new MapSegment(0)).toBeInstanceOf(TimelineGroup);
    });

    it('exposes its index', () => {
        expect(new MapSegment(42).index).toBe(42);
    });

    it('inherits addPoints / getPoints from TimelineGroup', () => {
        const segment = new MapSegment(0);
        segment.addPoints(point1, point2);
        expect(segment.getPoints()).toHaveLength(2);
    });

    it('inherits addPaths / getPaths from TimelineGroup', () => {
        const segment = new MapSegment(0);
        segment.addPaths(path1);
        expect(segment.getPaths()).toHaveLength(1);
    });

    it('inherits removePoints from TimelineGroup', () => {
        const segment = new MapSegment(0);
        segment.addPoints(point1, point2);
        segment.removePoints(point1);
        expect(segment.getPoints()).toHaveLength(1);
    });

    it('inherits removePaths from TimelineGroup', () => {
        const segment = new MapSegment(0);
        segment.addPaths(path1);
        segment.removePaths(path1);
        expect(segment.getPaths()).toHaveLength(0);
    });

    it('inherits getStatistics from TimelineGroup', () => {
        const segment = new MapSegment(0);
        segment.addPoints(point1);
        segment.addPaths(path1);
        const stats = segment.getStatistics();
        expect(stats).toBeInstanceOf(Statistics);
        expect(stats.totalPoints).toBe(1);
        expect(stats.totalPaths).toBe(1);
    });
});

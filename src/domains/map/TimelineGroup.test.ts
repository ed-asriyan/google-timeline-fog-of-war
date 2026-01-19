/**
 * Tests for TimelineGroup Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineGroup } from './TimelineGroup';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { Statistics } from './value-objects';

// Test wrapper to access protected methods
class TestableTimelineGroup extends TimelineGroup {
    // Expose protected methods for testing
    public addPoints(...points: TimelinePoint[]): void {
        super.addPoints(...points);
    }

    public addPaths(...paths: TimelinePath[]): void {
        super.addPaths(...paths);
    }

    public removePoints(...points: TimelinePoint[]): void {
        super.removePoints(...points);
    }

    public removePaths(...paths: TimelinePath[]): void {
        super.removePaths(...paths);
    }

    public getPoints(): TimelinePoint[] {
        return super.getPoints();
    }

    public getPaths(): TimelinePath[] {
        return super.getPaths();
    }
}

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

            expect(group.points.size).toBe(2);
            expect(group.paths.size).toBe(1);
            expect(group.points.has(point1)).toBe(true);
            expect(group.points.has(point2)).toBe(true);
            expect(group.paths.has(path1)).toBe(true);
        });

        it('should create empty group when no arguments provided', () => {
            const group = new TimelineGroup();

            expect(group.points.size).toBe(0);
            expect(group.paths.size).toBe(0);
        });

        it('should create group with only points', () => {
            const group = new TimelineGroup([point1, point2]);

            expect(group.points.size).toBe(2);
            expect(group.paths.size).toBe(0);
        });

        it('should create group with only paths', () => {
            const group = new TimelineGroup(undefined, [path1, path2]);

            expect(group.points.size).toBe(0);
            expect(group.paths.size).toBe(2);
        });

        it('should handle duplicate points in constructor', () => {
            const group = new TimelineGroup([point1, point1, point2]);

            // Sets automatically deduplicate
            expect(group.points.size).toBe(2);
        });

        it('should handle duplicate paths in constructor', () => {
            const group = new TimelineGroup(undefined, [path1, path1]);

            expect(group.paths.size).toBe(1);
        });

        it('should store references, not copies', () => {
            const group = new TimelineGroup([point1], [path1]);

            expect(group.points.has(point1)).toBe(true);
            expect(Array.from(group.points)[0]).toBe(point1);
            expect(group.paths.has(path1)).toBe(true);
            expect(Array.from(group.paths)[0]).toBe(path1);
        });

        it('should handle empty arrays', () => {
            const group = new TimelineGroup([], []);

            expect(group.points.size).toBe(0);
            expect(group.paths.size).toBe(0);
        });
    });

    describe('createEmpty', () => {
        it('should create empty group', () => {
            const group = TimelineGroup.createEmpty();

            expect(group).toBeInstanceOf(TimelineGroup);
            expect(group.points.size).toBe(0);
            expect(group.paths.size).toBe(0);
        });

        it('should return new instance each time', () => {
            const group1 = TimelineGroup.createEmpty();
            const group2 = TimelineGroup.createEmpty();

            expect(group1).not.toBe(group2);
        });
    });

    describe('addPoints', () => {
        it('should add single point', () => {
            const group = new TestableTimelineGroup();
            group.addPoints(point1);

            expect(group.points.size).toBe(1);
            expect(group.points.has(point1)).toBe(true);
        });

        it('should add multiple points', () => {
            const group = new TestableTimelineGroup();
            group.addPoints(point1, point2, point3);

            expect(group.points.size).toBe(3);
            expect(group.points.has(point1)).toBe(true);
            expect(group.points.has(point2)).toBe(true);
            expect(group.points.has(point3)).toBe(true);
        });

        it('should not duplicate existing points', () => {
            const group = new TestableTimelineGroup([point1]);
            group.addPoints(point1);

            expect(group.points.size).toBe(1);
        });

        it('should handle empty arguments', () => {
            const group = new TestableTimelineGroup([point1]);
            group.addPoints();

            expect(group.points.size).toBe(1);
        });

        it('should add to existing points', () => {
            const group = new TestableTimelineGroup([point1]);
            group.addPoints(point2);

            expect(group.points.size).toBe(2);
            expect(group.points.has(point1)).toBe(true);
            expect(group.points.has(point2)).toBe(true);
        });
    });

    describe('addPaths', () => {
        it('should add single path', () => {
            const group = new TestableTimelineGroup();
            group.addPaths(path1);

            expect(group.paths.size).toBe(1);
            expect(group.paths.has(path1)).toBe(true);
        });

        it('should add multiple paths', () => {
            const group = new TestableTimelineGroup();
            group.addPaths(path1, path2);

            expect(group.paths.size).toBe(2);
            expect(group.paths.has(path1)).toBe(true);
            expect(group.paths.has(path2)).toBe(true);
        });

        it('should not duplicate existing paths', () => {
            const group = new TestableTimelineGroup(undefined, [path1]);
            group.addPaths(path1);

            expect(group.paths.size).toBe(1);
        });

        it('should handle empty arguments', () => {
            const group = new TestableTimelineGroup(undefined, [path1]);
            group.addPaths();

            expect(group.paths.size).toBe(1);
        });

        it('should add to existing paths', () => {
            const group = new TestableTimelineGroup(undefined, [path1]);
            group.addPaths(path2);

            expect(group.paths.size).toBe(2);
            expect(group.paths.has(path1)).toBe(true);
            expect(group.paths.has(path2)).toBe(true);
        });
    });

    describe('removePoints', () => {
        it('should remove single point', () => {
            const group = new TestableTimelineGroup([point1, point2]);
            group.removePoints(point1);

            expect(group.points.size).toBe(1);
            expect(group.points.has(point1)).toBe(false);
            expect(group.points.has(point2)).toBe(true);
        });

        it('should remove multiple points in batch', () => {
            const group = new TestableTimelineGroup([point1, point2, point3]);
            group.removePoints(point1, point3);

            expect(group.points.size).toBe(1);
            expect(group.points.has(point2)).toBe(true);
            expect(group.points.has(point1)).toBe(false);
            expect(group.points.has(point3)).toBe(false);
        });

        it('should handle removing non-existent point', () => {
            const group = new TestableTimelineGroup([point1]);
            group.removePoints(point2);

            expect(group.points.size).toBe(1);
            expect(group.points.has(point1)).toBe(true);
        });

        it('should handle empty arguments', () => {
            const group = new TestableTimelineGroup([point1]);
            group.removePoints();

            expect(group.points.size).toBe(1);
        });

        it('should remove all points when all are specified', () => {
            const group = new TestableTimelineGroup([point1, point2]);
            group.removePoints(point1, point2);

            expect(group.points.size).toBe(0);
        });
    });

    describe('removePaths', () => {
        it('should remove single path', () => {
            const group = new TestableTimelineGroup(undefined, [path1, path2]);
            group.removePaths(path1);

            expect(group.paths.size).toBe(1);
            expect(group.paths.has(path1)).toBe(false);
            expect(group.paths.has(path2)).toBe(true);
        });

        it('should remove multiple paths in batch', () => {
            const group = new TestableTimelineGroup(undefined, [path1, path2]);
            group.removePaths(path1, path2);

            expect(group.paths.size).toBe(0);
        });

        it('should handle removing non-existent path', () => {
            const group = new TestableTimelineGroup(undefined, [path1]);
            group.removePaths(path2);

            expect(group.paths.size).toBe(1);
            expect(group.paths.has(path1)).toBe(true);
        });

        it('should handle empty arguments', () => {
            const group = new TestableTimelineGroup(undefined, [path1]);
            group.removePaths();

            expect(group.paths.size).toBe(1);
        });
    });

    describe('getPoints', () => {
        it('should return array of all points', () => {
            const group = new TestableTimelineGroup([point1, point2]);
            const points = group.getPoints();

            expect(Array.isArray(points)).toBe(true);
            expect(points).toHaveLength(2);
            expect(points).toContain(point1);
            expect(points).toContain(point2);
        });

        it('should return empty array when no points', () => {
            const group = new TestableTimelineGroup();
            const points = group.getPoints();

            expect(points).toEqual([]);
        });

        it('should return references to actual points', () => {
            const group = new TestableTimelineGroup([point1]);
            const points = group.getPoints();

            expect(points[0]).toBe(point1);
        });
    });

    describe('getPaths', () => {
        it('should return array of all paths', () => {
            const group = new TestableTimelineGroup(undefined, [path1, path2]);
            const paths = group.getPaths();

            expect(Array.isArray(paths)).toBe(true);
            expect(paths).toHaveLength(2);
            expect(paths).toContain(path1);
            expect(paths).toContain(path2);
        });

        it('should return empty array when no paths', () => {
            const group = new TestableTimelineGroup();
            const paths = group.getPaths();

            expect(paths).toEqual([]);
        });

        it('should return references to actual paths', () => {
            const group = new TestableTimelineGroup(undefined, [path1]);
            const paths = group.getPaths();

            expect(paths[0]).toBe(path1);
        });
    });

    describe('getStatistics', () => {
        it('should return statistics with correct counts', () => {
            const group = new TestableTimelineGroup([point1, point2, point3], [path1, path2]);
            const stats = group.getStatistics();

            expect(stats).toBeInstanceOf(Statistics);
            expect(stats.totalPoints).toBe(3);
            expect(stats.totalPaths).toBe(2);
        });

        it('should return zero statistics for empty group', () => {
            const group = new TestableTimelineGroup();
            const stats = group.getStatistics();

            expect(stats.totalPoints).toBe(0);
            expect(stats.totalPaths).toBe(0);
        });

        it('should return statistics with only points', () => {
            const group = new TestableTimelineGroup([point1, point2]);
            const stats = group.getStatistics();

            expect(stats.totalPoints).toBe(2);
            expect(stats.totalPaths).toBe(0);
        });

        it('should return statistics with only paths', () => {
            const group = new TestableTimelineGroup(undefined, [path1, path2]);
            const stats = group.getStatistics();

            expect(stats.totalPoints).toBe(0);
            expect(stats.totalPaths).toBe(2);
        });

        it('should reflect changes after adding points', () => {
            const group = new TestableTimelineGroup();
            group.addPoints(point1);

            const stats = group.getStatistics();
            expect(stats.totalPoints).toBe(1);
        });

        it('should reflect changes after removing points', () => {
            const group = new TestableTimelineGroup([point1, point2]);
            group.removePoints(point1);

            const stats = group.getStatistics();
            expect(stats.totalPoints).toBe(1);
        });
    });

    describe('readonly sets', () => {
        it('should expose points as readonly set', () => {
            const group = new TimelineGroup([point1]);

            expect(group.points).toBeInstanceOf(Set);
            expect(group.points.has(point1)).toBe(true);
        });

        it('should expose paths as readonly set', () => {
            const group = new TimelineGroup(undefined, [path1]);

            expect(group.paths).toBeInstanceOf(Set);
            expect(group.paths.has(path1)).toBe(true);
        });

        it('should allow direct set access (readonly)', () => {
            const group = new TimelineGroup([point1, point2], [path1]);

            expect(group.points.size).toBe(2);
            expect(group.paths.size).toBe(1);
        });
    });
});

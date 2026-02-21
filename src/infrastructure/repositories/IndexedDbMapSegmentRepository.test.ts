import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbMapSegmentRepository } from './IndexedDbMapSegmentRepository';
import { MapSegment } from '../../domains/map/MapSegment';
import { TimelinePoint } from '../../domains/map/TimelinePoint';
import { TimelinePath } from '../../domains/map/TimelinePath';

/**
 * Reset indexedDB between tests so each test gets a clean database.
 * fake-indexeddb/auto patches the global; reassigning it gives a fresh instance.
 */
beforeEach(() => {
    const { IDBFactory } = require('fake-indexeddb');
    (globalThis as any).indexedDB = new IDBFactory();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePoint(lat: number, lon: number): TimelinePoint {
    return new TimelinePoint(lat, lon, new Date('2024-01-01T00:00:00Z'));
}

function makeSegmentWithPoints(index: number, ...points: TimelinePoint[]): MapSegment {
    const segment = new MapSegment(index);
    segment.addPoints(...points);
    return segment;
}

function makeSegmentWithPaths(index: number, ...paths: TimelinePath[]): MapSegment {
    const segment = new MapSegment(index);
    segment.addPaths(...paths);
    return segment;
}

// ---------------------------------------------------------------------------
// openDb
// ---------------------------------------------------------------------------

describe('IndexedDbMapSegmentRepository.openDb', () => {
    it('resolves with a repository instance', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        expect(repo).toBeInstanceOf(IndexedDbMapSegmentRepository);
    });

    it('is callable multiple times and each call returns an independent instance', async () => {
        const repo1 = await IndexedDbMapSegmentRepository.openDb();
        const repo2 = await IndexedDbMapSegmentRepository.openDb();
        expect(repo1).not.toBe(repo2);
    });
});

// ---------------------------------------------------------------------------
// saveSegment / loadSegment round-trip
// ---------------------------------------------------------------------------

describe('saveSegment / loadSegment', () => {
    it('saves and loads an empty segment', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const segment = new MapSegment(0);

        await repo.saveSegment(segment);
        const loaded = await repo.loadSegment(0);

        expect(loaded.getPoints()).toHaveLength(0);
        expect(loaded.getPaths()).toHaveLength(0);
    });

    it('saves and loads a segment with points', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const p1 = makePoint(48.8566, 2.3522);
        const p2 = makePoint(51.5074, -0.1278);
        const segment = makeSegmentWithPoints(1, p1, p2);

        await repo.saveSegment(segment);
        const loaded = await repo.loadSegment(1);

        const points = loaded.getPoints();
        expect(points).toHaveLength(2);
        expect(points.map(p => p.lat).sort()).toEqual([48.8566, 51.5074].sort());
        expect(points.map(p => p.lon).sort()).toEqual([2.3522, -0.1278].sort());
    });

    it('preserves point timestamps', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const ts = new Date('2023-06-15T12:30:00Z');
        const point = new TimelinePoint(52.52, 13.405, ts);
        const segment = makeSegmentWithPoints(2, point);

        await repo.saveSegment(segment);
        const loaded = await repo.loadSegment(2);

        const [loadedPoint] = loaded.getPoints();
        expect(loadedPoint.timestamp.toISOString()).toBe(ts.toISOString());
    });

    it('saves and loads a segment with paths', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const p1 = makePoint(48.8566, 2.3522);
        const p2 = makePoint(51.5074, -0.1278);
        const path = new TimelinePath(p1, p2);
        const segment = makeSegmentWithPaths(3, path);

        await repo.saveSegment(segment);
        const loaded = await repo.loadSegment(3);

        const paths = loaded.getPaths();
        expect(paths).toHaveLength(1);
        expect(paths[0].a.lat).toBe(p1.lat);
        expect(paths[0].b.lat).toBe(p2.lat);
    });

    it('saves and loads a segment with both points and paths', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const p1 = makePoint(40.7128, -74.006);
        const p2 = makePoint(34.0522, -118.2437);
        const path = new TimelinePath(p1, p2);
        const segment = new MapSegment(4);
        segment.addPoints(p1, p2);
        segment.addPaths(path);

        await repo.saveSegment(segment);
        const loaded = await repo.loadSegment(4);

        expect(loaded.getPoints()).toHaveLength(2);
        expect(loaded.getPaths()).toHaveLength(1);
    });

    it('overwrites an existing segment when saved with the same id', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const original = makeSegmentWithPoints(5, makePoint(10, 10));
        await repo.saveSegment(original);

        const updated = makeSegmentWithPoints(5, makePoint(20, 20), makePoint(30, 30));
        await repo.saveSegment(updated);

        const loaded = await repo.loadSegment(5);
        expect(loaded.getPoints()).toHaveLength(2);
    });

    it('stores different segments independently under different ids', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const seg1 = makeSegmentWithPoints(10, makePoint(1, 1));
        const seg2 = makeSegmentWithPoints(11, makePoint(2, 2), makePoint(3, 3));

        await repo.saveSegment(seg1);
        await repo.saveSegment(seg2);

        const loaded1 = await repo.loadSegment(10);
        const loaded2 = await repo.loadSegment(11);

        expect(loaded1.getPoints()).toHaveLength(1);
        expect(loaded2.getPoints()).toHaveLength(2);
    });
});

// ---------------------------------------------------------------------------
// loadSegment — edge cases
// ---------------------------------------------------------------------------

describe('loadSegment edge cases', () => {
    it('returns an empty segment when id does not exist', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        const loaded = await repo.loadSegment(9999);

        expect(loaded.getPoints()).toHaveLength(0);
        expect(loaded.getPaths()).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('clear', () => {
    it('removes all saved segments', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        await repo.saveSegment(makeSegmentWithPoints(0, makePoint(1, 1)));
        await repo.saveSegment(makeSegmentWithPoints(1, makePoint(2, 2)));

        await repo.clear();

        const loaded0 = await repo.loadSegment(0);
        const loaded1 = await repo.loadSegment(1);
        expect(loaded0.getPoints()).toHaveLength(0);
        expect(loaded1.getPoints()).toHaveLength(0);
    });

    it('allows saving new segments after clearing', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        await repo.saveSegment(makeSegmentWithPoints(0, makePoint(1, 1)));
        await repo.clear();

        const fresh = makeSegmentWithPoints(0, makePoint(5, 5));
        await repo.saveSegment(fresh);
        const loaded = await repo.loadSegment(0);

        expect(loaded.getPoints()).toHaveLength(1);
        expect(loaded.getPoints()[0].lat).toBe(5);
    });

    it('is a no-op on an already-empty store', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        await expect(repo.clear()).resolves.toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Schema upgrade
// ---------------------------------------------------------------------------

describe('schema upgrade', () => {
    it('opens successfully on a fresh database', async () => {
        const repo = await IndexedDbMapSegmentRepository.openDb();
        expect(repo).toBeInstanceOf(IndexedDbMapSegmentRepository);
    });
});

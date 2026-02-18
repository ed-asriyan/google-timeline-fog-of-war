/**
 * TimelineGroup Base Class
 * Shared base class for managing collections of points and paths
 */

import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { MapBounds, Statistics } from './value-objects';

/**
 * Base class for managing collections of points and paths
 * Used by TimelineData and MapSegment
 */
export class TimelineGroup {
    private _points: TimelinePoint[];
    private _paths: TimelinePath[];

    constructor(points: readonly TimelinePoint[] = [], paths: readonly TimelinePath[] = []) {
        this._points = [...points];
        this._paths = [...paths];
    }

    get points(): ReadonlyArray<TimelinePoint> {
        return this._points;
    }

    get paths(): ReadonlyArray<TimelinePath> {
        return this._paths;
    }

    /**
     * Add points to this group (stores references, not copies, without deduplication).
     * Call removeDuplicates() after bulk loads to eliminate duplicates.
     */
    addPoints(...points: TimelinePoint[]): void {
        this._points.push(...points);
    }

    /**
     * Add paths to this group (stores references, not copies, without deduplication).
     * Call removeDuplicates() after bulk loads to eliminate duplicates.
     */
    addPaths(...paths: TimelinePath[]): void {
        this._paths.push(...paths);
    }

    /**
     * Remove points from this group (batch operation for efficiency)
     */
    removePoints(...points: TimelinePoint[]): void {
        const keys = new Set(points.map(p => p.key()));
        this._points = this._points.filter(p => !keys.has(p.key()));
    }

    /**
     * Remove paths from this group (batch operation for efficiency)
     */
    removePaths(...paths: TimelinePath[]): void {
        const keys = new Set(paths.map(p => p.key()));
        this._paths = this._paths.filter(p => !keys.has(p.key()));
    }

    /**
     * Get all points in this group
     */
    getPoints(): readonly TimelinePoint[] {
        return [...this._points];
    }

    /**
     * Get all paths in this group
     */
    getPaths(): readonly TimelinePath[] {
        return [...this._paths];
    }

    /**
     * Get statistics about points and paths in this group
     */
    getStatistics(): Statistics {
        return new Statistics(this._points.length, this._paths.length);
    }

    /**
     * Merge points and paths from another TimelineGroup into this one (no deduplication).
     */
    mergeFrom(other: TimelineGroup): void {
        this._points.push(...other._points);
        this._paths.push(...other._paths);
    }

    /**
     * Remove duplicate points and paths by key.
     * Should be called by the application layer after loading a new file.
     */
    removeDuplicates(): void {
        const seenPoints = new Set<string>();
        this._points = this._points.filter(p => {
            const k = p.key();
            if (seenPoints.has(k)) return false;
            seenPoints.add(k);
            return true;
        });

        const seenPaths = new Set<string>();
        this._paths = this._paths.filter(p => {
            const k = p.key();
            if (seenPaths.has(k)) return false;
            seenPaths.add(k);
            return true;
        });
    }

    /**
     * Query points and paths visible in viewport bounds
     * Returns only data within the specified geographical area
     */
    queryViewport(bounds: MapBounds): TimelineGroup {
        const points = this.getPoints().filter((p) => {
            return (
                p.lat >= bounds.a.lat &&
                p.lat <= bounds.b.lat &&
                p.lon >= bounds.a.lon &&
                p.lon <= bounds.b.lon
            );
        });

        const paths = this.getPaths().filter((path) => {
            // Include path if either endpoint is within bounds
            return (
                (path.a.lat >= bounds.a.lat &&
                    path.a.lat <= bounds.b.lat &&
                    path.a.lon >= bounds.a.lon &&
                    path.a.lon <= bounds.b.lon) ||
                (path.b.lat >= bounds.a.lat &&
                    path.b.lat <= bounds.b.lat &&
                    path.b.lon >= bounds.a.lon &&
                    path.b.lon <= bounds.b.lon)
            );
        });

        return new TimelineGroup(points, paths);
    }

    toJson(): any {
        return {
            points: this.getPoints().map(p => p.toJson()),
            paths: this.getPaths().map(p => p.toJson())
        };
    }

    static fromJson(json: any): TimelineGroup {
        const points = json.points.map((p: any) => TimelinePoint.fromJson(p));
        const paths = json.paths.map((p: any) => TimelinePath.fromJson(p));
        return new TimelineGroup(points, paths);
    }
}

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
    private readonly _points: Map<string, TimelinePoint>;
    private readonly _paths: Map<string, TimelinePath>;

    constructor(points: readonly TimelinePoint[] = [], paths: readonly TimelinePath[] = []) {
        this._points = new Map(points.map(p => [p.key(), p]));
        this._paths = new Map(paths.map(p => [p.key(), p]));
    }

    get points(): Set<TimelinePoint> {
        return new Set(this._points.values());
    }

    get paths(): Set<TimelinePath> {
        return new Set(this._paths.values());
    }

    /**
     * Add points to this group (stores references, not copies)
     */
    addPoints(...points: TimelinePoint[]): void {
        for (const p of points) this._points.set(p.key(), p);
    }

    /**
     * Add paths to this group (stores references, not copies)
     */
    addPaths(...paths: TimelinePath[]): void {
        for (const p of paths) this._paths.set(p.key(), p);
    }

    /**
     * Remove points from this group (batch operation for efficiency)
     */
    removePoints(...points: TimelinePoint[]): void {
        for (const p of points) this._points.delete(p.key());
    }

    /**
     * Remove paths from this group (batch operation for efficiency)
     */
    removePaths(...paths: TimelinePath[]): void {
        for (const p of paths) this._paths.delete(p.key());
    }

    /**
     * Get all points in this group
     */
    getPoints(): readonly TimelinePoint[] {
        return Array.from(this._points.values());
    }

    /**
     * Get all paths in this group
     */
    getPaths(): readonly TimelinePath[] {
        return Array.from(this._paths.values());
    }

    /**
     * Get statistics about points and paths in this group
     */
    getStatistics(): Statistics {
        return new Statistics(this._points.size, this._paths.size);
    }

    /**
     * Merge points and paths from another TimelineGroup into this one
     */
    mergeFrom(other: TimelineGroup): void {
        this.addPoints(...other.getPoints());
        this.addPaths(...other.getPaths());
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

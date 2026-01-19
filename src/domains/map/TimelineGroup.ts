/**
 * TimelineGroup Base Class
 * Shared base class for managing collections of points and paths
 */

import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { Statistics } from './value-objects';

/**
 * Base class for managing collections of points and paths
 * Used by TimelineData and MapSegment
 */
export class TimelineGroup {
    readonly points: Set<TimelinePoint> = new Set();
    readonly paths: Set<TimelinePath> = new Set();

    constructor(points?: TimelinePoint[], paths?: TimelinePath[]) {
        if (points) {
            points.forEach((p) => this.points.add(p));
        }
        if (paths) {
            paths.forEach((p) => this.paths.add(p));
        }
    }

    static createEmpty(): TimelineGroup {
        return new TimelineGroup();
    }

    /**
     * Add points to this group (stores references, not copies)
     */
    protected addPoints(...points: TimelinePoint[]): void {
        for (let p of points) this.points.add(p);
    }

    /**
     * Add paths to this group (stores references, not copies)
     */
    protected addPaths(...paths: TimelinePath[]): void {
        for (let p of paths) this.paths.add(p);
    }

    /**
     * Remove points from this group (batch operation for efficiency)
     */
    protected removePoints(...points: TimelinePoint[]): void {
        for (let p of points) this.points.delete(p);
    }

    /**
     * Remove paths from this group (batch operation for efficiency)
     */
    protected removePaths(...paths: TimelinePath[]): void {
        for (let p of paths) this.paths.delete(p);
    }

    /**
     * Get all points in this group
     */
    protected getPoints(): TimelinePoint[] {
        return Array.from(this.points);
    }

    /**
     * Get all paths in this group
     */
    protected getPaths(): TimelinePath[] {
        return Array.from(this.paths);
    }

    /**
     * Get statistics about points and paths in this group
     */
    getStatistics(): Statistics {
        return new Statistics(this.points.size, this.paths.size);
    }
}

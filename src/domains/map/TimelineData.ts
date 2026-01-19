/**
 * TimelineData Entity
 * Represents all points and paths imported from a specific file
 */

import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { TimelineGroup } from './TimelineGroup';

/**
 * Represents all points imported from a specific file
 */
export class TimelineData extends TimelineGroup {
    constructor(points: TimelinePoint[], paths: TimelinePath[]) {
        super(points, paths);
    }

    // Expose protected methods as public
    addPoints(...points: TimelinePoint[]): void {
        super.addPoints(...points);
    }

    addPaths(...paths: TimelinePath[]): void {
        super.addPaths(...paths);
    }

    removePoints(...points: TimelinePoint[]): void {
        super.removePoints(...points);
    }

    removePaths(...paths: TimelinePath[]): void {
        super.removePaths(...paths);
    }

    getPoints(): TimelinePoint[] {
        return super.getPoints();
    }

    getPaths(): TimelinePath[] {
        return super.getPaths();
    }
}

/**
 * MapSegment
 * Manages references to points and paths within a grid cell
 */

import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { TimelineGroup } from './TimelineGroup';
import { Statistics } from './value-objects';

export class MapSegment extends TimelineGroup {
    static createEmpty(): MapSegment {
        return new MapSegment();
    }

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

    getStatistics(): Statistics {
        return super.getStatistics();
    }
}

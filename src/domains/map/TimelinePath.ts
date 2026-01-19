/**
 * TimelinePath Entity
 * Represents movement from point A to point B
 */

import { TimelinePoint } from './TimelinePoint';

/**
 * Represents movement from point A to point B
 * Contains references to 2 LocationPoint objects
 */
export class TimelinePath {
    readonly a: TimelinePoint;
    readonly b: TimelinePoint;
    readonly length: number;

    constructor(a: TimelinePoint, b: TimelinePoint) {
        this.a = a;
        this.b = b;
        this.length = a.distanceTo(b);
    }
}

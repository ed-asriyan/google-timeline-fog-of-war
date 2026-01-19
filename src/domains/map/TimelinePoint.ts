/**
 * TimelinePoint Entity
 * Represents a point on the map at a specific time
 */

import { LocationPoint } from './value-objects';

/**
 * Represents a point on the map at a specific time
 * Performs validation (lat: [-90, 90], lon: [-180, 180])
 */
export class TimelinePoint extends LocationPoint {
    readonly timestamp: Date;

    constructor(lat: number, lon: number, timestamp: Date) {
        super(lat, lon);
        this.timestamp = timestamp;
    }
}

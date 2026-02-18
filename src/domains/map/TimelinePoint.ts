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

    key(): string {
        return `${this.lat},${this.lon},${this.timestamp.getTime()}`;
    }

    equals(other: TimelinePoint): boolean {
        return this.lat === other.lat && this.lon === other.lon && this.timestamp.getTime() === other.timestamp.getTime();
    }

    toJson(): any {
        return {
            lat: this.lat,
            lon: this.lon,
            timestamp: this.timestamp.toISOString(),
        };
    }

    static fromJson(json: any): TimelinePoint {
        return new TimelinePoint(json.lat, json.lon, new Date(json.timestamp));
    }
}

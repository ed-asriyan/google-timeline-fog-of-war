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

    key(): string {
        return `${this.a.key()}=>${this.b.key()}`;
    }

    equals(other: TimelinePath): boolean {
        return this.a.equals(other.a) && this.b.equals(other.b);
    }

    toJson(): any {
        return {
            a: this.a.toJson(),
            b: this.b.toJson()
        };
    }

    static fromJson(json: any): TimelinePath {
        const a = TimelinePoint.fromJson(json.a);
        const b = TimelinePoint.fromJson(json.b);
        return new TimelinePath(a, b);
    }
}

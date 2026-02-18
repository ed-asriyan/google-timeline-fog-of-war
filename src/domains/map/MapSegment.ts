/**
 * MapSegment
 * Manages references to points and paths within a grid cell
 */

import { TimelineGroup } from './TimelineGroup';

export class MapSegment extends TimelineGroup {
    readonly index: number;

    constructor(index: number) {
        super();
        this.index = index;
    }
}

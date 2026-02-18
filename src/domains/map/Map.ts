/**
 * Map Aggregate Root
 * Manages all spatial data in the application
 */

import { MapBounds } from './value-objects';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';

/**
 * Map Aggregate Root
 * Manages all spatial data in the application
 * Organizes data into MapSegment grid cells for efficient viewport queries
 */
export class Map {
    private static readonly LAT_STEP_COUNTS: number = 180;
    private static readonly LON_STEP_COUNTS: number = 360;

    getSegmentIdsForBound(bounds: MapBounds): number[] {
        const ids = new Set<number>();
        const minLat = Math.min(bounds.a.lat, bounds.b.lat);
        const maxLat = Math.max(bounds.a.lat, bounds.b.lat);
        const minLon = Math.min(bounds.a.lon, bounds.b.lon);
        const maxLon = Math.max(bounds.a.lon, bounds.b.lon);

        let startLatIndex = Math.floor(minLat + 90);
        let endLatIndex = Math.floor(maxLat + 90);
        let startLonIndex = Math.floor(minLon + 180);
        let endLonIndex = Math.floor(maxLon + 180);

        if (startLatIndex >= Map.LAT_STEP_COUNTS) startLatIndex = Map.LAT_STEP_COUNTS - 1;
        if (endLatIndex >= Map.LAT_STEP_COUNTS) endLatIndex = Map.LAT_STEP_COUNTS - 1;
        if (startLonIndex >= Map.LON_STEP_COUNTS) startLonIndex = Map.LON_STEP_COUNTS - 1;
        if (endLonIndex >= Map.LON_STEP_COUNTS) endLonIndex = Map.LON_STEP_COUNTS - 1;
        
        if (startLatIndex < 0) startLatIndex = 0;
        if (endLatIndex < 0) endLatIndex = 0;
        if (startLonIndex < 0) startLonIndex = 0;
        if (endLonIndex < 0) endLonIndex = 0;

        for (let latIndex = startLatIndex; latIndex <= endLatIndex; latIndex++) {
            for (let lonIndex = startLonIndex; lonIndex <= endLonIndex; lonIndex++) {
                ids.add(latIndex * Map.LON_STEP_COUNTS + lonIndex);
            }
        }
        
        return Array.from(ids);
    }

    getSegmentIdForPoint(point: TimelinePoint): number {
        let latIndex = Math.floor(point.lat + 90);
        let lonIndex = Math.floor(point.lon + 180);

        if (latIndex >= Map.LAT_STEP_COUNTS) latIndex = Map.LAT_STEP_COUNTS - 1;
        if (lonIndex >= Map.LON_STEP_COUNTS) lonIndex = Map.LON_STEP_COUNTS - 1;
        
        if (latIndex < 0) latIndex = 0;
        if (lonIndex < 0) lonIndex = 0;

        return latIndex * Map.LON_STEP_COUNTS + lonIndex;
    }

    getSegmentIdForPoints(points: Iterable<TimelinePoint>): Record<number, TimelinePoint[]> {
        const segments: Record<number, TimelinePoint[]> = {};
        for (const point of points) {
            const segmentId = this.getSegmentIdForPoint(point);
            if (!segments[segmentId]) {
                segments[segmentId] = [];
            }
            segments[segmentId].push(point);
        }
        return segments;
    }

    getSegmentIdsForPath(path: TimelinePath): number[] {
        const bounds = new MapBounds(path.a, path.b);
        return this.getSegmentIdsForBound(bounds);
    }


    getSegmentIdsForPaths(paths: Iterable<TimelinePath>): Record<number, TimelinePath[]> {
        const segments: Record<number, TimelinePath[]> = {};
        for (const path of paths) {
            const segmentIds = this.getSegmentIdsForPath(path);
            for (const segmentId of segmentIds) {
                if (!segments[segmentId]) {
                    segments[segmentId] = [];
                }
                segments[segmentId].push(path);
            }
        }
        return segments;
    }
}

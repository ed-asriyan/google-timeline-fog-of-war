/**
 * Value Objects for Map Domain
 * Immutable objects representing domain concepts without identity
 */

import { MAX_LATITUDE, MIN_LATITUDE, MAX_LONGITUDE, MIN_LONGITUDE } from './consts';

const R = 6371; // Earth's radius in kilometers

/**
 * Represents a geographical point with latitude and longitude
 */
export class LocationPoint {
    readonly lat: number;
    readonly lon: number;

    constructor(lat: number, lon: number) {
        if (lat < MIN_LATITUDE || lat > MAX_LATITUDE) {
            throw new Error(`Latitude ${lat} out of bounds (${MIN_LATITUDE} to ${MAX_LATITUDE})`);
        }
        if (lon < MIN_LONGITUDE || lon > MAX_LONGITUDE) {
            throw new Error(`Longitude ${lon} out of bounds (${MIN_LONGITUDE} to ${MAX_LONGITUDE})`);
        }

        this.lat = lat;
        this.lon = lon;
    }

    /**
     * Calculate distance to another point in kilometers using Haversine formula
     */
    distanceTo(other: LocationPoint): number {
        // Convert to radians
        const lat1 = this.lat * Math.PI / 180;
        const lat2 = other.lat * Math.PI / 180;
        const deltaLat = (other.lat - this.lat) * Math.PI / 180;
        const deltaLon = (other.lon - this.lon) * Math.PI / 180;

        // Haversine formula
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}

/**
 * Represents geographical bounds of a viewport
 */
export class MapBounds {
    readonly a: LocationPoint;
    readonly b: LocationPoint;

    constructor(a: LocationPoint, b: LocationPoint) {
        this.a = a;
        this.b = b;
    }
}

export class Statistics {
    readonly totalPoints: number;
    readonly totalPaths: number;

    constructor(totalPoints: number, totalPaths: number) {
        if (totalPoints < 0) {
            throw new Error('Total points cannot be negative');
        }
        if (totalPaths < 0) {
            throw new Error('Total paths cannot be negative');
        }

        this.totalPoints = totalPoints;
        this.totalPaths = totalPaths;
    }
}
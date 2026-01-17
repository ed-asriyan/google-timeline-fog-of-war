// Domain Layer: Domain Services

import { LocationPoint, LocationSegment } from './entities';

/**
 * Service for geographic calculations
 */
export class GeographyService {
  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLon = (point2.lon - point1.lon) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * (Math.PI / 180)) *
        Math.cos(point2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Create a segment between two points
   */
  static createSegment(start: LocationPoint, end: LocationPoint): LocationSegment {
    const distance = this.calculateDistance(start, end);
    return new LocationSegment(start, end, distance);
  }
}

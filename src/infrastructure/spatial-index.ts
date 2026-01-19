// Infrastructure Layer: Spatial indexing
// Note: Spatial indexing is now handled by the Map aggregate root in the domain layer.
// This file is kept for backwards compatibility but is deprecated.
// Use Map.queryViewport() instead.

import { TimelinePoint, TimelinePath } from '../domains/map';

/**
 * @deprecated Use Map.queryViewport() from the domain layer instead
 */
export class SpatialIndex {
  constructor(_points: TimelinePoint[], _paths: TimelinePath[]) {
    console.warn('SpatialIndex is deprecated. Use Map.queryViewport() instead.');
  }

  queryRegion(
    _minLat: number,
    _maxLat: number,
    _minLon: number,
    _maxLon: number
  ): { points: TimelinePoint[]; paths: TimelinePath[] } {
    console.warn('SpatialIndex.queryRegion is deprecated. Use Map.queryViewport() instead.');
    return { points: [], paths: [] };
  }
}

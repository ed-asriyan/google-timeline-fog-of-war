// Infrastructure Layer: Spatial indexing for efficient viewport queries

import { LocationPoint, LocationSegment } from '../domain/entities';

const GRID_SIZE = 1; // degrees (approximately 111km at equator)

interface GridCell {
  points: LocationPoint[];
  segments: LocationSegment[];
}

export class SpatialIndex {
  private grid: Map<string, GridCell> = new Map();

  constructor(points: LocationPoint[], segments: LocationSegment[]) {
    this.buildIndex(points, segments);
  }

  private getCellKey(lat: number, lon: number): string {
    const cellLat = Math.floor(lat / GRID_SIZE);
    const cellLon = Math.floor(lon / GRID_SIZE);
    return `${cellLat},${cellLon}`;
  }

  private buildIndex(points: LocationPoint[], segments: LocationSegment[]) {
    this.grid.clear();

    // Index points
    for (const point of points) {
      const key = this.getCellKey(point.lat, point.lon);
      if (!this.grid.has(key)) {
        this.grid.set(key, { points: [], segments: [] });
      }
      this.grid.get(key)!.points.push(point);
    }

    // Index segments (add to all cells they might intersect)
    for (const segment of segments) {
      const minLat = Math.min(segment.start.lat, segment.end.lat);
      const maxLat = Math.max(segment.start.lat, segment.end.lat);
      const minLon = Math.min(segment.start.lon, segment.end.lon);
      const maxLon = Math.max(segment.start.lon, segment.end.lon);

      const cellMinLat = Math.floor(minLat / GRID_SIZE);
      const cellMaxLat = Math.floor(maxLat / GRID_SIZE);
      const cellMinLon = Math.floor(minLon / GRID_SIZE);
      const cellMaxLon = Math.floor(maxLon / GRID_SIZE);

      for (let lat = cellMinLat; lat <= cellMaxLat; lat++) {
        for (let lon = cellMinLon; lon <= cellMaxLon; lon++) {
          const key = `${lat},${lon}`;
          if (!this.grid.has(key)) {
            this.grid.set(key, { points: [], segments: [] });
          }
          this.grid.get(key)!.segments.push(segment);
        }
      }
    }
  }

  queryRegion(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): { points: LocationPoint[]; segments: LocationSegment[] } {
    const cellMinLat = Math.floor(minLat / GRID_SIZE);
    const cellMaxLat = Math.floor(maxLat / GRID_SIZE);
    const cellMinLon = Math.floor(minLon / GRID_SIZE);
    const cellMaxLon = Math.floor(maxLon / GRID_SIZE);

    const pointsSet = new Set<LocationPoint>();
    const segmentsSet = new Set<LocationSegment>();

    for (let lat = cellMinLat; lat <= cellMaxLat; lat++) {
      for (let lon = cellMinLon; lon <= cellMaxLon; lon++) {
        const key = `${lat},${lon}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.points.forEach(p => pointsSet.add(p));
          cell.segments.forEach(s => segmentsSet.add(s));
        }
      }
    }

    return {
      points: Array.from(pointsSet),
      segments: Array.from(segmentsSet),
    };
  }
}

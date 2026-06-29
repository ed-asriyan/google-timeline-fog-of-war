import {
  Bounds,
  MapApp,
  MapSegmentRepository,
  ParserPort,
  Statistics,
  TimelinePoint,
  TimelinePath,
  Settings,
  SettingsRepository,
} from "./ports";

export class Map implements MapApp {
  private static readonly LAT_STEP_COUNTS: number = 180;
  private static readonly LON_STEP_COUNTS: number = 360;

  private parser: ParserPort;
  private segments: MapSegmentRepository;
  private settings: SettingsRepository;

  constructor(segments: MapSegmentRepository, parser: ParserPort, settings: SettingsRepository) {
    this.segments = segments;
    this.parser = parser;
    this.settings = settings;
  }

  async getSettings(): Promise<Settings> {
    return this.settings.loadSettings();
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.settings.saveSettings(settings);
  }

  private calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
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

  private calculatePathLengthKm(path: TimelinePath): number {
    let length = 0;
    for (let i = 1; i < path.points.length; i++) {
        length += this.calculateDistance(path.points[i - 1], path.points[i]);
    }
    return length;
  }

  async loadPoints(data: string): Promise<void> {
    const group = this.parser.parse(data);

    // Group paths by segment
    const pathsBySegment: Record<number, typeof group.paths> = {};
    for (const path of group.paths) {
      const segmentIds = this.getSegmentIdsForPath(path);
      for (const segmentId of segmentIds) {
        if (!pathsBySegment[segmentId]) {
          pathsBySegment[segmentId] = [];
        }
        pathsBySegment[segmentId].push(path);
      }
    }

    const pointsBySegment = this.getSegmentIdForPoints(group.points);

    // Get all unique segment IDs that we need to update
    const allSegmentIds = new Set([
      ...Object.keys(pointsBySegment).map(Number),
      ...Object.keys(pathsBySegment).map(Number)
    ]);

    for (const segmentId of allSegmentIds) {
      let segment = await this.segments.loadSegment(segmentId);
      if (!segment) {
        segment = { index: segmentId, group: { points: [], paths: [] } };
      }
      
      const newPoints = pointsBySegment[segmentId] || [];
      const newPaths = pathsBySegment[segmentId] || [];

      segment.group.points.push(...newPoints);
      segment.group.paths.push(...newPaths);
      
      await this.segments.saveSegment(segment);
    }
  }

  async clear(): Promise<void> {
    await this.segments.clear();
  }

  async getPoints(bounds: Bounds): Promise<TimelinePoint[]> {
    const segmentIds = this.getSegmentIdsForBound(bounds);
    const settings = await this.settings.loadSettings();
    const result: TimelinePoint[] = [];
    const seenPaths = new Set<string>();

    for (const id of segmentIds) {
      const segment = await this.segments.loadSegment(id);
      if (segment && segment.group) {
        if (segment.group.points) {
          result.push(...segment.group.points);
        }
        if (segment.group.paths) {
          for (const path of segment.group.paths) {
            if (path.points.length < 2) continue;
            const lengthKm = this.calculatePathLengthKm(path);
            if (lengthKm > settings.maxPathDistanceKm) {
              const first = path.points[0];
              const last = path.points[path.points.length - 1];
              const hash = `${first.lat},${first.lon},${first.timestamp}-${last.lat},${last.lon},${last.timestamp}`;
              if (!seenPaths.has(hash)) {
                seenPaths.add(hash);
                result.push(first, last);
              }
            }
          }
        }
      }
    }
    return result;
  }

  async getPaths(bounds: Bounds): Promise<TimelinePath[]> {
    const segmentIds = this.getSegmentIdsForBound(bounds);
    const settings = await this.settings.loadSettings();
    const result: TimelinePath[] = [];
    // To prevent duplicate paths from multiple segments
    const seenPaths = new Set<string>();
    
    for (const id of segmentIds) {
      const segment = await this.segments.loadSegment(id);
      if (segment && segment.group && segment.group.paths) {
        for (const path of segment.group.paths) {
          if (path.points.length < 2) continue;
          const lengthKm = this.calculatePathLengthKm(path);
          if (lengthKm <= settings.maxPathDistanceKm) {
            // A simple hash of the first and last point to avoid duplicates
            const first = path.points[0];
            const last = path.points[path.points.length - 1];
            const hash = `${first.lat},${first.lon},${first.timestamp}-${last.lat},${last.lon},${last.timestamp}`;
            if (!seenPaths.has(hash)) {
              seenPaths.add(hash);
              result.push(path);
            }
          }
        }
      }
    }
    return result;
  }

  async getStatistics(bounds: Bounds): Promise<Statistics> {
    const segmentIds = this.getSegmentIdsForBound(bounds);
    const settings = await this.settings.loadSettings();
    let totalPoints = 0;
    let totalPaths = 0;

    const seenPaths = new Set<string>();

    for (const id of segmentIds) {
      const segment = await this.segments.loadSegment(id);
      if (segment && segment.group) {
        totalPoints += segment.group.points?.length || 0;
        
        if (segment.group.paths) {
          for (const path of segment.group.paths) {
            if (path.points.length < 2) continue;
            
            const first = path.points[0];
            const last = path.points[path.points.length - 1];
            const hash = `${first.lat},${first.lon},${first.timestamp}-${last.lat},${last.lon},${last.timestamp}`;
            
            if (!seenPaths.has(hash)) {
              seenPaths.add(hash);
              const lengthKm = this.calculatePathLengthKm(path);
              if (lengthKm > settings.maxPathDistanceKm) {
                totalPoints += 2;
              } else {
                totalPaths += 1;
              }
            }
          }
        }
      }
    }
    return { totalPoints, totalPaths };
  }

  private getSegmentIdsForBound(bounds: Bounds): number[] {
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

  private getSegmentIdForPoint(point: TimelinePoint): number {
    let latIndex = Math.floor(point.lat + 90);
    let lonIndex = Math.floor(point.lon + 180);

    if (latIndex >= Map.LAT_STEP_COUNTS) latIndex = Map.LAT_STEP_COUNTS - 1;
    if (lonIndex >= Map.LON_STEP_COUNTS) lonIndex = Map.LON_STEP_COUNTS - 1;

    if (latIndex < 0) latIndex = 0;
    if (lonIndex < 0) lonIndex = 0;

    return latIndex * Map.LON_STEP_COUNTS + lonIndex;
  }

  private getSegmentIdsForPath(path: { points: TimelinePoint[] }): number[] {
    if (path.points.length === 0) return [];
    
    let minLat = path.points[0].lat;
    let maxLat = path.points[0].lat;
    let minLon = path.points[0].lon;
    let maxLon = path.points[0].lon;

    for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i];
        if (point.lat < minLat) minLat = point.lat;
        if (point.lat > maxLat) maxLat = point.lat;
        if (point.lon < minLon) minLon = point.lon;
        if (point.lon > maxLon) maxLon = point.lon;
    }

    return this.getSegmentIdsForBound({
        a: { lat: minLat, lon: minLon },
        b: { lat: maxLat, lon: maxLon }
    });
  }

  private getSegmentIdForPoints(points: Iterable<TimelinePoint>): Record<number, TimelinePoint[]> {
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
}

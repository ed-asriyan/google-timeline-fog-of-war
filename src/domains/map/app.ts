import {
  Bounds,
  LocationPoint,
  MapApp,
  MapSegmentRepository,
  ParserPort,
  Statistics,
  TimelinePoint,
  TimelinePath,
  Settings,
  SettingsRepository,
} from "./ports";
import { calculateDistance } from './geometry';
import { getSegmentIdsForBound, getSegmentIdsForPath, getSegmentIdForPoints } from './grid';

export class Map implements MapApp {
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

  async loadPoints(data: string, onProgress?: (status: 'parsing'|'saving', progress: number) => void): Promise<LocationPoint | null> {
    const group = this.parser.parse(data);

    let _last: TimelinePoint | null = null;
    for (const p of group.points) {
      if (!_last || p.timestamp > _last.timestamp) _last = p;
    }
    for (const path of group.paths) {
      for (const p of path.points) {
        if (!_last || p.timestamp > _last.timestamp) _last = p;
      }
    }
    const lastPoint: LocationPoint | null = _last !== null ? { lat: _last.lat, lon: _last.lon } : null;

    // Group paths by segment
    const pathsBySegment: Record<number, typeof group.paths> = {};
    for (const path of group.paths) {
      const segmentIds = getSegmentIdsForPath(path);
      for (const segmentId of segmentIds) {
        if (!pathsBySegment[segmentId]) {
          pathsBySegment[segmentId] = [];
        }
        pathsBySegment[segmentId].push(path);
      }
    }

    const pointsBySegment = getSegmentIdForPoints(group.points);

    // Get all unique segment IDs that we need to update
    const allSegmentIds = new Set([
      ...Object.keys(pointsBySegment).map(Number),
      ...Object.keys(pathsBySegment).map(Number)
    ]);

        const allSegmentIdsArray = Array.from(allSegmentIds);
    onProgress?.('saving', 10);
    const loadedSegments = await this.segments.loadSegments(allSegmentIdsArray);

    for (let i = 0; i < loadedSegments.length; i++) {
      if (i % 100 === 0) onProgress?.('saving', 10 + (i / loadedSegments.length) * 80);
      const segment = loadedSegments[i];
      const segmentId = segment.index;
      
      const newPoints = pointsBySegment[segmentId] || [];
      const newPaths = pathsBySegment[segmentId] || [];

      segment.group.points.push(...newPoints);
      segment.group.paths.push(...newPaths);
    }
    
    await this.segments.saveSegments(loadedSegments);
    onProgress?.('saving', 100);

    return lastPoint;
  }

  async clear(): Promise<void> {
    await this.segments.clear();
  }

  async getData(bounds: Bounds): Promise<{ points: TimelinePoint[]; paths: TimelinePath[] }> {
    const segmentIds = getSegmentIdsForBound(bounds);
    const settings = await this.settings.loadSettings();
    const points: TimelinePoint[] = [];
    const paths: TimelinePath[] = [];
    const seenPaths = new Set<string>();

    const segments = await this.segments.loadSegments(segmentIds);
    for (const segment of segments) {
      if (segment && segment.group) {
        if (segment.group.points) {
          points.push(...segment.group.points);
        }
        if (segment.group.paths) {
          for (const path of segment.group.paths) {
            if (path.points.length < 2) continue;
            
            const first = path.points[0];
            const last = path.points[path.points.length - 1];
            const hash = `${first.lat},${first.lon},${first.timestamp}-${last.lat},${last.lon},${last.timestamp}`;
            
            if (!seenPaths.has(hash)) {
              seenPaths.add(hash);
              
              let currentSubPath = [path.points[0]];
              
              for (let i = 1; i < path.points.length; i++) {
                const prev = path.points[i - 1];
                const curr = path.points[i];
                
                const linkLength = calculateDistance(prev, curr);
                const durationHours = Math.abs(curr.timestamp - prev.timestamp) / 3600000;
                let linkVelocity = 0;
                if (durationHours > 0) {
                  linkVelocity = linkLength / durationHours;
                } else if (linkLength > 0.05) {
                  linkVelocity = Infinity;
                }

                if (linkLength > settings.maxPathDistanceKm || linkVelocity > settings.maxPathVelocityKmh) {
                  if (currentSubPath.length > 1) {
                    paths.push({ points: currentSubPath });
                  } else {
                    points.push(currentSubPath[0]);
                  }
                  currentSubPath = [curr];
                } else {
                  currentSubPath.push(curr);
                }
              }

              if (currentSubPath.length > 1) {
                paths.push({ points: currentSubPath });
              } else {
                points.push(currentSubPath[0]);
              }
            }
          }
        }
      }
    }
    
    return { points, paths };
  }

  async getStatistics(bounds: Bounds): Promise<Statistics> {
    const segmentIds = getSegmentIdsForBound(bounds);
    let totalPoints = 0;
    let totalPaths = 0;

    const seenPaths = new Set<string>();

    const segments = await this.segments.loadSegments(segmentIds);
    for (const segment of segments) {
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
              totalPaths += 1;
            }
          }
        }
      }
    }
    return { totalPoints, totalPaths };
  }
}

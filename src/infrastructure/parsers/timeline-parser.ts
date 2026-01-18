// Infrastructure Layer: Timeline format parsers

import { LocationPoint, LocationSegment, TimelineData } from '../../domain/entities';
import { GeographyService } from '../../domain/services';

export type TimelineFormat = 'ios' | 'android' | 'unknown';

interface TimelineEntry {
  startTime?: string;
  endTime?: string;
  startLoc?: LocationPoint;
  endLoc?: LocationPoint;
  isPath: boolean;
  pathPoints?: LocationPoint[];
}

/**
 * Base parser interface
 */
interface ITimelineParser {
  canParse(data: any): boolean;
  parse(data: any): TimelineData;
}

/**
 * Parser for iOS timeline format
 */
export class IOSTimelineParser implements ITimelineParser {
  canParse(data: any): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0];
    return (
      first.activity?.start?.startsWith?.('geo:') ||
      first.visit?.topCandidate?.placeLocation?.startsWith?.('geo:') ||
      (Array.isArray(first.timelinePath) && first.timelinePath[0]?.point?.startsWith?.('geo:'))
    );
  }

  parse(data: any[]): TimelineData {
    const entries = data
      .map(entry => this.parseEntry(entry))
      .filter((e): e is TimelineEntry => e !== null)
      .sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return timeA - timeB;
      });

    return this.buildTimelineData(entries);
  }

  private parseEntry(entry: any): TimelineEntry | null {
    let startLoc: LocationPoint | null = null;
    let endLoc: LocationPoint | null = null;
    let isPath = false;
    let pathPoints: LocationPoint[] | undefined = undefined;

    if (entry.activity) {
      startLoc = this.parseGeoString(entry.activity.start);
      endLoc = this.parseGeoString(entry.activity.end);
      isPath = true;
    } else if (entry.visit?.topCandidate?.placeLocation) {
      const loc = this.parseGeoString(entry.visit.topCandidate.placeLocation);
      startLoc = loc;
      endLoc = loc;
    } else if (entry.timelinePath && Array.isArray(entry.timelinePath)) {
      const points = entry.timelinePath
        .map((p: any) => this.parseGeoString(p.point))
        .filter((p: LocationPoint | null): p is LocationPoint => p !== null);

      if (points.length > 0) {
        startLoc = points[0];
        endLoc = points[points.length - 1];
        isPath = points.length > 1;
        pathPoints = points;
      }
    }

    if (!startLoc || !endLoc) return null;

    return {
      startTime: entry.startTime,
      endTime: entry.endTime,
      startLoc,
      endLoc,
      isPath,
      pathPoints,
    };
  }

  private parseGeoString(geoStr: string | undefined): LocationPoint | null {
    if (!geoStr || !geoStr.startsWith('geo:')) return null;
    const parts = geoStr.replace('geo:', '').split(',');
    if (parts.length !== 2) return null;
    
    try {
      return new LocationPoint(parseFloat(parts[0]), parseFloat(parts[1]));
    } catch {
      return null;
    }
  }

  private buildTimelineData(entries: TimelineEntry[]): TimelineData {
    const points: LocationPoint[] = [];
    const segments: LocationSegment[] = [];

    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];

      // If there are pathPoints, add all of them
      if (curr.pathPoints && curr.pathPoints.length > 0) {
        points.push(...curr.pathPoints);
        
        // Create segments between consecutive points in the path
        for (let j = 0; j < curr.pathPoints.length - 1; j++) {
          segments.push(GeographyService.createSegment(curr.pathPoints[j], curr.pathPoints[j + 1]));
        }
      } else {
        // Original logic for non-path entries
        if (curr.startLoc) {
          points.push(curr.startLoc);
        }

        if (curr.endLoc && curr.startLoc && !curr.endLoc.equals(curr.startLoc)) {
          points.push(curr.endLoc);
        }

        if (curr.isPath && curr.startLoc && curr.endLoc) {
          segments.push(GeographyService.createSegment(curr.startLoc, curr.endLoc));
        }
      }

      if (i > 0) {
        const prev = entries[i - 1];
        if (prev.endLoc && curr.startLoc) {
          segments.push(GeographyService.createSegment(prev.endLoc, curr.startLoc));
        }
      }
    }

    return new TimelineData(points, segments);
  }
}

/**
 * Parser for Android timeline format
 */
export class AndroidTimelineParser implements ITimelineParser {
  canParse(data: any): boolean {
    return data && typeof data === 'object' && Array.isArray(data.semanticSegments);
  }

  parse(data: any): TimelineData {
    const entries = data.semanticSegments
      .map((entry: any) => this.parseEntry(entry))
      .filter((e: TimelineEntry | null): e is TimelineEntry => e !== null)
      .sort((a: TimelineEntry, b: TimelineEntry) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return timeA - timeB;
      });

    return this.buildTimelineData(entries);
  }

  private parseEntry(entry: any): TimelineEntry | null {
    let startLoc: LocationPoint | null = null;
    let endLoc: LocationPoint | null = null;
    let isPath = false;
    let pathPoints: LocationPoint[] | undefined = undefined;

    if (entry.activity) {
      startLoc = this.parseLatLngString(entry.activity.start?.latLng);
      endLoc = this.parseLatLngString(entry.activity.end?.latLng);
      isPath = true;
    } else if (entry.visit?.topCandidate?.placeLocation?.latLng) {
      const loc = this.parseLatLngString(entry.visit.topCandidate.placeLocation.latLng);
      startLoc = loc;
      endLoc = loc;
    } else if (entry.timelinePath && Array.isArray(entry.timelinePath)) {
      const points = entry.timelinePath
        .map((p: any) => this.parseLatLngString(p.point))
        .filter((p: LocationPoint | null): p is LocationPoint => p !== null);

      if (points.length > 0) {
        startLoc = points[0];
        endLoc = points[points.length - 1];
        isPath = points.length > 1;
        pathPoints = points;
      }
    }

    if (!startLoc || !endLoc) return null;

    return {
      startTime: entry.startTime,
      endTime: entry.endTime,
      startLoc,
      endLoc,
      isPath,
      pathPoints,
    };
  }

  private parseLatLngString(latLngStr: string | undefined): LocationPoint | null {
    if (!latLngStr) return null;
    const parts = latLngStr.replace(/°/g, '').split(',').map(s => s.trim());
    if (parts.length !== 2) return null;
    
    try {
      return new LocationPoint(parseFloat(parts[0]), parseFloat(parts[1]));
    } catch {
      return null;
    }
  }

  private buildTimelineData(entries: TimelineEntry[]): TimelineData {
    const points: LocationPoint[] = [];
    const segments: LocationSegment[] = [];

    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];

      // If there are pathPoints, add all of them
      if (curr.pathPoints && curr.pathPoints.length > 0) {
        points.push(...curr.pathPoints);
        
        // Create segments between consecutive points in the path
        for (let j = 0; j < curr.pathPoints.length - 1; j++) {
          segments.push(GeographyService.createSegment(curr.pathPoints[j], curr.pathPoints[j + 1]));
        }
      } else {
        // Original logic for non-path entries
        if (curr.startLoc) {
          points.push(curr.startLoc);
        }

        if (curr.endLoc && curr.startLoc && !curr.endLoc.equals(curr.startLoc)) {
          points.push(curr.endLoc);
        }

        if (curr.isPath && curr.startLoc && curr.endLoc) {
          segments.push(GeographyService.createSegment(curr.startLoc, curr.endLoc));
        }
      }

      if (i > 0) {
        const prev = entries[i - 1];
        if (prev.endLoc && curr.startLoc) {
          segments.push(GeographyService.createSegment(prev.endLoc, curr.startLoc));
        }
      }
    }

    return new TimelineData(points, segments);
  }
}

/**
 * Factory for creating appropriate parser
 */
export class TimelineParserFactory {
  private static parsers: ITimelineParser[] = [
    new IOSTimelineParser(),
    new AndroidTimelineParser(),
  ];

  static parse(data: any): TimelineData {
    for (const parser of this.parsers) {
      if (parser.canParse(data)) {
        return parser.parse(data);
      }
    }
    
    console.warn('Unknown timeline format');
    return new TimelineData([], []);
  }

  static detectFormat(data: any): TimelineFormat {
    if (new IOSTimelineParser().canParse(data)) return 'ios';
    if (new AndroidTimelineParser().canParse(data)) return 'android';
    return 'unknown';
  }
}

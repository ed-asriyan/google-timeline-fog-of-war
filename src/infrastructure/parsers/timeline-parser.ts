// Infrastructure Layer: Timeline format parsers

import { TimelinePoint, TimelinePath, TimelineData, LocationPoint } from '../../domains/map';

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
    const points: TimelinePoint[] = [];
    const paths: TimelinePath[] = [];

    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];
      const timestamp = curr.startTime ? new Date(curr.startTime) : new Date();

      // If there are pathPoints, add all of them
      if (curr.pathPoints && curr.pathPoints.length > 0) {
        // Add all points from the path
        for (const loc of curr.pathPoints) {
          points.push(new TimelinePoint(loc.lat, loc.lon, timestamp));
        }
        
        // Create paths between consecutive points in the path
        for (let j = 0; j < curr.pathPoints.length - 1; j++) {
          const a = new TimelinePoint(curr.pathPoints[j].lat, curr.pathPoints[j].lon, timestamp);
          const b = new TimelinePoint(curr.pathPoints[j + 1].lat, curr.pathPoints[j + 1].lon, timestamp);
          paths.push(new TimelinePath(a, b));
        }
      } else {
        // Add start and end points
        if (curr.startLoc) {
          points.push(new TimelinePoint(curr.startLoc.lat, curr.startLoc.lon, timestamp));
        }

        if (curr.endLoc && curr.startLoc) {
          const distance = Math.sqrt(
            Math.pow(curr.endLoc.lat - curr.startLoc.lat, 2) + 
            Math.pow(curr.endLoc.lon - curr.startLoc.lon, 2)
          );
          if (distance > 0.0001) { // Roughly 11 meters
            const endTime = curr.endTime ? new Date(curr.endTime) : timestamp;
            points.push(new TimelinePoint(curr.endLoc.lat, curr.endLoc.lon, endTime));
          }
        }

        // Create path if this is a movement
        if (curr.isPath && curr.startLoc && curr.endLoc) {
          const a = new TimelinePoint(curr.startLoc.lat, curr.startLoc.lon, timestamp);
          const b = new TimelinePoint(curr.endLoc.lat, curr.endLoc.lon, curr.endTime ? new Date(curr.endTime) : timestamp);
          paths.push(new TimelinePath(a, b));
        }
      }

      // Connect to previous entry
      if (i > 0) {
        const prev = entries[i - 1];
        const prevEndTime = prev.endTime ? new Date(prev.endTime) : new Date();
        if (prev.endLoc && curr.startLoc) {
          const a = new TimelinePoint(prev.endLoc.lat, prev.endLoc.lon, prevEndTime);
          const b = new TimelinePoint(curr.startLoc.lat, curr.startLoc.lon, timestamp);
          paths.push(new TimelinePath(a, b));
        }
      }
    }

    return new TimelineData(points, paths);
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
    const points: TimelinePoint[] = [];
    const paths: TimelinePath[] = [];

    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];
      const timestamp = curr.startTime ? new Date(curr.startTime) : new Date();

      // If there are pathPoints, add all of them
      if (curr.pathPoints && curr.pathPoints.length > 0) {
        // Add all points from the path
        for (const loc of curr.pathPoints) {
          points.push(new TimelinePoint(loc.lat, loc.lon, timestamp));
        }
        
        // Create paths between consecutive points in the path
        for (let j = 0; j < curr.pathPoints.length - 1; j++) {
          const a = new TimelinePoint(curr.pathPoints[j].lat, curr.pathPoints[j].lon, timestamp);
          const b = new TimelinePoint(curr.pathPoints[j + 1].lat, curr.pathPoints[j + 1].lon, timestamp);
          paths.push(new TimelinePath(a, b));
        }
      } else {
        // Add start and end points
        if (curr.startLoc) {
          points.push(new TimelinePoint(curr.startLoc.lat, curr.startLoc.lon, timestamp));
        }

        if (curr.endLoc && curr.startLoc) {
          const distance = Math.sqrt(
            Math.pow(curr.endLoc.lat - curr.startLoc.lat, 2) + 
            Math.pow(curr.endLoc.lon - curr.startLoc.lon, 2)
          );
          if (distance > 0.0001) { // Roughly 11 meters
            const endTime = curr.endTime ? new Date(curr.endTime) : timestamp;
            points.push(new TimelinePoint(curr.endLoc.lat, curr.endLoc.lon, endTime));
          }
        }

        // Create path if this is a movement
        if (curr.isPath && curr.startLoc && curr.endLoc) {
          const a = new TimelinePoint(curr.startLoc.lat, curr.startLoc.lon, timestamp);
          const b = new TimelinePoint(curr.endLoc.lat, curr.endLoc.lon, curr.endTime ? new Date(curr.endTime) : timestamp);
          paths.push(new TimelinePath(a, b));
        }
      }

      // Connect to previous entry
      if (i > 0) {
        const prev = entries[i - 1];
        const prevEndTime = prev.endTime ? new Date(prev.endTime) : new Date();
        if (prev.endLoc && curr.startLoc) {
          const a = new TimelinePoint(prev.endLoc.lat, prev.endLoc.lon, prevEndTime);
          const b = new TimelinePoint(curr.startLoc.lat, curr.startLoc.lon, timestamp);
          paths.push(new TimelinePath(a, b));
        }
      }
    }

    return new TimelineData(points, paths);
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

// Infrastructure Layer: Timeline format parsers

import { 
  TimelinePoint, 
  TimelinePath, 
  LocationPoint, 
  Group as TimelineGroup,
  ParserPort 
} from '@/domains/map/ports';

export type TimelineFormat = 'ios' | 'android' | 'gpx' | 'unknown';

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
interface ITimelineParser extends ParserPort {
  canParse(data: any): boolean;
  parse(data: any): TimelineGroup;
}

/**
 * Parser for iOS timeline format
 */
export class IOSTimelineParser implements ITimelineParser {
  canParse(data: any): boolean {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return false; }
    }
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0];
    return (
      first.activity?.start?.startsWith?.('geo:') ||
      first.visit?.topCandidate?.placeLocation?.startsWith?.('geo:') ||
      (Array.isArray(first.timelinePath) && first.timelinePath[0]?.point?.startsWith?.('geo:'))
    );
  }

  parse(data: any): TimelineGroup {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    const entries = data
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
      return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
    } catch {
      return null;
    }
  }

  private buildTimelineData(entries: TimelineEntry[]): TimelineGroup {
    const points: TimelinePoint[] = [];
    const paths: TimelinePath[] = [];

    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];
      const startTimestamp = curr.startTime ? new Date(curr.startTime).getTime() : new Date().getTime();
      const endTimestamp = curr.endTime ? new Date(curr.endTime).getTime() : startTimestamp;

      // If there are pathPoints, add all of them
      if (curr.pathPoints && curr.pathPoints.length > 0) {
        const computedPoints: TimelinePoint[] = [];
        const ptsLen = curr.pathPoints.length;
        
        for (let j = 0; j < ptsLen; j++) {
          const loc = curr.pathPoints[j];
          // Interpolate timestamp
          const fraction = ptsLen > 1 ? j / (ptsLen - 1) : 0;
          const pointTimestamp = startTimestamp + (endTimestamp - startTimestamp) * fraction;
          const pt = { lat: loc.lat, lon: loc.lon, timestamp: pointTimestamp };
          points.push(pt);
          computedPoints.push(pt);
        }
        // Create n-1 segment paths between consecutive points
        for (let j = 1; j < computedPoints.length; j++) {
          paths.push({ points: [computedPoints[j - 1], computedPoints[j]] });
        }
      } else {
        // Add start and end points
        if (curr.startLoc) {
          points.push({ lat: curr.startLoc.lat, lon: curr.startLoc.lon, timestamp: startTimestamp });
        }

        if (curr.endLoc && curr.startLoc) {
          const distance = Math.sqrt(
            Math.pow(curr.endLoc.lat - curr.startLoc.lat, 2) + 
            Math.pow(curr.endLoc.lon - curr.startLoc.lon, 2)
          );
          if (distance > 0.0001) { // Roughly 11 meters
            points.push({ lat: curr.endLoc.lat, lon: curr.endLoc.lon, timestamp: endTimestamp });
          }
        }

        // Create path if this is a movement
        if (curr.isPath && curr.startLoc && curr.endLoc) {
          paths.push({
            points: [
              { lat: curr.startLoc.lat, lon: curr.startLoc.lon, timestamp: startTimestamp },
              { lat: curr.endLoc.lat, lon: curr.endLoc.lon, timestamp: endTimestamp }
            ]
          });
        }
      }

      // Connect to previous entry
      if (i > 0) {
        const prev = entries[i - 1];
        const prevEndTime = prev.endTime ? new Date(prev.endTime).getTime() : new Date().getTime();
        if (prev.endLoc && curr.startLoc) {
          paths.push({
            points: [
              { lat: prev.endLoc.lat, lon: prev.endLoc.lon, timestamp: prevEndTime },
              { lat: curr.startLoc.lat, lon: curr.startLoc.lon, timestamp: startTimestamp }
            ]
          });
        }
      }
    }

    return { points, paths };
  }
}

/**
 * Parser for Android timeline format
 */
export class AndroidTimelineParser implements ITimelineParser {
  canParse(data: any): boolean {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return false; }
    }
    return data && typeof data === 'object' && Array.isArray(data.semanticSegments);
  }

  parse(data: any): TimelineGroup {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
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
      return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
    } catch {
      return null;
    }
  }

  private buildTimelineData(entries: TimelineEntry[]): TimelineGroup {
    const points: TimelinePoint[] = [];
    const paths: TimelinePath[] = [];

    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];
      const startTimestamp = curr.startTime ? new Date(curr.startTime).getTime() : new Date().getTime();
      const endTimestamp = curr.endTime ? new Date(curr.endTime).getTime() : startTimestamp;

      // If there are pathPoints, add all of them
      if (curr.pathPoints && curr.pathPoints.length > 0) {
        const computedPoints: TimelinePoint[] = [];
        const ptsLen = curr.pathPoints.length;
        
        for (let j = 0; j < ptsLen; j++) {
          const loc = curr.pathPoints[j];
          // Interpolate timestamp
          const fraction = ptsLen > 1 ? j / (ptsLen - 1) : 0;
          const pointTimestamp = startTimestamp + (endTimestamp - startTimestamp) * fraction;
          const pt = { lat: loc.lat, lon: loc.lon, timestamp: pointTimestamp };
          points.push(pt);
          computedPoints.push(pt);
        }
        // Create n-1 segment paths between consecutive points
        for (let j = 1; j < computedPoints.length; j++) {
          paths.push({ points: [computedPoints[j - 1], computedPoints[j]] });
        }
      } else {
        // Add start and end points
        if (curr.startLoc) {
          points.push({ lat: curr.startLoc.lat, lon: curr.startLoc.lon, timestamp: startTimestamp });
        }

        if (curr.endLoc && curr.startLoc) {
          const distance = Math.sqrt(
            Math.pow(curr.endLoc.lat - curr.startLoc.lat, 2) + 
            Math.pow(curr.endLoc.lon - curr.startLoc.lon, 2)
          );
          if (distance > 0.0001) { // Roughly 11 meters
            points.push({ lat: curr.endLoc.lat, lon: curr.endLoc.lon, timestamp: endTimestamp });
          }
        }

        // Create path if this is a movement
        if (curr.isPath && curr.startLoc && curr.endLoc) {
          paths.push({
            points: [
              { lat: curr.startLoc.lat, lon: curr.startLoc.lon, timestamp: startTimestamp },
              { lat: curr.endLoc.lat, lon: curr.endLoc.lon, timestamp: endTimestamp }
            ]
          });
        }
      }

      // Connect to previous entry
      if (i > 0) {
        const prev = entries[i - 1];
        const prevEndTime = prev.endTime ? new Date(prev.endTime).getTime() : new Date().getTime();
        if (prev.endLoc && curr.startLoc) {
          paths.push({
            points: [
              { lat: prev.endLoc.lat, lon: prev.endLoc.lon, timestamp: prevEndTime },
              { lat: curr.startLoc.lat, lon: curr.startLoc.lon, timestamp: startTimestamp }
            ]
          });
        }
      }
    }

    return { points, paths };
  }
}

/**
 * Parser for GPX (GPS Exchange Format) files
 */
export class GPXTimelineParser implements ITimelineParser {
  canParse(data: any): boolean {
    if (typeof data !== 'string') return false;
    return data.trimStart().includes('<gpx');
  }

  parse(data: any): TimelineGroup {
    if (typeof data !== 'string') return { points: [], paths: [] };

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(data, 'application/xml');

    if (doc.querySelector('parsererror')) return { points: [], paths: [] };

    const points: TimelinePoint[] = [];
    const paths: TimelinePath[] = [];

    // Parse track segments
    for (const seg of doc.querySelectorAll('trkseg')) {
      const segPoints: TimelinePoint[] = [];
      for (const trkpt of seg.querySelectorAll('trkpt')) {
        const pt = this.parseTrackPoint(trkpt);
        if (pt) { points.push(pt); segPoints.push(pt); }
      }
      for (let i = 1; i < segPoints.length; i++) {
        paths.push({ points: [segPoints[i - 1], segPoints[i]] });
      }
    }

    // Parse standalone waypoints
    for (const wpt of doc.querySelectorAll('wpt')) {
      const pt = this.parseTrackPoint(wpt);
      if (pt) points.push(pt);
    }

    return { points, paths };
  }

  private parseTrackPoint(el: Element): TimelinePoint | null {
    const lat = parseFloat(el.getAttribute('lat') ?? '');
    const lon = parseFloat(el.getAttribute('lon') ?? '');
    if (isNaN(lat) || isNaN(lon)) return null;

    const timeEl = el.querySelector('time');
    const timestamp = timeEl?.textContent
      ? new Date(timeEl.textContent).getTime()
      : Date.now();

    return { lat, lon, timestamp };
  }
}

/**
 * Factory for creating appropriate parser
 */
export class TimelineParserFactory implements ParserPort {
  private static parsers: ITimelineParser[] = [
    new GPXTimelineParser(),
    new IOSTimelineParser(),
    new AndroidTimelineParser(),
  ];

  parse(data: any): TimelineGroup {
    return TimelineParserFactory.parse(data);
  }

  static parse(data: any): TimelineGroup {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { /* ignore */ }
    }
    for (const parser of this.parsers) {
      if (parser.canParse(data)) {
        return parser.parse(data);
      }
    }
    
    console.warn('Unknown timeline format');
    return { points: [], paths: [] };
  }

  static detectFormat(data: any): TimelineFormat {
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { /* ignore */ }
    }
    if (new IOSTimelineParser().canParse(data)) return 'ios';
    if (new AndroidTimelineParser().canParse(data)) return 'android';
    if (new GPXTimelineParser().canParse(data)) return 'gpx';
    return 'unknown';
  }
}

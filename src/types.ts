// Core data types
export interface LocationPoint {
  lat: number;
  lon: number;
}

export interface LocationSegment {
  start: LocationPoint;
  end: LocationPoint;
  lengthKm: number;
}

export interface ExtractedData {
  points: LocationPoint[];
  segments: LocationSegment[];
}

export interface FileRecord {
  id: string;
  name: string;
  pointCount: number;
  segmentCount: number;
  data: ExtractedData;
}

// Timeline format types
export type TimelineFormat = 'ios' | 'android' | 'unknown';

export interface TimelineEntry {
  startTime?: string;
  endTime?: string;
  startLoc?: LocationPoint;
  endLoc?: LocationPoint;
  isPath: boolean;
}

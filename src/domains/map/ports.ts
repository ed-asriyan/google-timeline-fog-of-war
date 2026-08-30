export interface LocationPoint {
  lat: number;
  lon: number;
}

export interface TimelinePoint {
  lat: number;
  lon: number;
  timestamp: number;
}

export interface TimelinePath {
  points: TimelinePoint[];
}

export interface Bounds {
  a: LocationPoint;
  b: LocationPoint;
}

export interface Statistics {
  totalPoints: number;
  totalPaths: number;
}

export interface Group {
  points: TimelinePoint[];
  paths: TimelinePath[];
}

export interface MapSegment {
  index: number;
  group: Group;
}

export interface Settings {
    maxPathDistanceKm: number;
    maxPathVelocityKmh: number;
}

export interface MapApp {
  loadPoints(data: string): Promise<LocationPoint | null>;
  clear(): Promise<void>;
  getData(bounds: Bounds): Promise<Group>;
  getStatistics(bounds: Bounds): Promise<Statistics>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

export interface MapSegmentRepository {
  saveSegment(segment: MapSegment): Promise<void>;
  loadSegment(id: number): Promise<MapSegment>;
  clear(): Promise<void>;
  hasData(): Promise<boolean>;
}

export interface ParserPort {
  parse(data: string): Group;
}

export interface SettingsRepository {
  saveSettings(settings: Settings): Promise<void>;
  loadSettings(): Promise<Settings>;
}

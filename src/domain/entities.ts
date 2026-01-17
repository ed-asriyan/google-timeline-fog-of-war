// Domain Layer: Core business entities and value objects

/**
 * Represents a geographic coordinate point
 */
export class LocationPoint {
  constructor(
    public readonly lat: number,
    public readonly lon: number
  ) {
    if (!LocationPoint.isValid(lat, lon)) {
      throw new Error(`Invalid coordinates: lat=${lat}, lon=${lon}`);
    }
  }

  static isValid(lat: number, lon: number): boolean {
    return !isNaN(lat) && !isNaN(lon) && 
           lat >= -90 && lat <= 90 && 
           lon >= -180 && lon <= 180;
  }

  equals(other: LocationPoint): boolean {
    return this.lat === other.lat && this.lon === other.lon;
  }

  toJSON() {
    return { lat: this.lat, lon: this.lon };
  }
}

/**
 * Represents a path segment between two locations
 */
export class LocationSegment {
  constructor(
    public readonly start: LocationPoint,
    public readonly end: LocationPoint,
    public readonly lengthKm: number
  ) {}

  toJSON() {
    return {
      start: this.start.toJSON(),
      end: this.end.toJSON(),
      lengthKm: this.lengthKm
    };
  }
}

/**
 * Represents extracted timeline data
 */
export class TimelineData {
  constructor(
    public readonly points: LocationPoint[],
    public readonly segments: LocationSegment[]
  ) {}

  get pointCount(): number {
    return this.points.length;
  }

  get segmentCount(): number {
    return this.segments.length;
  }

  isEmpty(): boolean {
    return this.points.length === 0 && this.segments.length === 0;
  }

  merge(other: TimelineData): TimelineData {
    return new TimelineData(
      [...this.points, ...other.points],
      [...this.segments, ...other.segments]
    );
  }

  toJSON() {
    return {
      points: this.points.map(p => p.toJSON()),
      segments: this.segments.map(s => s.toJSON())
    };
  }
}

/**
 * Represents a timeline file record
 */
export class TimelineFile {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly data: TimelineData,
    public readonly uploadedAt: Date = new Date()
  ) {}

  get pointCount(): number {
    return this.data.pointCount;
  }

  get segmentCount(): number {
    return this.data.segmentCount;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      pointCount: this.pointCount,
      segmentCount: this.segmentCount,
      data: this.data.toJSON(),
      uploadedAt: this.uploadedAt.toISOString()
    };
  }

  static fromJSON(json: any): TimelineFile {
    const points = json.data.points.map((p: any) => new LocationPoint(p.lat, p.lon));
    const segments = json.data.segments.map((s: any) => 
      new LocationSegment(
        new LocationPoint(s.start.lat, s.start.lon),
        new LocationPoint(s.end.lat, s.end.lon),
        s.lengthKm
      )
    );
    const data = new TimelineData(points, segments);
    return new TimelineFile(
      json.id,
      json.name,
      data,
      json.uploadedAt ? new Date(json.uploadedAt) : new Date()
    );
  }
}

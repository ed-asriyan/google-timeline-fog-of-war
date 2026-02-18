// Application Layer: File management use case

import { Map, MapBounds, TimelineGroup } from '@/domains/map';
import { MapSegment } from '@/domains/map/MapSegment';
import { MapSegmentRepository } from '@/domains/ports';
import { TimelineParserFactory } from '@/infrastructure/parsers/timeline-parser';

class SegmentsCache {
  private cache: Record<number, MapSegment>;
  private readonly maxCacheSize: number;
  private repository: MapSegmentRepository;

  constructor(repository: MapSegmentRepository, maxCacheSize: number) {
    this.maxCacheSize = maxCacheSize;
    this.cache = {};
    this.repository = repository;
  }

  async invalidate(): Promise<void> {
    this.cache = {};
  }

  async loadSegment(id: number): Promise<MapSegment> {
    if (this.cache[id]) {
      return this.cache[id];
    }

    const segment = await this.repository.loadSegment(id);
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      this.invalidateCache();
    }
    this.cache[id] = segment;
    return segment;
  }

  async invalidateCache(): Promise<void> {
    this.cache = {};
  }

  async flushSegment(id: number): Promise<void> {
    const segment = this.cache[id];
    if (segment) {
      await this.repository.saveSegment(segment);
    }
  }

  async flushAll(): Promise<void> {
    await Promise.all(Object.keys(this.cache).map(id => this.flushSegment(Number(id))));
  }
}

/**
 * Use case for managing timeline files and map
 */
export class TimelineFileService {
  private map: Map = new Map();;
  private cache: SegmentsCache;
  private repository: MapSegmentRepository;

  constructor(repository: MapSegmentRepository) {
    this.repository = repository;
    this.cache = new SegmentsCache(this.repository, 100);

  }

  async queryViewport(bounds: MapBounds): Promise<TimelineGroup> {
    const segmentIds = this.map.getSegmentIdsForBound(bounds);

    const mapSegments = await Promise.all(segmentIds.map(id => this.cache.loadSegment(id)));

    const result = mapSegments.reduce((result: TimelineGroup, segment: MapSegment) => {
      result.mergeFrom(segment);
      return result;
    }, new TimelineGroup());

    return result;
  }

  /**
   * Upload and process timeline files
   */
  async uploadFile(file: File): Promise<void> {
    await this.cache.invalidate();
    const cache = new SegmentsCache(this.repository, Infinity);

    const timelineGroup = await this.processFile(file);

    for (const [segmentId, points] of Object.entries(this.map.getSegmentIdForPoints(timelineGroup.points))) {
      const segment = await cache.loadSegment(Number(segmentId));
      segment.addPoints(...points);
    }

    for (const [segmentId, paths] of Object.entries(this.map.getSegmentIdsForPaths(timelineGroup.paths))) {
      const segment = await cache.loadSegment(Number(segmentId));
      segment.addPaths(...paths);
    }

    await cache.flushAll();
  }

  async clearAll(): Promise<void> {
    await this.cache.invalidate();
    await this.repository.clear();
  }

  async hasData(): Promise<boolean> {
    return this.repository.hasData();
  }

  private async processFile(file: File): Promise<TimelineGroup> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const data = TimelineParserFactory.parse(json);
          resolve(data);
        } catch (error) {
          reject(new Error(`Failed to parse ${file.name}: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  }
}

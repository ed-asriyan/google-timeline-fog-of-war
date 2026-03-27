// Application Layer: File management use case

import { Map, MapBounds, TimelineGroup } from '@/domains/map';
import { MapSegment } from '@/domains/map/MapSegment';
import { MapSegmentRepository } from '@/domains/ports';
import { TimelineParserFactory } from '@/infrastructure/parsers/TimelineParser';
import { createLogger } from '@/utils/log';

const log = createLogger('MapApplication');

interface LoadingStateIdle {
  status: 'idle';
}

interface LoadingStateLoading {
  status: 'loading';
}

interface LoadingStateParsing {
  status: 'parsing';
  progress: number; // 0 to 100
}

export type LoadingState = LoadingStateIdle | LoadingStateLoading | LoadingStateParsing;

class MapApplication {
  private cache: Record<number, MapSegment>;
  private readonly maxCacheSize: number;
  private repository: MapSegmentRepository;

  constructor(repository: MapSegmentRepository, maxCacheSize: number) {
    this.maxCacheSize = maxCacheSize;
    this.cache = {};
    this.repository = repository;
  }

  async invalidate(): Promise<void> {
    log('Cache invalidated');
    this.cache = {};
  }

  async loadSegment(id: number): Promise<MapSegment> {
    if (this.cache[id]) {
      log(`Segment ${id} loaded from cache (cache size: ${Object.keys(this.cache).length})`);
      return this.cache[id];
    }

    log(`Segment ${id} not in cache, loading from repository (cache size: ${Object.keys(this.cache).length})`);

    const segment = await this.repository.loadSegment(id);
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      log(`Cache size limit (${this.maxCacheSize}) reached, invalidating`);
      await this.invalidateCache();
    }
    this.cache[id] = segment;
    return segment;
  }

  async invalidateCache(): Promise<void> {
    log('Cache invalidated');
    this.cache = {};
  }

  async flushSegment(id: number): Promise<void> {
    const segment = this.cache[id];
    if (segment) {
      log(`Flushing segment ${id} to repository`);
      await this.repository.saveSegment(segment);
    }
  }

  async flushAll(): Promise<void> {
    const ids = Object.keys(this.cache);
    log(`Flushing ${ids.length} segment(s) to repository`);
    await Promise.all(ids.map(id => this.flushSegment(Number(id))));
  }
}

/**
 * Use case for managing timeline files and map
 */
export class TimelineFileService {
  private map: Map = new Map();
  private cache: MapApplication;
  private repository: MapSegmentRepository;
  private loadingState: LoadingState = { status: 'idle' };

  constructor(repository: MapSegmentRepository) {
    this.repository = repository;
    this.cache = new MapApplication(this.repository, 100);
  }

  getCurrentLoadingState(): LoadingState {
    return this.loadingState;
  }

  async queryViewport(bounds: MapBounds): Promise<TimelineGroup> {
    const timeStart = performance.now();
    const segmentIds = this.map.getSegmentIdsForBound(bounds);
    log(`Querying viewport ${bounds.toString()}: ${segmentIds.join(', ')}`);

    const mapSegments = await Promise.all(segmentIds.map(id => this.cache.loadSegment(id)));

    const result = mapSegments.reduce((result: TimelineGroup, segment: MapSegment) => {
      result.mergeFrom(segment);
      return result;
    }, new TimelineGroup());

    const timeEnd = performance.now();
    log(`Viewport query complete: ${result.points.length} point(s), ${result.paths.length} path(s) in ${(timeEnd - timeStart).toFixed(2)} ms`);
    return result;
  }

  /**
   * Upload and process timeline files
   */
  async addFiles(...file: File[]): Promise<void> {
    this.loadingState = { status: 'loading' };
    try {
      log(`Adding ${file.length} file(s): ${file.map(f => f.name).join(', ')}`);
      await this.cache.invalidate();

      this.loadingState = { status: 'parsing', progress: 0 };
      const parsedGroups = await Promise.all(file.map(f => this.processFile(f)));
      const total = parsedGroups.reduce((sum, g) => sum + g.points.length + g.paths.length, 0);

      const timelineGroup = new TimelineGroup();
      let loaded = 0;
      for (const data of parsedGroups) {
        timelineGroup.mergeFrom(data);
        loaded += data.points.length + data.paths.length;
        this.loadingState = { status: 'parsing', progress: total === 0 ? 100 : Math.round((loaded / total) * 100) };
      }

      log(`Parsed ${timelineGroup.points.length} point(s) and ${timelineGroup.paths.length} path(s) from files`);
      await this.addGroup(timelineGroup);
    } finally {
      this.loadingState = { status: 'idle' };
    }
  }

  private async addGroup(timelineGroup: TimelineGroup): Promise<void> {
    log(`Adding group: ${timelineGroup.points.length} point(s), ${timelineGroup.paths.length} path(s)`);
    const cache = new MapApplication(this.repository, Infinity);

    const touchedSegments = new Set<number>();

    for (const [segmentId, points] of Object.entries(this.map.getSegmentIdForPoints(timelineGroup.points))) {
      const id = Number(segmentId);
      const segment = await cache.loadSegment(id);
      segment.addPoints(...points);
      touchedSegments.add(id);
    }

    for (const [segmentId, paths] of Object.entries(this.map.getSegmentIdsForPaths(timelineGroup.paths))) {
      const id = Number(segmentId);
      const segment = await cache.loadSegment(id);
      segment.addPaths(...paths);
      touchedSegments.add(id);
    }

    // Deduplicate only the segments touched by this file load
    for (const id of touchedSegments) {
      (await cache.loadSegment(id)).removeDuplicates();
    }

    await cache.flushAll();
    log(`addGroup complete, ${touchedSegments.size} segment(s) updated`);
  }

  async clearAll(): Promise<void> {
    log('Clearing all map data');
    await this.cache.invalidate();
    await this.repository.clear();
    log('All map data cleared');
  }

  async hasData(): Promise<boolean> {
    return this.repository.hasData();
  }

  private async processFile(file: File): Promise<TimelineGroup> {
    log(`Processing file: ${file.name}`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const data = TimelineParserFactory.parse(json);
          log(`Parsed file ${file.name}: ${data.points.length} point(s), ${data.paths.length} path(s)`);
          resolve(data);
        } catch (error) {
          console.error('[Map] Failed to parse', file.name, error);
          reject(new Error(`Failed to parse ${file.name}: ${error}`));
        }
      };

      reader.onerror = () => {
        console.error('[Map] Failed to read', file.name);
        reject(new Error(`Failed to read ${file.name}`));
      };
      reader.readAsText(file);
    });
  }
}

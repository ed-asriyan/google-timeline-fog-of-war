/**
 * Map Aggregate Root
 * Manages all spatial data in the application
 */

import { TimelineFile } from './TimelineFile';
import { TimelineData } from './TimelineData';
import { MapSegment } from './MapSegment';
import { MapBounds } from './value-objects';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';

/**
 * Map Aggregate Root
 * Manages all spatial data in the application
 * Organizes data into MapSegment grid cells for efficient viewport queries
 */
export class Map {
    private static readonly LAT_STEP_COUNTS: number = 18;
    private static readonly LON_STEP_COUNTS: number = 36;

    private grid: MapSegment[];
    private files: TimelineFile[];

    private constructor(grid: MapSegment[], files: TimelineFile[]) {
        this.grid = grid;
        this.files = files;
    }

    /**
     * Create an empty map
     */
    static createEmpty(): Map {
        return new Map(
            new Array<MapSegment>(Map.LAT_STEP_COUNTS * Map.LON_STEP_COUNTS).fill(null as any).map(() => MapSegment.createEmpty()),
            [],
        );
    }

    /**
     * Deserialize map from JSON
     */
    static fromJson(data: any): Map {
        const grid = new Array<MapSegment>(Map.LAT_STEP_COUNTS * Map.LON_STEP_COUNTS).fill(null as any).map(() => MapSegment.createEmpty());
        const files: TimelineFile[] = [];
        
        // Check if grid dimensions match
        const gridDimensionsMatch = data.latStepCounts === Map.LAT_STEP_COUNTS && data.lonStepCounts === Map.LON_STEP_COUNTS;
        
        // Deserialize all points
        const points: TimelinePoint[] = [];
        if (data.points && Array.isArray(data.points)) {
            data.points.forEach((p: any) => {
                points.push(new TimelinePoint(p.lat, p.lon, new Date(p.timestamp)));
            });
        }

        // Deserialize all paths
        const paths: TimelinePath[] = [];
        if (data.paths && Array.isArray(data.paths)) {
            data.paths.forEach((pathData: any) => {
                const a = points[pathData.a];
                const b = points[pathData.b];
                if (!a || !b) {
                    return; // Skip invalid path
                }
                paths.push(new TimelinePath(a, b));
            });
        }
        
        // Deserialize files first
        if (data.files && Array.isArray(data.files)) {
            data.files.forEach((fileData: any) => {
                // Get points by index
                const filePoints = fileData.pointIndices.map((idx: number) => points[idx]);
                
                // Get paths by index
                const filePaths = fileData.pathIndices.map((idx: number) => paths[idx]);
                
                const timelineData = new TimelineData(filePoints, filePaths);
                const file = new TimelineFile(fileData.name, timelineData, fileData.id);
                files.push(file);
            });
        }
        
        const map = new Map(grid, files);
        
        // If grid dimensions match, deserialize segments; otherwise reindex from files
        if (gridDimensionsMatch && data.segments && Array.isArray(data.segments)) {
            data.segments.forEach((segmentData: any) => {
                const segment = grid[segmentData.index];
                
                // Add points by index
                if (segmentData.pointIndices && segmentData.pointIndices.length > 0) {
                    const segmentPoints = segmentData.pointIndices.map((idx: number) => points[idx]);
                    segment.addPoints(...segmentPoints);
                }
                
                // Add paths by index
                if (segmentData.pathIndices && segmentData.pathIndices.length > 0) {
                    const segmentPaths = segmentData.pathIndices.map((idx: number) => paths[idx]);
                    segment.addPaths(...segmentPaths);
                }
            });
        } else {
            // Grid dimensions don't match - reindex all files
            files.forEach(file => {
                // Index points into grid
                file.data.getPoints().forEach(point => {
                    const segmentIdx = map.getSegmentIndex(point.lat, point.lon);
                    map.grid[segmentIdx].addPoints(point);
                });

                // Index paths into grid
                file.data.getPaths().forEach(path => {
                    const startIdx = map.getSegmentIndex(path.a.lat, path.a.lon);
                    const endIdx = map.getSegmentIndex(path.b.lat, path.b.lon);
                    map.grid[startIdx].addPaths(path);
                    if (startIdx !== endIdx) {
                        map.grid[endIdx].addPaths(path);
                    }
                });
            });
        }
        
        return map;
    }

    /**
     * Serialize map to JSON
     */
    toJson(): object {
        // Build unique points and paths with indices
        const pointToIndex = new globalThis.Map<TimelinePoint, number>();
        const pathToIndex = new globalThis.Map<TimelinePath, number>();
        const pointsArray: any[] = [];
        const pathsArray: any[] = [];

        // Collect all unique points from grid segments first (to ensure all points are indexed)
        for (const segment of this.grid) {
            const segmentPoints = segment.getPoints();
            for (const point of segmentPoints) {
                if (!point) continue; // Skip invalid points
                if (!pointToIndex.has(point)) {
                    const index = pointsArray.length;
                    pointToIndex.set(point, index);
                    pointsArray.push({
                        lat: point.lat,
                        lon: point.lon,
                        timestamp: point.timestamp.toISOString(),
                    });
                }
            }
        }

        // Collect all unique paths from grid segments and index any missing points from path endpoints
        for (const segment of this.grid) {
            const segmentPaths = segment.getPaths();
            for (const path of segmentPaths) {
                if (!path || !path.a || !path.b) continue; // Skip invalid paths
                if (!pathToIndex.has(path)) {
                    // Ensure path endpoints are indexed (they should be, but be defensive)
                    if (!pointToIndex.has(path.a)) {
                        const index = pointsArray.length;
                        pointToIndex.set(path.a, index);
                        pointsArray.push({
                            lat: path.a.lat,
                            lon: path.a.lon,
                            timestamp: path.a.timestamp.toISOString(),
                        });
                    }
                    if (!pointToIndex.has(path.b)) {
                        const index = pointsArray.length;
                        pointToIndex.set(path.b, index);
                        pointsArray.push({
                            lat: path.b.lat,
                            lon: path.b.lon,
                            timestamp: path.b.timestamp.toISOString(),
                        });
                    }
                    
                    const aIndex = pointToIndex.get(path.a);
                    const bIndex = pointToIndex.get(path.b);
                    if (aIndex !== undefined && bIndex !== undefined) {
                        const index = pathsArray.length;
                        pathToIndex.set(path, index);
                        pathsArray.push({
                            a: aIndex,
                            b: bIndex,
                        });
                    }
                }
            }
        }

        // Serialize segments with indices
        const segments: any[] = [];
        this.grid.forEach((segment, index) => {
            const stats = segment.getStatistics();
            if (stats.totalPoints > 0 || stats.totalPaths > 0) {
                const segmentPoints = segment.getPoints();
                const segmentPaths = segment.getPaths();
                segments.push({
                    index,
                    pointIndices: segmentPoints.filter(p => p && pointToIndex.has(p)).map(p => pointToIndex.get(p)!),
                    pathIndices: segmentPaths.filter(p => p && pathToIndex.has(p)).map(p => pathToIndex.get(p)!),
                });
            }
        });

        // Serialize files with indices
        const files = this.files.map(file => {
            const filePoints = file.data.getPoints();
            const filePaths = file.data.getPaths();
            const pointIndices = filePoints.filter(p => p && pointToIndex.has(p)).map(p => pointToIndex.get(p)!);
            const pathIndices = filePaths.filter(p => p && pathToIndex.has(p)).map(p => pathToIndex.get(p)!);
            return {
                id: file.id,
                name: file.name,
                pointIndices,
                pathIndices,
            };
        });

        return {
            latStepCounts: Map.LAT_STEP_COUNTS,
            lonStepCounts: Map.LON_STEP_COUNTS,
            points: pointsArray,
            paths: pathsArray,
            segments,
            files,
        };
    }

    /**
     * Query points and paths visible in viewport bounds
     * Returns only data within the specified geographical area
     */
    queryViewport(bounds: MapBounds): { points: TimelinePoint[], paths: TimelinePath[] } {
        // Calculate grid cell ranges for the bounds
        const minLat = Math.min(bounds.a.lat, bounds.b.lat);
        const maxLat = Math.max(bounds.a.lat, bounds.b.lat);
        const minLon = Math.min(bounds.a.lon, bounds.b.lon);
        const maxLon = Math.max(bounds.a.lon, bounds.b.lon);

        // Convert to grid indices
        const minLatIdx = Math.floor((minLat + 90) / 180 * Map.LAT_STEP_COUNTS);
        const maxLatIdx = Math.ceil((maxLat + 90) / 180 * Map.LAT_STEP_COUNTS);
        const minLonIdx = Math.floor((minLon + 180) / 360 * Map.LON_STEP_COUNTS);
        const maxLonIdx = Math.ceil((maxLon + 180) / 360 * Map.LON_STEP_COUNTS);

        const pointsSet = new Set<TimelinePoint>();
        const pathsSet = new Set<TimelinePath>();

        const startLatIdx = Math.max(0, minLatIdx);
        const endLatIdx = Math.min(Map.LAT_STEP_COUNTS, maxLatIdx);
        const startLonIdx = Math.max(0, minLonIdx);
        const endLonIdx = Math.min(Map.LON_STEP_COUNTS, maxLonIdx);

        // Query relevant grid cells
        for (let lat = startLatIdx; lat < endLatIdx; lat++) {
            for (let lon = startLonIdx; lon < endLonIdx; lon++) {
                const segment = this.grid[lat * Map.LON_STEP_COUNTS + lon];
                segment.getPoints().forEach(p => {
                    // Filter by actual bounds
                    if (p.lat >= minLat && p.lat <= maxLat && p.lon >= minLon && p.lon <= maxLon) {
                        pointsSet.add(p);
                    }
                });
                segment.getPaths().forEach(p => {
                    // Include path if either endpoint is in bounds
                    const aInBounds = p.a.lat >= minLat && p.a.lat <= maxLat && p.a.lon >= minLon && p.a.lon <= maxLon;
                    const bInBounds = p.b.lat >= minLat && p.b.lat <= maxLat && p.b.lon >= minLon && p.b.lon <= maxLon;
                    if (aInBounds || bInBounds) {
                        pathsSet.add(p);
                    }
                });
            }
        }

        return {
            points: Array.from(pointsSet),
            paths: Array.from(pathsSet)
        };
    }

    /**
     * Add a timeline file to the map
     * Handles spatial indexing of all points and paths
     */
    addFile(file: TimelineFile): void {
        this.files.push(file);

        // Index points into grid
        file.data.getPoints().forEach(point => {
            const segmentIdx = this.getSegmentIndex(point.lat, point.lon);
            this.grid[segmentIdx].addPoints(point);
        });

        // Index paths into grid
        file.data.getPaths().forEach(path => {
            // Add path to segments containing start or end point
            const startIdx = this.getSegmentIndex(path.a.lat, path.a.lon);
            const endIdx = this.getSegmentIndex(path.b.lat, path.b.lon);
            this.grid[startIdx].addPaths(path);
            if (startIdx !== endIdx) {
                this.grid[endIdx].addPaths(path);
            }
        });
    }

    /**
     * Remove a timeline file from the map
     * Removes all associated points and paths from spatial index
     */
    removeFile(file: TimelineFile): void {
        // Find file by ID since object references may differ after deserialization
        const index = this.files.findIndex(f => f.id === file.id);
        if (index === -1) return;

        const fileToRemove = this.files[index];
        this.files.splice(index, 1);

        // Remove points from grid
        fileToRemove.data.getPoints().forEach(point => {
            if (!point) return; // Skip undefined points
            const segmentIdx = this.getSegmentIndex(point.lat, point.lon);
            this.grid[segmentIdx].removePoints(point);
        });

        // Remove paths from grid
        fileToRemove.data.getPaths().forEach(path => {
            if (!path || !path.a || !path.b) return; // Skip invalid paths
            const startIdx = this.getSegmentIndex(path.a.lat, path.a.lon);
            const endIdx = this.getSegmentIndex(path.b.lat, path.b.lon);
            this.grid[startIdx].removePaths(path);
            if (startIdx !== endIdx) {
                this.grid[endIdx].removePaths(path);
            }
        });
    }

    /**
     * Get statistics about the map
     */
    getStatistics(): { pointsCount: number; pathsCount: number } {
        let pointsCount = 0;
        let pathsCount = 0;

        this.files.forEach(file => {
            const stats = file.data.getStatistics();
            pointsCount += stats.totalPoints;
            pathsCount += stats.totalPaths;
        });

        return { pointsCount, pathsCount };
    }

    /**
     * Get all files in the map
     */
    getAllFiles(): TimelineFile[] {
        return [...this.files];
    }

    /**
     * Calculate grid segment index for given coordinates
     */
    private getSegmentIndex(lat: number, lon: number): number {
        const latIdx = Math.floor((lat + 90) / 180 * Map.LAT_STEP_COUNTS);
        const lonIdx = Math.floor((lon + 180) / 360 * Map.LON_STEP_COUNTS);
        // Clamp to valid range
        const clampedLatIdx = Math.max(0, Math.min(Map.LAT_STEP_COUNTS - 1, latIdx));
        const clampedLonIdx = Math.max(0, Math.min(Map.LON_STEP_COUNTS - 1, lonIdx));
        return clampedLatIdx * Map.LON_STEP_COUNTS + clampedLonIdx;
    }
}

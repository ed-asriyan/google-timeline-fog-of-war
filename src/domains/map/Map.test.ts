/**
 * Tests for Map Aggregate Root
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Map } from './Map';
import { TimelineFile } from './TimelineFile';
import { TimelineData } from './TimelineData';
import { TimelinePoint } from './TimelinePoint';
import { TimelinePath } from './TimelinePath';
import { LocationPoint, MapBounds } from './value-objects';

describe('Map', () => {
  let point1: TimelinePoint;
  let point2: TimelinePoint;
  let path: TimelinePath;
  let data: TimelineData;
  let file: TimelineFile;

  beforeEach(() => {
    const timestamp = new Date();
    point1 = new TimelinePoint(47.6062, -122.3321, timestamp);
    point2 = new TimelinePoint(47.6205, -122.3493, timestamp);
    path = new TimelinePath(point1, point2);
    data = new TimelineData([point1, point2], [path]);
    file = new TimelineFile('seattle.json', data);
  });

  describe('createEmpty', () => {
    it('should create an empty map', () => {
      const map = Map.createEmpty();

      expect(map).toBeInstanceOf(Map);
    });

    it('should have no files initially', () => {
      const map = Map.createEmpty();
      expect(map.getAllFiles()).toEqual([]);
    });

    it('should have zero statistics initially', () => {
      const map = Map.createEmpty();
      const stats = map.getStatistics();

      expect(stats.pointsCount).toBe(0);
      expect(stats.pathsCount).toBe(0);
    });
  });

  describe('addFile', () => {
    it('should add file to map', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const files = map.getAllFiles();
      expect(files).toHaveLength(1);
      expect(files[0]).toBe(file);
      const mapStats = map.getStatistics();
      const dataStats = data.getStatistics();
      expect(mapStats.pointsCount).toBe(dataStats.totalPoints);
      expect(mapStats.pathsCount).toBe(dataStats.totalPaths);
    });

    it('should add multiple files', () => {
      const map = Map.createEmpty();
      const file2 = new TimelineFile('portland.json', data);

      map.addFile(file);
      map.addFile(file2);

      expect(map.getAllFiles()).toHaveLength(2);
      expect(map.getStatistics()).toEqual({
        pointsCount: data.getStatistics().totalPoints * 2,
        pathsCount: data.getStatistics().totalPaths * 2,
      })
    });

    it('should index points into grid segments', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const stats = map.getStatistics();
      expect(stats).toEqual({
        pointsCount: 2,
        pathsCount: 1,
      });
    });

    it('should index paths into grid segments', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const stats = map.getStatistics();
      expect(stats).toEqual({
        pointsCount: 2,
        pathsCount: 1,
      });
    });

    it('should handle file with no data', () => {
      const emptyData = new TimelineData([], []);
      const emptyFile = new TimelineFile('empty.json', emptyData);
      const map = Map.createEmpty();

      map.addFile(emptyFile);

      expect(map.getAllFiles()).toHaveLength(1);
      expect(map.getStatistics()).toEqual({ pointsCount: 0, pathsCount: 0 });
    });
  });

  describe('removeFile', () => {
    it('should remove file from map', () => {
      const map = Map.createEmpty();
      map.addFile(file);
      map.removeFile(file);

      expect(map.getAllFiles()).toEqual([]);
    });

    it('should remove points from grid', () => {
      const map = Map.createEmpty();
      map.addFile(file);
      map.removeFile(file);

      const stats = map.getStatistics();
      expect(stats).toEqual({ pointsCount: 0, pathsCount: 0 });
    });

    it('should remove paths from grid', () => {
      const map = Map.createEmpty();
      map.addFile(file);
      map.removeFile(file);

      const stats = map.getStatistics();
      expect(stats).toEqual({ pointsCount: 0, pathsCount: 0 });
    });

    it('should only remove specified file', () => {
      const map = Map.createEmpty();
      const file2 = new TimelineFile('other.json', data);

      map.addFile(file);
      map.addFile(file2);
      map.removeFile(file);

      const files = map.getAllFiles();
      expect(files).toHaveLength(1);
      expect(files[0]).toBe(file2);
    });

    it('should handle removing non-existent file gracefully', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const otherFile = new TimelineFile('other.json', data);
      expect(() => map.removeFile(otherFile)).not.toThrow();

      expect(map.getAllFiles()).toHaveLength(1);
    });

    it('should remove file by name after deserialization', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      // Simulate persistence round-trip
      const json = map.toJson();
      const restored = Map.fromJson(json);

      // Get the deserialized file (different object reference)
      const deserializedFile = restored.getAllFiles()[0];

      // Create a new file object with same name but different reference
      const fileToRemove = new TimelineFile(deserializedFile.name, deserializedFile.data, deserializedFile.id);

      // Should remove by ID, not by object reference
      restored.removeFile(fileToRemove);

      expect(restored.getAllFiles()).toHaveLength(0);
      expect(restored.getStatistics()).toEqual({ pointsCount: 0, pathsCount: 0 });
    });

    it('should handle multiple files with the same name', () => {
      const map = Map.createEmpty();
      
      // Create two different files with the same name but different data
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const p3 = new TimelinePoint(48.0, -122.0, timestamp);
      
      const data1 = new TimelineData([p1], []);
      const data2 = new TimelineData([p2, p3], []);
      
      const file1 = new TimelineFile('data.json', data1);
      const file2 = new TimelineFile('data.json', data2);
      
      // Both files should be added despite having the same name
      map.addFile(file1);
      map.addFile(file2);
      
      expect(map.getAllFiles()).toHaveLength(2);
      expect(map.getStatistics()).toEqual({ pointsCount: 3, pathsCount: 0 });
      
      // Should be able to remove one without affecting the other
      map.removeFile(file1);
      
      expect(map.getAllFiles()).toHaveLength(1);
      expect(map.getStatistics()).toEqual({ pointsCount: 2, pathsCount: 0 });
      
      // Remaining file should be file2
      const remaining = map.getAllFiles()[0];
      expect(remaining.id).toBe(file2.id);
      expect(remaining.name).toBe('data.json');
    });

    it('should preserve unique IDs after serialization', () => {
      const map = Map.createEmpty();
      
      // Create two files with same name
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(48.0, -122.0, timestamp);
      
      const file1 = new TimelineFile('data.json', new TimelineData([p1], []));
      const file2 = new TimelineFile('data.json', new TimelineData([p2], []));
      
      map.addFile(file1);
      map.addFile(file2);
      
      const originalIds = map.getAllFiles().map(f => f.id);
      
      // Serialize and deserialize
      const json = map.toJson();
      const restored = Map.fromJson(json);
      
      // IDs should be preserved
      const restoredIds = restored.getAllFiles().map(f => f.id);
      expect(restoredIds).toEqual(originalIds);
      
      // Should still be able to remove specific file by ID
      const fileToRemove = restored.getAllFiles()[0];
      restored.removeFile(fileToRemove);
      
      expect(restored.getAllFiles()).toHaveLength(1);
      expect(restored.getAllFiles()[0].id).toBe(originalIds[1]);
    });

    it('should handle removing file with corrupted data gracefully', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const path = new TimelinePath(p1, p2);
      const data = new TimelineData([p1, p2], [path]);
      const file = new TimelineFile('test.json', data);
      
      map.addFile(file);
      
      // Simulate corrupted data by manually creating a file with invalid paths
      const corruptedData = {
        getPoints: () => [p1, undefined, p2], // Include undefined point
        getPaths: () => [path, undefined, null], // Include undefined and null paths
        getStatistics: () => ({ totalPoints: 2, totalPaths: 1 })
      } as any;
      
      const corruptedFile = new TimelineFile('corrupted.json', corruptedData, 'corrupted-id');
      
      // Should not throw when removing file with corrupted data
      expect(() => map.removeFile(corruptedFile)).not.toThrow();
    });

    it('should handle removing file after partial deserialization failure', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const path = new TimelinePath(p1, p2);
      const data = new TimelineData([p1, p2], [path]);
      const file = new TimelineFile('test.json', data);
      
      map.addFile(file);
      
      // Serialize
      const json = map.toJson();
      
      // Corrupt the serialized data by removing some points that paths reference
      const corruptedJson = {
        ...json,
        points: [], // Empty points array will make paths invalid
        paths: (json as any).paths // Keep paths but they'll reference missing points
      };
      
      // Deserialize corrupted data (paths will have undefined points)
      const restoredMap = Map.fromJson(corruptedJson);
      
      // Try to remove files - should not throw even with invalid path data
      const files = restoredMap.getAllFiles();
      files.forEach(f => {
        expect(() => restoredMap.removeFile(f)).not.toThrow();
      });
    });
  });

  describe('queryViewport', () => {
    it('should return points within viewport bounds', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const bounds = new MapBounds(
        new LocationPoint(47.0, -123.0),
        new LocationPoint(48.0, -122.0)
      );

      const stats = map.queryViewport(bounds);
      expect(stats.points).toHaveLength(2);
      expect(stats.paths).toHaveLength(1);
    });

    it('should return empty statistics for viewport with no data', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      // Bounds far from data
      const bounds = new MapBounds(
        new LocationPoint(0, 0),
        new LocationPoint(1, 1),
      );

      const stats = map.queryViewport(bounds);
      expect(stats.points).toHaveLength(0);
      expect(stats.paths).toHaveLength(0);
    });

    it('should efficiently query only relevant grid cells', () => {
      const map = Map.createEmpty();

      // Add points across different regions
      const timestamp = new Date();
      const seattle = new TimelinePoint(47.6062, -122.3321, timestamp);
      const portland = new TimelinePoint(45.5152, -122.6784, timestamp);
      const data1 = new TimelineData([seattle], []);
      const data2 = new TimelineData([portland], []);

      map.addFile(new TimelineFile('seattle.json', data1));
      map.addFile(new TimelineFile('portland.json', data2));

      // Query only Seattle area
      const seattleBounds = new MapBounds(
        new LocationPoint(47.0, -123.0),
        new LocationPoint(48.0, -122.0)
      );

      const stats = map.queryViewport(seattleBounds);
      expect(stats.points).toHaveLength(1);
      expect(stats.paths).toHaveLength(0);
    });

    it('should handle world-spanning viewport', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const worldBounds = new MapBounds(
        new LocationPoint(-90, -180),
        new LocationPoint(90, 180)
      );

      const stats = map.queryViewport(worldBounds);
      expect(stats.points).toHaveLength(2);
      expect(stats.paths).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for empty map', () => {
      const map = Map.createEmpty();
      const stats = map.getStatistics();

      expect(stats).toEqual({ pointsCount: 0, pathsCount: 0 });
    });

    it('should count all points across files', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const stats = map.getStatistics();
      expect(stats).toEqual({ pointsCount: 2, pathsCount: 1 });
    });

    it('should count all paths across files', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const stats = map.getStatistics();
      expect(stats).toEqual({ pointsCount: 2, pathsCount: 1 });
    });

    it('should aggregate statistics from multiple files', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const point3 = new TimelinePoint(45.5152, -122.6784, timestamp);
      const data2 = new TimelineData([point3], []);
      const file2 = new TimelineFile('portland.json', data2);

      map.addFile(file);
      map.addFile(file2);

      const stats = map.getStatistics();
      expect(stats).toEqual({ pointsCount: 3, pathsCount: 1 });
    });
  });

  describe('getAllFiles', () => {
    it('should return empty array for new map', () => {
      const map = Map.createEmpty();
      expect(map.getAllFiles()).toEqual([]);
    });

    it('should return all added files', () => {
      const map = Map.createEmpty();
      const file2 = new TimelineFile('other.json', data);

      map.addFile(file);
      map.addFile(file2);

      const files = map.getAllFiles();
      expect(files).toHaveLength(2);
      expect(files).toContain(file);
      expect(files).toContain(file2);
    });

    it('should return references to actual files', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const files = map.getAllFiles();
      expect(files[0]).toBe(file);
    });
  });

  describe('toJson/fromJson', () => {
    it('should serialize and deserialize empty map', () => {
      const map = Map.createEmpty();
      const json = map.toJson();
      const restored = Map.fromJson(json);

      expect(restored.getAllFiles()).toEqual([]);
    });

    it('should serialize and deserialize map with data', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const json = map.toJson();
      const restored = Map.fromJson(json);

      expect(restored.getAllFiles()).toHaveLength(1);
      expect(restored.getStatistics()).toEqual(map.getStatistics());
    });

    it('should preserve grid structure', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const json = map.toJson();
      const restored = Map.fromJson(json);

      // Query should work on restored map
      const bounds = new MapBounds(
        new LocationPoint(47.0, -123.0),
        new LocationPoint(48.0, -122.0),
      );

      const stats = restored.queryViewport(bounds);
      expect(stats.points).toHaveLength(2);
      expect(stats.paths).toHaveLength(1);
    });

    it('should preserve multiple files', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const point3 = new TimelinePoint(45.5152, -122.6784, timestamp);
      const data2 = new TimelineData([point3], []);
      const file2 = new TimelineFile('portland.json', data2);

      map.addFile(file);
      map.addFile(file2);

      const json = map.toJson();
      const restored = Map.fromJson(json);

      expect(restored.getAllFiles()).toHaveLength(2);
      expect(restored.getStatistics()).toEqual({
        pointsCount: 3,
        pathsCount: 1,
      });
    });

    it('should maintain spatial indexing after deserialization', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const seattle = new TimelinePoint(47.6062, -122.3321, timestamp);
      const portland = new TimelinePoint(45.5152, -122.6784, timestamp);
      const data1 = new TimelineData([seattle], []);
      const data2 = new TimelineData([portland], []);

      map.addFile(new TimelineFile('seattle.json', data1));
      map.addFile(new TimelineFile('portland.json', data2));

      const json = map.toJson();
      const restored = Map.fromJson(json);

      // Query Seattle area should only return Seattle point
      const seattleBounds = new MapBounds(
        new LocationPoint(47.0, -123.0),
        new LocationPoint(48.0, -122.0)
      );

      const seattleStats = restored.queryViewport(seattleBounds);
      expect(seattleStats.points).toHaveLength(1);
      expect(seattleStats.paths).toHaveLength(0);

      // Query Portland area should only return Portland point
      const portlandBounds = new MapBounds(
        new LocationPoint(45.0, -123.0),
        new LocationPoint(46.0, -122.0)
      );

      const portlandStats = restored.queryViewport(portlandBounds);
      expect(portlandStats.points).toHaveLength(1);
      expect(portlandStats.paths).toHaveLength(0);
    });

    it('should handle complex map state', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const timestamp = new Date();
      const point3 = new TimelinePoint(45.5152, -122.6784, timestamp);
      const data2 = new TimelineData([point3], []);
      const file2 = new TimelineFile('portland.json', data2);
      map.addFile(file2);

      // Remove one file before serialization
      map.removeFile(file2);

      const json = map.toJson();
      const restored = Map.fromJson(json);

      expect(restored.getAllFiles()).toHaveLength(1);
      expect(restored.getStatistics()).toEqual({
        pointsCount: 2,
        pathsCount: 1,
      });
    });

    it('should produce valid JSON', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const json = map.toJson();
      const jsonString = JSON.stringify(json);

      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    it('should be idempotent', () => {
      const map = Map.createEmpty();
      map.addFile(file);

      const json1 = map.toJson();
      const restored1 = Map.fromJson(json1);
      const json2 = restored1.toJson();
      const restored2 = Map.fromJson(json2);

      expect(restored1.getStatistics()).toEqual(restored2.getStatistics());
      expect(restored1.getAllFiles().length).toBe(restored2.getAllFiles().length);
    });

    it('should handle empty files in serialization', () => {
      const map = Map.createEmpty();
      const emptyData = new TimelineData([], []);
      const emptyFile = new TimelineFile('empty.json', emptyData);

      map.addFile(emptyFile);

      const json = map.toJson();
      const restored = Map.fromJson(json);

      expect(restored.getAllFiles()).toHaveLength(1);
      expect(restored.getStatistics()).toEqual({ pointsCount: 0, pathsCount: 0 });
    });

    it('should maintain path integrity after serialization round-trip', () => {
      const map = Map.createEmpty();
      
      // Create multiple files with non-overlapping points to avoid duplication
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const p3 = new TimelinePoint(48.0, -122.0, timestamp);
      const p4 = new TimelinePoint(49.0, -123.0, timestamp);
      const p5 = new TimelinePoint(50.0, -124.0, timestamp);
      
      const path1 = new TimelinePath(p1, p2);
      const path2 = new TimelinePath(p2, p3);
      const path3 = new TimelinePath(p4, p5);
      
      const data1 = new TimelineData([p1, p2, p3], [path1, path2]);
      const data2 = new TimelineData([p4, p5], [path3]);
      
      map.addFile(new TimelineFile('file1.json', data1));
      map.addFile(new TimelineFile('file2.json', data2));
      
      // Serialize and deserialize
      const json = map.toJson();
      const restored = Map.fromJson(json);
      
      // Verify all files are restored
      expect(restored.getAllFiles()).toHaveLength(2);
      
      // Verify statistics (5 unique points, 3 paths)
      const stats = restored.getStatistics();
      expect(stats.pointsCount).toBe(5); // p1, p2, p3, p4, p5
      expect(stats.pathsCount).toBe(3); // path1, path2, path3
      
      // Verify each file's data is intact
      const restoredFiles = restored.getAllFiles();
      expect(restoredFiles[0].name).toBe('file1.json');
      expect(restoredFiles[0].data.getPoints()).toHaveLength(3);
      expect(restoredFiles[0].data.getPaths()).toHaveLength(2);
      
      expect(restoredFiles[1].name).toBe('file2.json');
      expect(restoredFiles[1].data.getPoints()).toHaveLength(2);
      expect(restoredFiles[1].data.getPaths()).toHaveLength(1);
    });

    it('should handle multiple serialization cycles without data loss', () => {
      const map = Map.createEmpty();
      map.addFile(file);
      
      // Do 5 rounds of serialization/deserialization
      let currentMap = map;
      for (let i = 0; i < 5; i++) {
        const json = currentMap.toJson();
        currentMap = Map.fromJson(json);
      }
      
      // Verify data is still intact
      expect(currentMap.getAllFiles()).toHaveLength(1);
      expect(currentMap.getStatistics()).toEqual({
        pointsCount: 2,
        pathsCount: 1,
      });
      
      // Verify file data
      const restoredFile = currentMap.getAllFiles()[0];
      expect(restoredFile.name).toBe('seattle.json');
      expect(restoredFile.data.getPoints()).toHaveLength(2);
      expect(restoredFile.data.getPaths()).toHaveLength(1);
    });

    it('should handle serialization with corrupted grid data', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const path = new TimelinePath(p1, p2);
      const data = new TimelineData([p1, p2], [path]);
      const file = new TimelineFile('test.json', data);
      
      map.addFile(file);
      
      // Manually corrupt grid by adding invalid data
      const grid = (map as any).grid;
      const segment = grid[0];
      
      // Add undefined/null points and paths to a segment
      segment.addPoints(p1, null as any, undefined as any);
      segment.addPaths(path, null as any, undefined as any);
      
      // Should not throw during serialization
      expect(() => map.toJson()).not.toThrow();
      
      // Verify serialization produces valid data
      const json = map.toJson();
      expect(json).toBeDefined();
      expect(() => JSON.stringify(json)).not.toThrow();
    });

    it('should handle serialization after file removal with corrupted data', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const path = new TimelinePath(p1, p2);
      const data = new TimelineData([p1, p2], [path]);
      const file = new TimelineFile('test.json', data);
      
      map.addFile(file);
      
      // Serialize, deserialize with corruption, then remove
      const json = map.toJson();
      const corruptedJson = {
        ...json,
        points: [], // Empty points makes paths invalid
        paths: (json as any).paths
      };
      
      const restoredMap = Map.fromJson(corruptedJson);
      const files = restoredMap.getAllFiles();
      
      if (files.length > 0) {
        restoredMap.removeFile(files[0]);
        
        // Should successfully serialize after removal
        expect(() => restoredMap.toJson()).not.toThrow();
        
        const finalJson = restoredMap.toJson();
        expect(finalJson).toBeDefined();
      }
    });

    it('should serialize and deserialize paths correctly', () => {
      const map = Map.createEmpty();
      const timestamp = new Date();
      const p1 = new TimelinePoint(47.6062, -122.3321, timestamp);
      const p2 = new TimelinePoint(47.6205, -122.3493, timestamp);
      const p3 = new TimelinePoint(48.0, -122.0, timestamp);
      const path1 = new TimelinePath(p1, p2);
      const path2 = new TimelinePath(p2, p3);
      
      const data = new TimelineData([p1, p2, p3], [path1, path2]);
      const file = new TimelineFile('test.json', data);
      
      map.addFile(file);
      
      // Check original map has paths
      expect(map.getStatistics()).toEqual({ pointsCount: 3, pathsCount: 2 });
      
      // Serialize
      const json = map.toJson() as any;
      
      // Check JSON has paths array
      expect(json.paths).toBeDefined();
      expect(json.paths).toHaveLength(2);
      expect(json.paths[0]).toHaveProperty('a');
      expect(json.paths[0]).toHaveProperty('b');
      
      // Check files have pathIndices
      expect(json.files).toHaveLength(1);
      expect(json.files[0].pathIndices).toBeDefined();
      expect(json.files[0].pathIndices).toHaveLength(2);
      
      // Deserialize
      const restored = Map.fromJson(json);
      
      // Check restored map has paths
      expect(restored.getStatistics()).toEqual({ pointsCount: 3, pathsCount: 2 });
      
      // Check file in restored map has paths
      const restoredFile = restored.getAllFiles()[0];
      expect(restoredFile.data.getStatistics()).toEqual({ totalPoints: 3, totalPaths: 2 });
      expect(restoredFile.data.getPaths()).toHaveLength(2);
    });
  });

  
});

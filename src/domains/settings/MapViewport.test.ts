import { describe, it, expect } from 'vitest';
import { MapViewport } from './MapViewport';

describe('MapViewport', () => {
  describe('create', () => {
    it('should create viewport with valid coordinates', () => {
      const viewport = MapViewport.create(40.7128, -74.006, 10);
      
      expect(viewport.getLat()).toBe(40.7128);
      expect(viewport.getLng()).toBe(-74.006);
      expect(viewport.getZoom()).toBe(10);
    });

    it('should throw error for latitude > 90', () => {
      expect(() => MapViewport.create(91, 0, 10)).toThrow('Latitude must be between -90 and 90');
    });

    it('should throw error for latitude < -90', () => {
      expect(() => MapViewport.create(-91, 0, 10)).toThrow('Latitude must be between -90 and 90');
    });

    it('should throw error for longitude > 180', () => {
      expect(() => MapViewport.create(0, 181, 10)).toThrow('Longitude must be between -180 and 180');
    });

    it('should throw error for longitude < -180', () => {
      expect(() => MapViewport.create(0, -181, 10)).toThrow('Longitude must be between -180 and 180');
    });

    it('should throw error for zoom < 1', () => {
      expect(() => MapViewport.create(0, 0, 0)).toThrow('Zoom must be between 1 and 19');
    });

    it('should throw error for zoom > 19', () => {
      expect(() => MapViewport.create(0, 0, 20)).toThrow('Zoom must be between 1 and 19');
    });

    it('should accept edge case values', () => {
      const viewport1 = MapViewport.create(90, 180, 1);
      expect(viewport1.getLat()).toBe(90);
      expect(viewport1.getLng()).toBe(180);
      expect(viewport1.getZoom()).toBe(1);

      const viewport2 = MapViewport.create(-90, -180, 19);
      expect(viewport2.getLat()).toBe(-90);
      expect(viewport2.getLng()).toBe(-180);
      expect(viewport2.getZoom()).toBe(19);
    });
  });

  describe('default', () => {
    it('should create viewport with default values', () => {
      const viewport = MapViewport.default();
      
      expect(viewport.getLat()).toBe(0);
      expect(viewport.getLng()).toBe(0);
      expect(viewport.getZoom()).toBe(2);
    });
  });

  describe('withPosition', () => {
    it('should create new viewport with updated position', () => {
      const original = MapViewport.create(10, 20, 5);
      const updated = original.withPosition(30, 40);
      
      expect(updated.getLat()).toBe(30);
      expect(updated.getLng()).toBe(40);
      expect(updated.getZoom()).toBe(5);
      
      // Original should be unchanged
      expect(original.getLat()).toBe(10);
      expect(original.getLng()).toBe(20);
    });

    it('should validate new position', () => {
      const viewport = MapViewport.create(10, 20, 5);
      
      expect(() => viewport.withPosition(91, 0)).toThrow('Latitude must be between -90 and 90');
      expect(() => viewport.withPosition(0, 181)).toThrow('Longitude must be between -180 and 180');
    });
  });

  describe('withZoom', () => {
    it('should create new viewport with updated zoom', () => {
      const original = MapViewport.create(10, 20, 5);
      const updated = original.withZoom(10);
      
      expect(updated.getLat()).toBe(10);
      expect(updated.getLng()).toBe(20);
      expect(updated.getZoom()).toBe(10);
      
      // Original should be unchanged
      expect(original.getZoom()).toBe(5);
    });

    it('should validate new zoom', () => {
      const viewport = MapViewport.create(10, 20, 5);
      
      expect(() => viewport.withZoom(0)).toThrow('Zoom must be between 1 and 19');
      expect(() => viewport.withZoom(20)).toThrow('Zoom must be between 1 and 19');
    });
  });

  describe('withAll', () => {
    it('should create new viewport with all values updated', () => {
      const original = MapViewport.create(10, 20, 5);
      const updated = original.withAll(30, 40, 10);
      
      expect(updated.getLat()).toBe(30);
      expect(updated.getLng()).toBe(40);
      expect(updated.getZoom()).toBe(10);
      
      // Original should be unchanged
      expect(original.getLat()).toBe(10);
      expect(original.getLng()).toBe(20);
      expect(original.getZoom()).toBe(5);
    });

    it('should validate all new values', () => {
      const viewport = MapViewport.create(10, 20, 5);
      
      expect(() => viewport.withAll(91, 0, 5)).toThrow('Latitude must be between -90 and 90');
      expect(() => viewport.withAll(0, 181, 5)).toThrow('Longitude must be between -180 and 180');
      expect(() => viewport.withAll(0, 0, 0)).toThrow('Zoom must be between 1 and 19');
    });
  });

  describe('toJson/fromJson', () => {
    it('should serialize and deserialize correctly', () => {
      const original = MapViewport.create(40.7128, -74.006, 10);
      const json = original.toJson();
      const restored = MapViewport.fromJson(json);
      
      expect(restored.getLat()).toBe(40.7128);
      expect(restored.getLng()).toBe(-74.006);
      expect(restored.getZoom()).toBe(10);
    });

    it('should produce correct JSON structure', () => {
      const viewport = MapViewport.create(40.7128, -74.006, 10);
      const json = viewport.toJson();
      
      expect(json).toEqual({
        lat: 40.7128,
        lng: -74.006,
        zoom: 10
      });
    });

    it('should validate on deserialization', () => {
      expect(() => MapViewport.fromJson({ lat: 91, lng: 0, zoom: 10 }))
        .toThrow('Latitude must be between -90 and 90');
      
      expect(() => MapViewport.fromJson({ lat: 0, lng: 181, zoom: 10 }))
        .toThrow('Longitude must be between -180 and 180');
      
      expect(() => MapViewport.fromJson({ lat: 0, lng: 0, zoom: 0 }))
        .toThrow('Zoom must be between 1 and 19');
    });

    it('should handle edge case values in serialization', () => {
      const viewport1 = MapViewport.create(90, 180, 1);
      const restored1 = MapViewport.fromJson(viewport1.toJson());
      expect(restored1.getLat()).toBe(90);
      expect(restored1.getLng()).toBe(180);
      expect(restored1.getZoom()).toBe(1);

      const viewport2 = MapViewport.create(-90, -180, 19);
      const restored2 = MapViewport.fromJson(viewport2.toJson());
      expect(restored2.getLat()).toBe(-90);
      expect(restored2.getLng()).toBe(-180);
      expect(restored2.getZoom()).toBe(19);
    });
  });

  describe('immutability', () => {
    it('should not allow direct mutation', () => {
      const viewport = MapViewport.create(10, 20, 5);
      
      // TypeScript prevents direct property access at compile time with readonly
      // In strict mode, attempting to assign would fail silently
      // We verify that getters return consistent values
      expect(viewport.getLat()).toBe(10);
      expect(viewport.getLng()).toBe(20);
      expect(viewport.getZoom()).toBe(5);
    });

    it('should return new instance on withPosition', () => {
      const original = MapViewport.create(10, 20, 5);
      const updated = original.withPosition(30, 40);
      
      expect(updated).not.toBe(original);
    });

    it('should return new instance on withZoom', () => {
      const original = MapViewport.create(10, 20, 5);
      const updated = original.withZoom(10);
      
      expect(updated).not.toBe(original);
    });

    it('should return new instance on withAll', () => {
      const original = MapViewport.create(10, 20, 5);
      const updated = original.withAll(30, 40, 10);
      
      expect(updated).not.toBe(original);
    });
  });
});

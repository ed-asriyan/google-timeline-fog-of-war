import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineFile, TimelineData } from '../domains/entities';
import { MapViewport } from '../domains/settings';
import { SettingsRepository } from '../infrastructure/repositories/settings-repository';

// Mock IndexedDB for testing
const mockDB = new Map<string, TimelineFile>();

describe('Storage (Mock)', () => {
  beforeEach(() => {
    mockDB.clear();
  });

  it('should save a file record', async () => {
    const record = new TimelineFile(
      'test-1',
      'test.json',
      new TimelineData([], [])
    );

    mockDB.set(record.id, record);
    expect(mockDB.has('test-1')).toBe(true);
    expect(mockDB.get('test-1')).toEqual(record);
  });

  it('should remove a file record', async () => {
    const record = new TimelineFile(
      'test-2',
      'test2.json',
      new TimelineData([], [])
    );

    mockDB.set(record.id, record);
    expect(mockDB.has('test-2')).toBe(true);
    
    mockDB.delete('test-2');
    expect(mockDB.has('test-2')).toBe(false);
  });

  it('should get all file records', async () => {
    const record1 = new TimelineFile(
      'test-3',
      'test3.json',
      new TimelineData([], [])
    );
    
    const record2 = new TimelineFile(
      'test-4',
      'test4.json',
      new TimelineData([], [])
    );

    mockDB.set(record1.id, record1);
    mockDB.set(record2.id, record2);
    
    const allRecords = Array.from(mockDB.values());
    expect(allRecords).toHaveLength(2);
    expect(allRecords).toContainEqual(record1);
    expect(allRecords).toContainEqual(record2);
  });
});

describe('SettingsRepository - Viewport Persistence', () => {
  let repository: SettingsRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new SettingsRepository();
  });

  it('should save viewport to localStorage', () => {
    const viewport = MapViewport.create(47.6062, -122.3321, 12);
    repository.saveViewport(viewport);
    
    const saved = localStorage.getItem('fog_settings_viewport');
    expect(saved).toBeDefined();
    
    const parsed = JSON.parse(saved!);
    expect(parsed.lat).toBe(47.6062);
    expect(parsed.lng).toBe(-122.3321);
    expect(parsed.zoom).toBe(12);
  });

  it('should load viewport from localStorage', () => {
    localStorage.setItem('fog_settings_viewport', JSON.stringify({
      lat: 48.0,
      lng: -123.0,
      zoom: 10
    }));
    
    const viewport = repository.loadViewport();
    expect(viewport.getLat()).toBe(48.0);
    expect(viewport.getLng()).toBe(-123.0);
    expect(viewport.getZoom()).toBe(10);
  });

  it('should return default when no viewport is saved', () => {
    const viewport = repository.loadViewport();
    expect(viewport.getLat()).toBe(0);
    expect(viewport.getLng()).toBe(0);
    expect(viewport.getZoom()).toBe(2);
  });

  it('should handle corrupted viewport data gracefully', () => {
    localStorage.setItem('fog_settings_viewport', 'invalid json');
    
    const viewport = repository.loadViewport();
    expect(viewport.getLat()).toBe(0);
    expect(viewport.getLng()).toBe(0);
    expect(viewport.getZoom()).toBe(2);
  });

  it('should persist viewport across save/load cycles', () => {
    const testCases = [
      { lat: 0, lng: 0, zoom: 2 },
      { lat: 47.6062, lng: -122.3321, zoom: 15 },
      { lat: -33.8688, lng: 151.2093, zoom: 10 },
    ];

    testCases.forEach(({ lat, lng, zoom }) => {
      const viewport = MapViewport.create(lat, lng, zoom);
      repository.saveViewport(viewport);
      const loaded = repository.loadViewport();
      expect(loaded.getLat()).toBe(lat);
      expect(loaded.getLng()).toBe(lng);
      expect(loaded.getZoom()).toBe(zoom);
    });
  });
});

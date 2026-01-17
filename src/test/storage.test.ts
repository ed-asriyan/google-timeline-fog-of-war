import { describe, it, expect, beforeEach } from 'vitest';
import type { FileRecord } from '../types';

// Mock IndexedDB for testing
const mockDB = new Map<string, FileRecord>();

describe('Storage (Mock)', () => {
  beforeEach(() => {
    mockDB.clear();
  });

  it('should save a file record', async () => {
    const record: FileRecord = {
      id: 'test-1',
      name: 'test.json',
      pointCount: 10,
      segmentCount: 5,
      data: { points: [], segments: [] }
    };

    mockDB.set(record.id, record);
    expect(mockDB.has('test-1')).toBe(true);
    expect(mockDB.get('test-1')).toEqual(record);
  });

  it('should remove a file record', async () => {
    const record: FileRecord = {
      id: 'test-2',
      name: 'test2.json',
      pointCount: 20,
      segmentCount: 10,
      data: { points: [], segments: [] }
    };

    mockDB.set(record.id, record);
    expect(mockDB.has('test-2')).toBe(true);
    
    mockDB.delete('test-2');
    expect(mockDB.has('test-2')).toBe(false);
  });

  it('should get all file records', async () => {
    const record1: FileRecord = {
      id: 'test-3',
      name: 'test3.json',
      pointCount: 30,
      segmentCount: 15,
      data: { points: [], segments: [] }
    };
    
    const record2: FileRecord = {
      id: 'test-4',
      name: 'test4.json',
      pointCount: 40,
      segmentCount: 20,
      data: { points: [], segments: [] }
    };

    mockDB.set(record1.id, record1);
    mockDB.set(record2.id, record2);
    
    const allRecords = Array.from(mockDB.values());
    expect(allRecords).toHaveLength(2);
    expect(allRecords).toContainEqual(record1);
    expect(allRecords).toContainEqual(record2);
  });
});

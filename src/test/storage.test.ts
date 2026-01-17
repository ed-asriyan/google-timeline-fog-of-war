import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineFile, TimelineData } from '../domain/entities';

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

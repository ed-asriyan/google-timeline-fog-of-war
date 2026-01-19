// Infrastructure Layer: Storage repository

import { Map } from '../../domains/map';

const DB_NAME = 'LocationFogDB';
const STORE_NAME = 'map';
const DB_VERSION = 2;

/**
 * Repository for map aggregate using IndexedDB
 * Stores the entire map with all files and spatial indices
 */
export class TimelineFileRepository {
  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Clean up old store if it exists
        if (db.objectStoreNames.contains('files')) {
          db.deleteObjectStore('files');
        }
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveMap(map: Map): Promise<void> {
    const db = await this.getDB();
    const mapData = map.toJson();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: 'main', data: mapData });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async loadMap(): Promise<Map> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('main');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(Map.fromJson(req.result.data));
        } else {
          resolve(Map.createEmpty());
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

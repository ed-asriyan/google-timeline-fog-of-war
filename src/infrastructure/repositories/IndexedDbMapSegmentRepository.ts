import { MapSegmentRepository, MapSegment, TimelinePoint, TimelinePath } from "../../domains/map/ports";
import { getSegmentIdForPoints, getSegmentIdsForPath } from "../../domains/map/grid";

export class IndexedDbMapSegmentRepository implements MapSegmentRepository {
    private static readonly dbName = 'TimelineMapDB';
    private static readonly storeName = 'MapSegments';
    static dbVersion = 2;

    private db: IDBDatabase;

    private constructor(db: IDBDatabase) {
        this.db = db;
    }

    async saveSegment(segment: MapSegment): Promise<void> {
        const record = {
            id: segment.index,
            points: segment.group.points.map(p => ({ lat: p.lat, lon: p.lon, timestamp: p.timestamp })),
            paths: segment.group.paths.map(p => ({ points: p.points.map(pt => ({ lat: pt.lat, lon: pt.lon, timestamp: pt.timestamp })) })),
        };
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(IndexedDbMapSegmentRepository.storeName, 'readwrite');
            const store = tx.objectStore(IndexedDbMapSegmentRepository.storeName);
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async loadSegment(id: number): Promise<MapSegment> {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(IndexedDbMapSegmentRepository.storeName, 'readonly');
            const store = tx.objectStore(IndexedDbMapSegmentRepository.storeName);
            const req = store.get(id);
            req.onsuccess = () => {
                const record = req.result;
                if (!record) {
                    resolve({ index: id, group: { points: [], paths: [] } });
                    return;
                }
                const points = record.points ?? [];
                const paths = record.paths ?? [];
                
                resolve({ 
                    index: id, 
                    group: { points, paths } 
                });
            };
            req.onerror = () => reject(req.error);
        });
    }

    async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(IndexedDbMapSegmentRepository.storeName, 'readwrite');
            const store = tx.objectStore(IndexedDbMapSegmentRepository.storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async hasData(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(IndexedDbMapSegmentRepository.storeName, 'readonly');
            const store = tx.objectStore(IndexedDbMapSegmentRepository.storeName);
            const req = store.count();
            req.onsuccess = () => resolve(req.result > 0);
            req.onerror = () => reject(req.error);
        });
    }

    private async reprocessAllData(): Promise<void> {
        const allRecords: Array<{ id: number; points: TimelinePoint[]; paths: TimelinePath[] }> =
            await new Promise((resolve, reject) => {
                const tx = this.db.transaction(IndexedDbMapSegmentRepository.storeName, 'readonly');
                const req = tx.objectStore(IndexedDbMapSegmentRepository.storeName).getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

        const allPoints: TimelinePoint[] = allRecords.flatMap(r => r.points ?? []);
        const allPaths: TimelinePath[] = allRecords.flatMap(r => r.paths ?? []);

        const pointsBySegment = getSegmentIdForPoints(allPoints);

        const pathsBySegment: Record<number, TimelinePath[]> = {};
        for (const path of allPaths) {
            for (const segmentId of getSegmentIdsForPath(path)) {
                if (!pathsBySegment[segmentId]) pathsBySegment[segmentId] = [];
                pathsBySegment[segmentId].push(path);
            }
        }

        const allSegmentIds = new Set([
            ...Object.keys(pointsBySegment).map(Number),
            ...Object.keys(pathsBySegment).map(Number),
        ]);

        await new Promise<void>((resolve, reject) => {
            const tx = this.db.transaction(IndexedDbMapSegmentRepository.storeName, 'readwrite');
            const store = tx.objectStore(IndexedDbMapSegmentRepository.storeName);
            store.clear();
            for (const segmentId of allSegmentIds) {
                store.put({
                    id: segmentId,
                    points: pointsBySegment[segmentId] ?? [],
                    paths: pathsBySegment[segmentId] ?? [],
                });
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    static async openDb(): Promise<IndexedDbMapSegmentRepository> {
        return new Promise((resolve, reject) => {
            let needsMigration = false;
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;

                if (oldVersion < 1) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
                if (oldVersion >= 1 && oldVersion < 2) {
                    needsMigration = true;
                }
            };

            request.onsuccess = () => {
                const repo = new IndexedDbMapSegmentRepository(request.result as IDBDatabase);
                if (needsMigration) {
                    repo.reprocessAllData().then(() => resolve(repo)).catch(reject);
                } else {
                    resolve(repo);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}

import { MapSegment } from "@/domains/map/MapSegment";
import { TimelinePoint } from "@/domains/map/TimelinePoint";
import { TimelinePath } from "@/domains/map/TimelinePath";
import { MapSegmentRepository } from "@/domains/ports";

export class IndexedDbMapSegmentRepository implements MapSegmentRepository {
    private static readonly dbName = 'TimelineMapDB';
    private static readonly storeName = 'MapSegments';
    static dbVersion = 1;

    private db: IDBDatabase;

    private constructor(db: IDBDatabase) {
        this.db = db;
    }

    async saveSegment(segment: MapSegment): Promise<void> {
        const record = {
            id: segment.index,
            points: segment.getPoints().map(p => p.toJson()),
            paths: segment.getPaths().map(p => p.toJson()),
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
                    resolve(new MapSegment(id));
                    return;
                }
                const segment = new MapSegment(id);
                const points: TimelinePoint[] = (record.points ?? []).map(TimelinePoint.fromJson);
                const paths: TimelinePath[] = (record.paths ?? []).map(TimelinePath.fromJson);
                segment.addPoints(...points);
                segment.addPaths(...paths);
                resolve(segment);
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

    static async openDb(): Promise<IndexedDbMapSegmentRepository> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                db.createObjectStore(this.storeName, { keyPath: 'id' });
            };

            request.onsuccess = () => {
                resolve(new IndexedDbMapSegmentRepository((request.result as IDBDatabase)));
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}

/**
 * TimelineFile Entity
 * Represents a file imported by user
 */

import { TimelineData } from './TimelineData';

/**
 * Generates a unique ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Represents a file imported by user
 */
export class TimelineFile {
    readonly id: string;
    readonly name: string;
    readonly data: TimelineData;

    constructor(name: string, data: TimelineData, id?: string) {
        this.id = id || generateId();
        this.name = name;
        this.data = data;
    }
}

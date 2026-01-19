/**
 * Value Objects for Settings Domain
 * Immutable objects representing user preferences
 */

/**
 * Immutable configuration for fog of war visualization
 */

export const MIN_FOG_RADIUS_KM = 0.01;
export const MAX_FOG_RADIUS_KM = 1;
export const MIN_FOG_PATH_KM = 0.01;
export const MAX_FOG_PATH_KM = 100;

export const DEFAULT_FOG_RADIUS_KM = 0.2;
export const DEFAULT_FOG_PATH_KM = 3;
export const DEFAULT_FOG_PATH_CONNECT = false;

export class FogSettings {
    private radius: number;
    private connectPaths: boolean;
    private pathLengthKm: number;

    constructor(radius: number, connectPaths: boolean, pathLengthKm: number) {
        this.radius = radius;
        this.connectPaths = connectPaths;
        this.pathLengthKm = pathLengthKm;
    }

    /**
     * Create default settings
     */
    static default(): FogSettings {
        return new FogSettings(
            DEFAULT_FOG_RADIUS_KM,
            DEFAULT_FOG_PATH_CONNECT,
            DEFAULT_FOG_PATH_KM
        );
    }

    getRadius(): number {
        return this.radius;
    }

    getConnectPaths(): boolean {
        return this.connectPaths;
    }

    getPathLengthKm(): number {
        return this.pathLengthKm;
    }

    setRadius(radius: number): void {
        this.radius = radius;
    }

    setConnectPaths(connect: boolean): void {
        this.connectPaths = connect;
    }

    setPathLengthKm(length: number): void {
        this.pathLengthKm = length;
    }

    /**
     * Serialize to JSON
     */
    toJson(): object {
        return {
            radius: this.radius,
            connectPaths: this.connectPaths,
            pathLengthKm: this.pathLengthKm
        };
    }

    /**
     * Deserialize from JSON
     */
    static fromJson(json: any): FogSettings {
        return new FogSettings(
            json.radius,
            json.connectPaths,
            json.pathLengthKm
        );
    }
}

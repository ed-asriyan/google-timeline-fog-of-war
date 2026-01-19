/**
 * MapViewport Value Object
 * Represents the user's current map view position and zoom level
 */

export class MapViewport {
    private readonly lat: number;
    private readonly lng: number;
    private readonly zoom: number;

    private constructor(lat: number, lng: number, zoom: number) {
        if (lat < -90 || lat > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (lng < -180 || lng > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }
        if (zoom < 1 || zoom > 19) {
            throw new Error('Zoom must be between 1 and 19');
        }

        this.lat = lat;
        this.lng = lng;
        this.zoom = zoom;
    }

    static create(lat: number, lng: number, zoom: number): MapViewport {
        return new MapViewport(lat, lng, zoom);
    }

    static default(): MapViewport {
        return new MapViewport(0, 0, 2);
    }

    getLat(): number {
        return this.lat;
    }

    getLng(): number {
        return this.lng;
    }

    getZoom(): number {
        return this.zoom;
    }

    withPosition(lat: number, lng: number): MapViewport {
        return new MapViewport(lat, lng, this.zoom);
    }

    withZoom(zoom: number): MapViewport {
        return new MapViewport(this.lat, this.lng, zoom);
    }

    withAll(lat: number, lng: number, zoom: number): MapViewport {
        return new MapViewport(lat, lng, zoom);
    }

    toJson(): { lat: number; lng: number; zoom: number } {
        return {
            lat: this.lat,
            lng: this.lng,
            zoom: this.zoom,
        };
    }

    static fromJson(data: any): MapViewport {
        return new MapViewport(
            data.lat ?? 0,
            data.lng ?? 0,
            data.zoom ?? 2
        );
    }
}

// Domain Layer: Value Objects for configuration

/**
 * Fog of war visualization settings
 */
export class FogSettings {
  constructor(
    public readonly radiusKm: number,
    public readonly showRoads: boolean,
    public readonly maxLinkDistanceKm: number
  ) {
    if (radiusKm < 0.05 || radiusKm > 10) {
      throw new Error(`Invalid radius: ${radiusKm}. Must be between 0.05 and 10 km`);
    }
    if (maxLinkDistanceKm < 0 || maxLinkDistanceKm > 10000) {
      throw new Error(`Invalid max link distance: ${maxLinkDistanceKm}`);
    }
  }

  static default(): FogSettings {
    return new FogSettings(0.1, false, 2);
  }

  withRadius(radiusKm: number): FogSettings {
    return new FogSettings(radiusKm, this.showRoads, this.maxLinkDistanceKm);
  }

  withShowRoads(showRoads: boolean): FogSettings {
    return new FogSettings(this.radiusKm, showRoads, this.maxLinkDistanceKm);
  }

  withMaxLinkDistance(maxLinkDistanceKm: number): FogSettings {
    return new FogSettings(this.radiusKm, this.showRoads, maxLinkDistanceKm);
  }

  toJSON() {
    return {
      radiusKm: this.radiusKm,
      showRoads: this.showRoads,
      maxLinkDistanceKm: this.maxLinkDistanceKm
    };
  }

  static fromJSON(json: any): FogSettings {
    return new FogSettings(
      json.radiusKm ?? 0.1,
      json.showRoads ?? false,
      json.maxLinkDistanceKm ?? 5
    );
  }
}

/**
 * Map viewport settings (center and zoom)
 */
export class MapViewport {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
    public readonly zoom: number
  ) {
    if (lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90`);
    }
    if (lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude: ${lng}. Must be between -180 and 180`);
    }
    if (zoom < 1 || zoom > 19) {
      throw new Error(`Invalid zoom: ${zoom}. Must be between 1 and 19`);
    }
  }

  static default(): MapViewport {
    return new MapViewport(47.6062, -122.3321, 11);
  }

  withCenter(lat: number, lng: number): MapViewport {
    return new MapViewport(lat, lng, this.zoom);
  }

  withZoom(zoom: number): MapViewport {
    return new MapViewport(this.lat, this.lng, zoom);
  }

  toJSON() {
    return {
      lat: this.lat,
      lng: this.lng,
      zoom: this.zoom
    };
  }

  static fromJSON(json: any): MapViewport {
    return new MapViewport(
      json.lat ?? 47.6062,
      json.lng ?? -122.3321,
      json.zoom ?? 11
    );
  }
}

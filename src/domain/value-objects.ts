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
    return new FogSettings(0.5, false, 50);
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
      json.radiusKm ?? 0.5,
      json.showRoads ?? false,
      json.maxLinkDistanceKm ?? 50
    );
  }
}

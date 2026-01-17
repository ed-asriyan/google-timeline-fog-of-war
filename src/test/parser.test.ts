import { describe, it, expect } from 'vitest';
import { TimelineParserFactory } from '../infrastructure/parsers/timeline-parser';

describe('Timeline Parser', () => {
  describe('iOS Format', () => {
    const iosData = [
      {
        "endTime": "2024-10-05T14:21:57.000-07:00",
        "startTime": "2024-09-29T22:22:57.999-07:00",
        "visit": {
          "hierarchyLevel": "0",
          "topCandidate": {
            "probability": "0.476300",
            "semanticType": "Home",
            "placeID": "ChIJw0ZpFQAVkFQRiOO1Hk38FEI",
            "placeLocation": "geo:47.620258,-122.356943"
          },
          "probability": "0.624416"
        }
      },
      {
        "endTime": "2024-10-05T14:36:22.040-07:00",
        "startTime": "2024-10-05T14:21:57.000-07:00",
        "activity": {
          "probability": "0.840685",
          "end": "geo:47.618593,-122.355873",
          "topCandidate": {
            "type": "walking",
            "probability": "0.522378"
          },
          "distanceMeters": "240.893555",
          "start": "geo:47.620288,-122.356680"
        }
      }
    ];

    it('should detect iOS format', () => {
      expect(TimelineParserFactory.detectFormat(iosData)).toBe('ios');
    });

    it('should extract points from iOS data', () => {
      const result = TimelineParserFactory.parse(iosData);
      expect(result.points.length).toBeGreaterThan(0);
      expect(result.points[0]).toHaveProperty('lat');
      expect(result.points[0]).toHaveProperty('lon');
    });

    it('should extract segments from iOS activities', () => {
      const result = TimelineParserFactory.parse(iosData);
      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.segments[0]).toHaveProperty('start');
      expect(result.segments[0]).toHaveProperty('end');
      expect(result.segments[0]).toHaveProperty('lengthKm');
    });

    it('should parse visit locations correctly', () => {
      const result = TimelineParserFactory.parse(iosData);
      const visitPoint = result.points[0];
      expect(visitPoint.lat).toBeCloseTo(47.620258, 5);
      expect(visitPoint.lon).toBeCloseTo(-122.356943, 5);
    });

    it('should parse activity start/end locations correctly', () => {
      const result = TimelineParserFactory.parse(iosData);
      // Should have visit point + activity start + activity end + gap segment
      expect(result.points.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Android Format', () => {
    const androidData = {
      "semanticSegments": [
        {
          "startTime": "2024-09-29T22:22:57.000-07:00",
          "endTime": "2024-10-05T14:21:57.000-07:00",
          "visit": {
            "hierarchyLevel": 0,
            "probability": 0.6244155764579773,
            "topCandidate": {
              "placeId": "ChIJw0ZpFQAVkFQRiOO1Hk38FEI",
              "semanticType": "HOME",
              "probability": 0.476299524307251,
              "placeLocation": {
                "latLng": "47.6202577°, -122.3569428°"
              }
            }
          }
        },
        {
          "startTime": "2024-10-05T14:21:57.000-07:00",
          "endTime": "2024-10-05T14:36:22.000-07:00",
          "activity": {
            "start": {
              "latLng": "47.6202876°, -122.3566803°"
            },
            "end": {
              "latLng": "47.6185934°, -122.3558732°"
            },
            "distanceMeters": 240.8935546875,
            "probability": 0.8406848907470703,
            "topCandidate": {
              "type": "WALKING",
              "probability": 0.5223778486251831
            }
          }
        },
        {
          "startTime": "2024-10-05T14:00:00.000-07:00",
          "endTime": "2024-10-05T16:00:00.000-07:00",
          "timelinePath": [
            {
              "point": "47.6205084°, -122.3569236°",
              "time": "2024-10-05T14:06:00.000-07:00"
            },
            {
              "point": "47.6202876°, -122.3566803°",
              "time": "2024-10-05T14:22:00.000-07:00"
            }
          ]
        }
      ]
    };

    it('should detect Android format', () => {
      expect(TimelineParserFactory.detectFormat(androidData)).toBe('android');
    });

    it('should extract points from Android data', () => {
      const result = TimelineParserFactory.parse(androidData);
      expect(result.points.length).toBeGreaterThan(0);
      expect(result.points[0]).toHaveProperty('lat');
      expect(result.points[0]).toHaveProperty('lon');
    });

    it('should extract segments from Android activities', () => {
      const result = TimelineParserFactory.parse(androidData);
      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.segments[0]).toHaveProperty('start');
      expect(result.segments[0]).toHaveProperty('end');
      expect(result.segments[0]).toHaveProperty('lengthKm');
    });

    it('should parse latLng format correctly', () => {
      const result = TimelineParserFactory.parse(androidData);
      const visitPoint = result.points[0];
      expect(visitPoint.lat).toBeCloseTo(47.6202577, 5);
      expect(visitPoint.lon).toBeCloseTo(-122.3569428, 5);
    });

    it('should handle timelinePath entries', () => {
      const result = TimelineParserFactory.parse(androidData);
      // Should include points from timelinePath
      expect(result.points.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Format Detection', () => {
    it('should detect unknown format for invalid data', () => {
      expect(TimelineParserFactory.detectFormat(null)).toBe('unknown');
      expect(TimelineParserFactory.detectFormat({})).toBe('unknown');
      expect(TimelineParserFactory.detectFormat("string")).toBe('unknown');
    });

    it('should handle empty arrays', () => {
      const result = TimelineParserFactory.parse([]);
      expect(result.points).toEqual([]);
      expect(result.segments).toEqual([]);
    });

    it('should handle empty semanticSegments', () => {
      const result = TimelineParserFactory.parse({ semanticSegments: [] });
      expect(result.points).toEqual([]);
      expect(result.segments).toEqual([]);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate segment distances', () => {
      const testData = [
        {
          "startTime": "2024-10-05T14:21:57.000-07:00",
          "endTime": "2024-10-05T14:36:22.040-07:00",
          "activity": {
            "start": "geo:47.620258,-122.356943",
            "end": "geo:47.618593,-122.355873"
          }
        }
      ];
      
      const result = TimelineParserFactory.parse(testData);
      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.segments[0].lengthKm).toBeGreaterThan(0);
      // Distance should be small for nearby points
      expect(result.segments[0].lengthKm).toBeLessThan(1);
    });
  });
});


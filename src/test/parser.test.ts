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

    it('should handle iOS timelinePath with many points', () => {
      const expectedPoints = [
        { lat: 18.532196, lon: 73.829529 },
        { lat: 18.533230, lon: 73.829739 },
        { lat: 18.529576, lon: 73.832626 },
        { lat: 18.549497, lon: 73.902705 },
        { lat: 18.549497, lon: 73.902705 },
      ];

      const iosTimelinePathData = [
        {
          "startTime": "2024-10-05T10:00:00.000-07:00",
          "endTime": "2024-10-05T12:00:00.000-07:00",
          "timelinePath": [
            {
              "point": "geo:18.532196,73.829529",
              "durationMinutesOffsetFromStartTime": "18"
            },
            {
              "point": "geo:18.533230,73.829739",
              "durationMinutesOffsetFromStartTime": "92"
            },
            {
              "point": "geo:18.529576,73.832626",
              "durationMinutesOffsetFromStartTime": "93"
            },
            {
              "point": "geo:18.549497,73.902705",
              "durationMinutesOffsetFromStartTime": "111"
            },
            {
              "point": "geo:18.549497,73.902705",
              "durationMinutesOffsetFromStartTime": "111"
            }
          ]
        }
      ];

      const result = TimelineParserFactory.parse(iosTimelinePathData);
      
      // Should parse all 5 points from the timelinePath
      expect(result.points.length).toBe(5);
      
      // Verify each point is parsed correctly
      expectedPoints.forEach((expected, index) => {
        expect(result.points[index].lat).toBeCloseTo(expected.lat, 5);
        expect(result.points[index].lon).toBeCloseTo(expected.lon, 5);
      });
      
      // Should create 4 segments between consecutive points (n-1 segments for n points)
      expect(result.segments.length).toBe(4);
      
      // Verify segments have valid distances (note: some may be 0 for duplicate points)
      result.segments.forEach(segment => {
        expect(segment.lengthKm).toBeGreaterThanOrEqual(0);
      });
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

    it('should handle timelinePath with many points', () => {
      const expectedPoints = [
        { lat: 47.6205084, lon: -122.3569236 },
        { lat: 47.6202876, lon: -122.3566803 },
        { lat: 47.619731, lon: -122.3568086 },
        { lat: 47.6194173, lon: -122.3566953 },
        { lat: 47.6193852, lon: -122.3565725 },
        { lat: 47.6193694, lon: -122.356568 },
        { lat: 47.6190279, lon: -122.3568431 },
        { lat: 47.6185934, lon: -122.3558732 },
        { lat: 47.6185918, lon: -122.3528953 },
        { lat: 47.6171194, lon: -122.3488659 },
        { lat: 47.6158909, lon: -122.3468127 },
        { lat: 47.6143847, lon: -122.344269 },
        { lat: 47.6095001, lon: -122.3375728 },
        { lat: 47.6074547, lon: -122.3370821 },
        { lat: 47.6061813, lon: -122.3396878 },
        { lat: 47.6063375, lon: -122.3407017 },
      ];

      const timelinePathData = {
        "semanticSegments": [
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
              },
              {
                "point": "47.619731°, -122.3568086°",
                "time": "2024-10-05T14:25:00.000-07:00"
              },
              {
                "point": "47.6194173°, -122.3566953°",
                "time": "2024-10-05T14:26:00.000-07:00"
              },
              {
                "point": "47.6193852°, -122.3565725°",
                "time": "2024-10-05T14:29:00.000-07:00"
              },
              {
                "point": "47.6193694°, -122.356568°",
                "time": "2024-10-05T14:30:00.000-07:00"
              },
              {
                "point": "47.6190279°, -122.3568431°",
                "time": "2024-10-05T14:35:00.000-07:00"
              },
              {
                "point": "47.6185934°, -122.3558732°",
                "time": "2024-10-05T14:36:00.000-07:00"
              },
              {
                "point": "47.6185918°, -122.3528953°",
                "time": "2024-10-05T14:37:00.000-07:00"
              },
              {
                "point": "47.6171194°, -122.3488659°",
                "time": "2024-10-05T14:38:00.000-07:00"
              },
              {
                "point": "47.6158909°, -122.3468127°",
                "time": "2024-10-05T14:39:00.000-07:00"
              },
              {
                "point": "47.6143847°, -122.344269°",
                "time": "2024-10-05T14:40:00.000-07:00"
              },
              {
                "point": "47.6095001°, -122.3375728°",
                "time": "2024-10-05T14:44:00.000-07:00"
              },
              {
                "point": "47.6074547°, -122.3370821°",
                "time": "2024-10-05T14:46:00.000-07:00"
              },
              {
                "point": "47.6061813°, -122.3396878°",
                "time": "2024-10-05T14:50:00.000-07:00"
              },
              {
                "point": "47.6063375°, -122.3407017°",
                "time": "2024-10-05T14:52:00.000-07:00"
              }
            ]
          }
        ]
      };

      const result = TimelineParserFactory.parse(timelinePathData);
      
      // Should parse all 16 points from the timelinePath
      expect(result.points.length).toBe(16);
      
      // Verify each point is parsed correctly
      expectedPoints.forEach((expected, index) => {
        expect(result.points[index].lat).toBeCloseTo(expected.lat, 5);
        expect(result.points[index].lon).toBeCloseTo(expected.lon, 5);
      });
      
      // Should create 15 segments between consecutive points (n-1 segments for n points)
      expect(result.segments.length).toBe(15);
      
      // Verify segments have valid distances
      result.segments.forEach(segment => {
        expect(segment.lengthKm).toBeGreaterThan(0);
      });
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


import type { LocationPoint, LocationSegment, ExtractedData, TimelineEntry, TimelineFormat } from '../types';

// Haversine formula for distance calculation
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Parse iOS format: "geo:47.620258,-122.356943"
const parseGeoString = (geoStr: string | undefined): LocationPoint | null => {
  if (!geoStr || !geoStr.startsWith('geo:')) return null;
  const parts = geoStr.replace('geo:', '').split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
};

// Parse Android format: "47.6204665°, -122.3569255°"
const parseLatLngString = (latLngStr: string | undefined): LocationPoint | null => {
  if (!latLngStr) return null;
  const parts = latLngStr.replace(/°/g, '').split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
};

// Detect timeline format
export const detectTimelineFormat = (data: any): TimelineFormat => {
  if (Array.isArray(data)) {
    // iOS format is an array
    if (data.length > 0 && data[0].activity?.start?.startsWith?.('geo:')) {
      return 'ios';
    }
    if (data.length > 0 && data[0].visit?.topCandidate?.placeLocation?.startsWith?.('geo:')) {
      return 'ios';
    }
  } else if (data && typeof data === 'object' && Array.isArray(data.semanticSegments)) {
    // Android format has semanticSegments
    return 'android';
  }
  return 'unknown';
};

// Parse iOS timeline entry
const parseIOSEntry = (entry: any): TimelineEntry | null => {
  let startLoc: LocationPoint | null = null;
  let endLoc: LocationPoint | null = null;
  let isPath = false;

  if (entry.activity) {
    startLoc = parseGeoString(entry.activity.start);
    endLoc = parseGeoString(entry.activity.end);
    isPath = true;
  } else if (entry.visit?.topCandidate?.placeLocation) {
    const loc = parseGeoString(entry.visit.topCandidate.placeLocation);
    startLoc = loc;
    endLoc = loc;
  }

  if (!startLoc || !endLoc) return null;

  return {
    startTime: entry.startTime,
    endTime: entry.endTime,
    startLoc,
    endLoc,
    isPath,
  };
};

// Parse Android timeline entry
const parseAndroidEntry = (entry: any): TimelineEntry | null => {
  let startLoc: LocationPoint | null = null;
  let endLoc: LocationPoint | null = null;
  let isPath = false;

  if (entry.activity) {
    startLoc = parseLatLngString(entry.activity.start?.latLng);
    endLoc = parseLatLngString(entry.activity.end?.latLng);
    isPath = true;
  } else if (entry.visit?.topCandidate?.placeLocation?.latLng) {
    const loc = parseLatLngString(entry.visit.topCandidate.placeLocation.latLng);
    startLoc = loc;
    endLoc = loc;
  } else if (entry.timelinePath && Array.isArray(entry.timelinePath)) {
    // Handle timelinePath entries (Android-specific)
    const points = entry.timelinePath
      .map((p: any) => parseLatLngString(p.point))
      .filter((p: LocationPoint | null): p is LocationPoint => p !== null);
    
    if (points.length > 0) {
      startLoc = points[0];
      endLoc = points[points.length - 1];
      isPath = points.length > 1;
    }
  }

  if (!startLoc || !endLoc) return null;

  return {
    startTime: entry.startTime,
    endTime: entry.endTime,
    startLoc,
    endLoc,
    isPath,
  };
};

// Main extraction function
export const extractTimelineData = (data: any): ExtractedData => {
  const points: LocationPoint[] = [];
  const segments: LocationSegment[] = [];

  const format = detectTimelineFormat(data);
  if (format === 'unknown') {
    console.warn('Unknown timeline format');
    return { points, segments };
  }

  // Normalize to array of entries
  const entries: any[] = format === 'ios' ? data : data.semanticSegments;
  const parseEntry = format === 'ios' ? parseIOSEntry : parseAndroidEntry;

  // Parse and sort entries
  const parsedEntries = entries
    .map(parseEntry)
    .filter((e): e is TimelineEntry => e !== null)
    .sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    });

  // Extract points and segments
  for (let i = 0; i < parsedEntries.length; i++) {
    const curr = parsedEntries[i];

    // Add start point
    if (curr.startLoc) {
      points.push(curr.startLoc);
    }

    // Add end point if different from start
    if (
      curr.endLoc &&
      (curr.endLoc.lat !== curr.startLoc?.lat || curr.endLoc.lon !== curr.startLoc?.lon)
    ) {
      points.push(curr.endLoc);
    }

    // Add segment for paths (activities)
    if (curr.isPath && curr.startLoc && curr.endLoc) {
      segments.push({
        start: curr.startLoc,
        end: curr.endLoc,
        lengthKm: calculateDistanceKm(
          curr.startLoc.lat,
          curr.startLoc.lon,
          curr.endLoc.lat,
          curr.endLoc.lon
        ),
      });
    }

    // Add gap segment between consecutive entries
    if (i > 0) {
      const prev = parsedEntries[i - 1];
      if (prev.endLoc && curr.startLoc) {
        const gapDist = calculateDistanceKm(
          prev.endLoc.lat,
          prev.endLoc.lon,
          curr.startLoc.lat,
          curr.startLoc.lon
        );
        segments.push({
          start: prev.endLoc,
          end: curr.startLoc,
          lengthKm: gapDist,
        });
      }
    }
  }

  return { points, segments };
};

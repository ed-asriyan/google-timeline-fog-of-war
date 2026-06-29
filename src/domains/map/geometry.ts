import { TimelinePath } from './ports';

export function calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLon = (point2.lon - point1.lon) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculatePathLengthKm(path: TimelinePath): number {
  let length = 0;
  for (let i = 1; i < path.points.length; i++) {
      length += calculateDistance(path.points[i - 1], path.points[i]);
  }
  return length;
}

export function calculatePathVelocityKmh(path: TimelinePath, lengthKm: number): number {
  if (path.points.length < 2) return 0;
  const first = path.points[0];
  const last = path.points[path.points.length - 1];
  const durationMs = last.timestamp - first.timestamp;
  if (durationMs <= 0) return Infinity; // or 0 if length is 0, but let's say Infinity
  const durationHours = durationMs / (1000 * 60 * 60);
  return lengthKm / durationHours;
}

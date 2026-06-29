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

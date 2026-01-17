// Presentation Layer: Map management hook

import { useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { LocationPoint, LocationSegment } from '../../domain/entities';
import { FogSettings } from '../../domain/value-objects';

interface UseMapResult {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  centerOnPoint: (point: LocationPoint) => void;
}

export function useMap(
  points: LocationPoint[],
  segments: LocationSegment[],
  settings: FogSettings
): UseMapResult {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([47.6062, -122.3321], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw fog overlay
  const drawCanvas = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const size = map.getSize();
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x;
      canvas.height = size.y;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with fog
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Erase explored areas
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';

    const center = map.getCenter();
    const metersPerPixel =
      (40075016.686 * Math.abs(Math.cos((center.lat * Math.PI) / 180))) /
      Math.pow(2, map.getZoom() + 8);
    const pixelRadius = (settings.radiusKm * 1000) / metersPerPixel;

    if (pixelRadius < 0.5) {
      ctx.globalCompositeOperation = 'source-over';
      return;
    }

    const bounds = map.getBounds();
    const pad = settings.radiusKm / 111;
    const minLat = bounds.getSouth() - pad;
    const maxLat = bounds.getNorth() + pad;
    const minLon = bounds.getWest() - pad;
    const maxLon = bounds.getEast() + pad;

    // Draw roads
    if (settings.showRoads) {
      ctx.beginPath();
      ctx.lineWidth = pixelRadius * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const segment of segments) {
        if (segment.lengthKm > settings.maxLinkDistanceKm) continue;

        const { start, end } = segment;
        if (
          (start.lat < minLat && end.lat < minLat) ||
          (start.lat > maxLat && end.lat > maxLat) ||
          (start.lon < minLon && end.lon < minLon) ||
          (start.lon > maxLon && end.lon > maxLon)
        ) {
          continue;
        }

        const p1 = map.latLngToContainerPoint([start.lat, start.lon]);
        const p2 = map.latLngToContainerPoint([end.lat, end.lon]);

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    // Draw points
    ctx.beginPath();
    for (const point of points) {
      if (
        point.lat < minLat ||
        point.lat > maxLat ||
        point.lon < minLon ||
        point.lon > maxLon
      )
        continue;

      const pt = map.latLngToContainerPoint([point.lat, point.lon]);
      ctx.moveTo(pt.x + pixelRadius, pt.y);
      ctx.arc(pt.x, pt.y, pixelRadius, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
  }, [points, segments, settings]);

  // Bind redraw events
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    drawCanvas();

    map.on('move', drawCanvas);
    map.on('zoom', drawCanvas);
    map.on('resize', drawCanvas);

    return () => {
      map.off('move', drawCanvas);
      map.off('zoom', drawCanvas);
      map.off('resize', drawCanvas);
    };
  }, [drawCanvas]);

  // Center map on first point when data loads
  useEffect(() => {
    if (points.length > 0 && mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      if (center.lat === 47.6062 && center.lng === -122.3321) {
        const first = points[0];
        mapInstanceRef.current.setView([first.lat, first.lon], 11);
      }
    }
  }, [points]);

  const centerOnPoint = useCallback((point: LocationPoint) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([point.lat, point.lon], 13);
    }
  }, []);

  return {
    mapContainerRef,
    canvasRef,
    centerOnPoint,
  };
}

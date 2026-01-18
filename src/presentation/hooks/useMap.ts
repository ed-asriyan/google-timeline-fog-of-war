// Presentation Layer: Map management hook

import { useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { LocationPoint, LocationSegment } from '../../domain/entities';
import { FogSettings, MapViewport } from '../../domain/value-objects';

interface UseMapResult {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  centerOnPoint: (point: LocationPoint) => void;
}

export function useMap(
  points: LocationPoint[],
  segments: LocationSegment[],
  settings: FogSettings,
  viewport: MapViewport,
  onViewportChange: (lat: number, lng: number, zoom: number) => void
): UseMapResult {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const dragStartCenterRef = useRef<L.LatLng | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([viewport.lat, viewport.lng], viewport.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' }).addTo(map);

    // Save viewport on move/zoom (with debouncing through moveend)
    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onViewportChange(center.lat, center.lng, zoom);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Remove viewport deps to prevent recreation

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
        // Skip segments completely outside viewport
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
      // Skip points outside viewport
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
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    drawCanvas();

    // Store the map center when drag starts
    const onMoveStart = () => {
      dragStartCenterRef.current = map.getCenter();
    };

    // Move canvas during drag
    const onMove = () => {
      if (!dragStartCenterRef.current) return;
      
      // Calculate pixel offset from where canvas was drawn
      const startPoint = map.latLngToContainerPoint(dragStartCenterRef.current);
      const currentCenter = map.getCenter();
      const currentPoint = map.latLngToContainerPoint(currentCenter);
      
      const offsetX = startPoint.x - currentPoint.x;
      const offsetY = startPoint.y - currentPoint.y;
      
      // Move canvas by the offset
      canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    };

    // Reset canvas position and redraw at new location
    const onMoveEnd = () => {
      dragStartCenterRef.current = null;
      canvas.style.transform = '';
      drawCanvas();
    };

    map.on('movestart', onMoveStart);
    map.on('move', onMove);
    map.on('moveend', onMoveEnd);
    map.on('zoomend', drawCanvas);
    map.on('resize', drawCanvas);

    return () => {
      map.off('movestart', onMoveStart);
      map.off('move', onMove);
      map.off('moveend', onMoveEnd);
      map.off('zoomend', drawCanvas);
      map.off('resize', drawCanvas);
    };
  }, [drawCanvas]);

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

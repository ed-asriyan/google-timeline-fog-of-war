// Presentation Layer: Map management hook

import { useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { TimelinePoint, TimelinePath, LocationPoint } from '../../domains/map';
import { FogSettings } from '../../domains/settings';

interface UseMapResult {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  centerOnPoint: (point: LocationPoint) => void;
  flyToLocation: (lat: number, lon: number, zoom?: number) => void;
}

interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

export function useMap(
  points: TimelinePoint[],
  segments: TimelinePath[],
  settings: FogSettings,
  viewport: MapViewport,
  onViewportChange: (lat: number, lng: number, zoom: number) => void
): UseMapResult {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const dragStartCenterRef = useRef<L.LatLng | null>(null);
  // Monotonically increasing; echoed by worker so stale responses can be dropped.
  const drawGenRef = useRef(0);

  // Stable refs so Leaflet event callbacks always read latest values
  const pointsRef = useRef(points);
  const segmentsRef = useRef(segments);
  const settingsRef = useRef(settings);
  useEffect(() => { pointsRef.current = points; }, [points]);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Send a draw request to the worker
  const sendDraw = useCallback(() => {
    const map = mapInstanceRef.current;
    const worker = workerRef.current;
    if (!map || !worker) return;

    const gen = ++drawGenRef.current;
    const size = map.getSize();
    const center = map.getCenter();
    const s = settingsRef.current;

    worker.postMessage({
      type: 'draw',
      gen,
      width: size.x,
      height: size.y,
      centerLat: center.lat,
      centerLng: center.lng,
      zoom: map.getZoom(),
      points: pointsRef.current.map(p => ({ lat: p.lat, lon: p.lon })),
      segments: segmentsRef.current.map(seg => ({
        a: { lat: seg.a.lat, lon: seg.a.lon },
        b: { lat: seg.b.lat, lon: seg.b.lon },
        length: seg.length,
      })),
      radius: s.getRadius(),
      connectPaths: s.getConnectPaths(),
      pathLengthKm: s.getPathLengthKm(),
    });
  }, []);

  // Initialize map + worker (once on mount — StrictMode safe: no canvas transfer)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Worker owns its own OffscreenCanvas internally; main canvas is never transferred.
    const worker = new Worker(
      new URL('../workers/fogCanvas.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    // Paint the ImageBitmap the worker sends back onto the visible canvas.
    // Also clear any CSS drag-offset transform here — not on moveend — so the
    // old frame keeps its offset until the new frame is ready (no positional flash).
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type !== 'done') return;
      const bitmap: ImageBitmap = e.data.bitmap;
      // Discard responses from superseded draw calls (e.g. a new drag started
      // before the previous worker render finished).
      if (e.data.gen !== drawGenRef.current) {
        bitmap.close();
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== bitmap.width) canvas.width = bitmap.width;
      if (canvas.height !== bitmap.height) canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      // Only clear the drag offset when we're not mid-drag
      if (!dragStartCenterRef.current) {
        canvas.style.transform = '';
      }
    };

    // Initialise Leaflet
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([viewport.lat, viewport.lng], viewport.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' }).addTo(map);

    map.on('moveend', () => {
      const center = map.getCenter();
      onViewportChange(center.lat, center.lng, map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      worker.terminate();
      workerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-draw when data or settings change
  useEffect(() => {
    sendDraw();
  }, [points, segments, settings, sendDraw]);

  // Drag-pan offset + redraw on map events
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const onMoveStart = () => {
      dragStartCenterRef.current = map.getCenter();
    };

    const onMove = () => {
      if (!dragStartCenterRef.current) return;
      const startPx = map.latLngToContainerPoint(dragStartCenterRef.current);
      const nowPx = map.latLngToContainerPoint(map.getCenter());
      canvas.style.transform = `translate(${startPx.x - nowPx.x}px, ${startPx.y - nowPx.y}px)`;
    };

    const onMoveEnd = () => {
      dragStartCenterRef.current = null;
      // Don't reset canvas.style.transform here — the worker will do it
      // after painting the new frame so there's no positional flash.
      sendDraw();
    };

    map.on('movestart', onMoveStart);
    map.on('move', onMove);
    map.on('moveend', onMoveEnd);
    map.on('zoomend', sendDraw);
    map.on('resize', sendDraw);

    return () => {
      map.off('movestart', onMoveStart);
      map.off('move', onMove);
      map.off('moveend', onMoveEnd);
      map.off('zoomend', sendDraw);
      map.off('resize', sendDraw);
    };
  }, [sendDraw]);

  const centerOnPoint = useCallback((point: LocationPoint) => {
    mapInstanceRef.current?.setView([point.lat, point.lon], 13);
  }, []);

  const flyToLocation = useCallback((lat: number, lon: number, zoom = 15) => {
    mapInstanceRef.current?.flyTo([lat, lon], zoom, { duration: 1.5 });
  }, []);

  return { mapContainerRef, canvasRef, centerOnPoint, flyToLocation };
}

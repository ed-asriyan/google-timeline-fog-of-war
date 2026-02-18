// Web Worker: Off-main-thread fog-of-war canvas rendering
// Uses a worker-owned OffscreenCanvas so transferControlToOffscreen()
// is never called on the main canvas — fully React StrictMode safe.

// Worker owns this; never transferred from main thread.
let offscreen: OffscreenCanvas | null = null;

/**
 * Web Mercator projection: lat/lon → absolute pixel at given zoom level.
 * Matches Leaflet's CRS.EPSG3857 (SphericalMercator).
 */
function project(lat: number, lon: number, zoom: number): [number, number] {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [x, y];
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data as {
    type: string;
    gen: number;
    width: number;
    height: number;
    centerLat: number;
    centerLng: number;
    zoom: number;
    points: { lat: number; lon: number }[];
    segments: { a: { lat: number; lon: number }; b: { lat: number; lon: number }; length: number }[];
    radius: number;
    connectPaths: boolean;
    pathLengthKm: number;
  };

  if (msg.type !== 'draw') return;

  const { gen, width, height, centerLat, centerLng, zoom, points, segments, radius, connectPaths, pathLengthKm } = msg;

  // Create or resize the worker-owned offscreen canvas
  if (!offscreen) {
    offscreen = new OffscreenCanvas(width, height);
  } else {
    offscreen.width = width;
    offscreen.height = height;
  }

  const ctx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return;

  // Pre-compute center pixel
  const [cx, cy] = project(centerLat, centerLng, zoom);
  const toPixel = (lat: number, lon: number): [number, number] => {
    const [px, py] = project(lat, lon, zoom);
    return [px - cx + width / 2, py - cy + height / 2];
  };

  // Fog fill
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';

  const metersPerPixel =
    (40075016.686 * Math.abs(Math.cos((centerLat * Math.PI) / 180))) /
    Math.pow(2, zoom + 8);
  const pixelRadius = (radius * 1000) / metersPerPixel;

  if (pixelRadius >= 0.5) {
    if (connectPaths && segments.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = pixelRadius * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const seg of segments) {
        if (seg.length > pathLengthKm) continue;
        const [x1, y1] = toPixel(seg.a.lat, seg.a.lon);
        const [x2, y2] = toPixel(seg.b.lat, seg.b.lon);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }

    ctx.beginPath();
    for (const pt of points) {
      const [x, y] = toPixel(pt.lat, pt.lon);
      ctx.moveTo(x + pixelRadius, y);
      ctx.arc(x, y, pixelRadius, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';

  // Ship the result back as a transferable ImageBitmap — zero-copy.
  const bitmap = offscreen.transferToImageBitmap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (postMessage as any)({ type: 'done', gen, bitmap }, [bitmap]);
};

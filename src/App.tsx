import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Map as MapIcon, Settings, Route, Trash2, FileJson, Plus, ExternalLink, Database, Menu, X } from 'lucide-react';
import L from 'leaflet';
import type { LocationPoint, LocationSegment, FileRecord } from './types';
import { extractTimelineData } from './utils/timelineParser';
import { getAllFilesFromDB, saveFileToDB, removeFileFromDB } from './utils/storage';

// --- Styles & CSS ---

const styles = `
  .leaflet-container {
    background: #f3f4f6;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent; 
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e5e7eb; 
    border-radius: 3px;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: #d1d5db; 
  }
`;

// --- Main Component ---

export default function App() {
  // --- Persistent State Initialization ---
  const [radiusKm, setRadiusKm] = useState<number>(() => {
    const saved = localStorage.getItem('fog_radius');
    return saved ? parseFloat(saved) : 0.5;
  });
  
  const [showRoads, setShowRoads] = useState<boolean>(() => {
    const saved = localStorage.getItem('fog_show_roads');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [maxLinkDistanceKm, setMaxLinkDistanceKm] = useState<number>(() => {
    const saved = localStorage.getItem('fog_max_link_dist');
    return saved ? parseFloat(saved) : 50;
  });

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Check screen size for initial panel state
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsPanelOpen(false);
    }
  }, []);

  // --- Effects for Persistence ---
  
  // Save controls to localStorage
  useEffect(() => localStorage.setItem('fog_radius', radiusKm.toString()), [radiusKm]);
  useEffect(() => localStorage.setItem('fog_show_roads', JSON.stringify(showRoads)), [showRoads]);
  useEffect(() => localStorage.setItem('fog_max_link_dist', maxLinkDistanceKm.toString()), [maxLinkDistanceKm]);

  // Load files from IndexedDB on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const storedFiles = await getAllFilesFromDB();
        if (storedFiles.length > 0) {
          setFiles(storedFiles);
        }
        setDbStatus('ready');
      } catch (err) {
        console.error("Failed to load from DB", err);
        setDbStatus('error');
      }
    };
    loadFiles();
  }, []);

  // --- Derived State (Memoized) ---
  const { allPoints, allSegments } = useMemo(() => {
    const points: LocationPoint[] = [];
    const segments: LocationSegment[] = [];
    
    files.forEach(file => {
      points.push(...file.data.points);
      segments.push(...file.data.segments);
    });

    return { allPoints: points, allSegments: segments };
  }, [files]);

  // --- Refs ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- 2. Initialize Map ---
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
        zoomControl: false, 
        attributionControl: false
    }).setView([47.6062, -122.3321], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    
    L.control.attribution({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center map on data load if it's the first time
  useEffect(() => {
    // Only center if we have points, map is ready, and we haven't manually moved much (heuristic)
    // Actually, let's just center if we loaded data from DB or file and it's the initialization phase
    if (dbStatus === 'ready' && allPoints.length > 0 && mapInstanceRef.current) {
        // Just center on the last point (chronologically latest usually) or first
        // We'll trust the user to move it, but initial view is helpful
        // Check if we are at default 0,0 or default Seattle
        const center = mapInstanceRef.current.getCenter();
        if (center.lat === 47.6062 && center.lng === -122.3321 && allPoints[0]) {
             mapInstanceRef.current.setView([allPoints[0].lat, allPoints[0].lon], 11);
        }
    }
  }, [dbStatus, allPoints]);


  // --- 3. Draw Fog Overlay ---
  const drawCanvas = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    // Resize
    const size = map.getSize();
    if (canvas.width !== size.x || canvas.height !== size.y) {
        canvas.width = size.x;
        canvas.height = size.y;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Fill with Fog
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Prepare to erase
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    
    // 3. Calc Metrics
    const center = map.getCenter();
    const metersPerPixel = 40075016.686 * Math.abs(Math.cos(center.lat * Math.PI / 180)) / Math.pow(2, map.getZoom() + 8);
    const pixelRadius = (radiusKm * 1000) / metersPerPixel;

    if (pixelRadius < 0.5) {
        ctx.globalCompositeOperation = 'source-over';
        return;
    }

    const bounds = map.getBounds();
    const pad = (radiusKm / 111);
    const minLat = bounds.getSouth() - pad;
    const maxLat = bounds.getNorth() + pad;
    const minLon = bounds.getWest() - pad;
    const maxLon = bounds.getEast() + pad;

    ctx.beginPath();

    if (showRoads) {
      ctx.lineWidth = pixelRadius * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      for (let i = 0; i < allSegments.length; i++) {
        const s = allSegments[i];
        
        if (s.lengthKm > maxLinkDistanceKm) continue;

        if (
          (s.start.lat < minLat && s.end.lat < minLat) ||
          (s.start.lat > maxLat && s.end.lat > maxLat) ||
          (s.start.lon < minLon && s.end.lon < minLon) ||
          (s.start.lon > maxLon && s.end.lon > maxLon)
        ) {
          continue;
        }

        const p1 = map.latLngToContainerPoint([s.start.lat, s.start.lon]);
        const p2 = map.latLngToContainerPoint([s.end.lat, s.end.lon]);

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < allPoints.length; i++) {
        const p = allPoints[i];
        if (p.lat < minLat || p.lat > maxLat || p.lon < minLon || p.lon > maxLon) continue;

        const pt = map.latLngToContainerPoint([p.lat, p.lon]);
        ctx.moveTo(pt.x + pixelRadius, pt.y);
        ctx.arc(pt.x, pt.y, pixelRadius, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

  }, [allPoints, allSegments, radiusKm, showRoads, maxLinkDistanceKm]);

  // --- 4. Bind Events ---
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


  // --- File Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessing(true);
    const uploadedFiles = Array.from(e.target.files);
    e.target.value = '';

    setTimeout(async () => {
        try {
            const promises = uploadedFiles.map((file) => {
                return new Promise<FileRecord>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                    const json = JSON.parse(event.target?.result as string);
                    const data = extractTimelineData(json);
                    
                    if (data.points.length > 0) {
                        resolve({
                            id: crypto.randomUUID(),
                            name: file.name,
                            pointCount: data.points.length,
                            segmentCount: data.segments.length,
                            data: data
                        });
                    } else {
                        resolve({ 
                            id: crypto.randomUUID(), 
                            name: `${file.name} (No Data)`, 
                            pointCount: 0, 
                            segmentCount: 0, 
                            data: { points: [], segments: [] } 
                        });
                    }
                    } catch (err) {
                        console.error(`Error parsing ${file.name}:`, err);
                        resolve({ 
                            id: crypto.randomUUID(), 
                            name: `${file.name} (Error)`, 
                            pointCount: 0, 
                            segmentCount: 0, 
                            data: { points: [], segments: [] } 
                        });
                    }
                };
                reader.onerror = () => resolve({ 
                    id: crypto.randomUUID(), 
                    name: `${file.name} (Read Error)`, 
                    pointCount: 0, 
                    segmentCount: 0, 
                    data: { points: [], segments: [] } 
                });
                reader.readAsText(file);
                });
            });

            const newRecords = await Promise.all(promises);
            const validRecords = newRecords.filter(r => r.pointCount > 0);
            
            // Save to DB
            for (const record of validRecords) {
                await saveFileToDB(record);
            }

            setFiles(prev => [...prev, ...validRecords]);
            
            if (files.length === 0 && validRecords.length > 0 && validRecords[0].data.points.length > 0 && mapInstanceRef.current) {
                const first = validRecords[0].data.points[0];
                mapInstanceRef.current.setView([first.lat, first.lon], 11);
            }

        } catch (error) {
            console.error("Processing failed", error);
        } finally {
            setIsProcessing(false);
        }
    }, 100);
  };

  const removeFile = async (id: string) => {
      await removeFileFromDB(id);
      setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 text-gray-900 font-sans overflow-hidden relative">
      <style>{styles}</style>

      {/* --- Floating Control Panel --- */}
      <div 
        className={`
            absolute z-[500] flex flex-col gap-3 pointer-events-none transition-transform duration-300
            
            /* Mobile: Bottom Sheet */
            bottom-0 left-0 w-full max-h-[60vh]
            ${!isPanelOpen ? 'translate-y-full' : 'translate-y-0'}

            /* Desktop: Top Left Panel */
            md:top-4 md:left-4 md:bottom-auto md:w-80 md:max-h-[calc(100vh-2rem)]
            ${!isPanelOpen ? 'md:-translate-x-[calc(100%+2rem)] md:translate-y-0' : 'md:translate-x-0 md:translate-y-0'}
        `}
      >
        
        {/* Main Card */}
        <div className="bg-white md:rounded-xl shadow-xl border-t md:border border-gray-200 pointer-events-auto flex flex-col overflow-hidden h-full md:h-auto rounded-t-xl">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <MapIcon className="text-blue-600 w-5 h-5" />
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Timeline Fog of War</h1>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{allPoints.length.toLocaleString()} locations</span>
                        <span>•</span>
                        <span>{allSegments.length.toLocaleString()} paths</span>
                    </div>
                </div>
                 {/* Close Button */}
                 <button 
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 active:bg-gray-200 rounded-lg"
                 >
                    <X className="w-6 h-6" />
                 </button>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-5">
                
                {/* Radius Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label htmlFor="radius" className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Settings className="w-3 h-3" /> Visibility Radius
                        </label>
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{radiusKm} km</span>
                    </div>
                    <input
                        type="range"
                        min="0.05"
                        max="5"
                        step="0.05"
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>

                {/* Connection Controls Group */}
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {/* Toggle */}
                    <div 
                        className="flex items-center justify-between cursor-pointer group select-none"
                        onClick={() => setShowRoads(!showRoads)}
                    >
                        <div className="flex items-center gap-2">
                            <Route className={`w-4 h-4 ${showRoads ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium text-gray-700">Connect Activities</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${showRoads ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${showRoads ? 'translate-x-4.5' : 'translate-x-0.5'}`} style={{ transform: showRoads ? 'translateX(1.125rem)' : 'translateX(0.125rem)' }} />
                        </div>
                    </div>

                    {/* Path Length Slider (Conditional) */}
                    {showRoads && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200 pt-1">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Max Link Distance
                                </label>
                                <span className="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                    {maxLinkDistanceKm} km
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="1000"
                                step="1"
                                value={maxLinkDistanceKm}
                                onChange={(e) => setMaxLinkDistanceKm(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-[10px] text-gray-400 leading-tight">
                                Prevents drawing lines for flights or GPS jumps longer than this.
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* File List Header */}
            <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Files</span>
                <span className="text-xs text-gray-400">
                    {dbStatus === 'loading' ? 'Restoring...' : `${files.length} loaded`}
                </span>
            </div>

            {/* File List (Scrollable) */}
            <div className="overflow-y-auto custom-scrollbar bg-gray-50/30 flex-1 min-h-0 md:max-h-48">
                {files.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        <FileJson className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        {dbStatus === 'loading' ? 'Checking storage...' : 'No files loaded yet'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {files.map(file => (
                            <div key={file.id} className="p-3 flex items-start justify-between group hover:bg-white transition-colors">
                                <div className="min-w-0 pr-2">
                                    <div className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {file.pointCount.toLocaleString()} pts
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeFile(file.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Remove file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Button Area */}
            <div className="p-3 border-t border-gray-100 bg-white">
                 <div className="relative mb-2">
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <label 
                        htmlFor="file-upload" 
                        className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all shadow-sm border border-transparent font-medium text-sm ${
                        isProcessing 
                            ? 'bg-gray-100 text-gray-400 cursor-wait' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
                        }`}
                    >
                        {isProcessing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add Google Timeline files
                            </>
                        )}
                    </label>
                </div>

                <div className="flex flex-col gap-2 items-center text-[10px] text-gray-400">
                      <p className="flex items-center gap-1 text-center leading-tight max-w-[90%] mx-auto opacity-75">
                         <Database className="w-3 h-3 flex-shrink-0" />
                         Selected files processed and saved in browser only
                    </p>
                    <a 
                        href="https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DAndroid&oco=1#androidimport" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <u>How to get Google Timeline files on Android?</u>
                    </a>
                    <a 
                        href="https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DiOS&oco=1#iosimport" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <u>How to get Google Timeline files on iPhone?</u>
                    </a>
                </div>
            </div>

        </div>

      </div>

        {/* Info / Hint Toast (Visible only when empty) */}
        {files.length === 0 && dbStatus !== 'loading' && (
             <div className="absolute bottom-20 left-4 md:top-[calc(100vh-10rem)] md:bottom-auto z-[490] max-w-sm bg-blue-900/90 backdrop-blur text-white p-4 rounded-xl shadow-xl text-sm border border-blue-700/50 pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-500">
                <p className="font-semibold mb-1">Gamify Your Travel History</p>
                <p className="opacity-90 leading-relaxed text-blue-100">
                    Your map starts covered in a "Fog of War". Upload your Google Timeline data to clear the fog and reveal the world you've explored!
                </p>
            </div>
        )}

        {/* Toggle Button (Floating) */}
        {!isPanelOpen && (
            <button
                onClick={() => setIsPanelOpen(true)}
                className="absolute z-[500] bg-white p-3 rounded-xl shadow-lg border border-gray-200 text-gray-700 hover:text-blue-600 active:scale-95 transition-all
                           bottom-6 left-4 md:top-4 md:left-4 md:bottom-auto"
            >
                <div className="relative">
                    <Menu className="w-6 h-6" />
                </div>
            </button>
        )}


      {/* --- Map Container --- */}
      <div className="flex-1 relative isolate">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-gray-200" />
        <canvas 
            ref={canvasRef}
            className="absolute inset-0 z-10 pointer-events-none"
        />
      </div>

    </div>
  );
}
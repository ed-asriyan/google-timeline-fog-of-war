// Presentation Layer: Main Application Component

import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useTimelineFiles } from './presentation/hooks/useTimelineFiles';
import { useFogSettings } from './presentation/hooks/useFogSettings';
import { useMapViewport } from './presentation/hooks/useMapViewport';
import { useMap, MapBoundsRect } from './presentation/hooks/useMap';
import { SidePanel } from './presentation/components/SidePanel';
import { AddressSearch } from './presentation/components/AddressSearch';
import { getSharedFiles } from './utils/share-target';
import { Map } from './domains/map/app';
import { MapSegmentRepository } from './domains/map/ports';

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

interface AppProps {
  mapApp: Map;
  mapSegmentRepository: MapSegmentRepository;
}

export default function App({ mapApp, mapSegmentRepository }: AppProps) {
  // State management through custom hooks
  const {
    dataVersion,
    hasData,
    isProcessing,
    loadingState,
    uploadFiles,
    clearAll,
  } = useTimelineFiles(mapApp, mapSegmentRepository);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const {
    settings,
    isPanelOpen,
    setIsPanelOpen,
    updateRadius,
    toggleConnectPaths,
    updatePathLength,
  } = useFogSettings();

  const { viewport, updateViewport } = useMapViewport();

  // Viewport query state (async — populated via useEffect below)
  const [points, setPoints] = useState<TimelinePoint[]>([]);
  const [segments, setSegments] = useState<TimelinePath[]>([]);
  const [mapBounds, setMapBounds] = useState<MapBoundsRect | null>(null);

  // Query viewport data using the service (async)
  useEffect(() => {
    if (!mapBounds) return;
    let cancelled = false;
    const query = async () => {
      try {
        // Add a small padding (radius) beyond visible area so fog circles near
        // the edge are fully rendered
        const padDeg = settings.radius / 111;

        const bounds = {
          a: {
            lat: Math.max(-90, mapBounds.minLat - padDeg),
            lon: Math.max(-180, mapBounds.minLon - padDeg)
          },
          b: {
            lat: Math.min(90, mapBounds.maxLat + padDeg),
            lon: Math.min(180, mapBounds.maxLon + padDeg)
          }
        };

        const resultPoints = await mapApp.getPoints(bounds);
        const resultPaths = await mapApp.getPaths(bounds);
        
        if (!cancelled) {
          setPoints(resultPoints);
          setSegments(resultPaths);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'An error occurred while loading map data.');
        }
      }
    };
    query();
    return () => { cancelled = true; };
  }, [mapApp, dataVersion, mapBounds, settings]);

  // Map management
  const { mapContainerRef, canvasRef, flyToLocation } = useMap(
    points, 
    segments, 
    settings,
    viewport,
    updateViewport,
    setMapBounds
  );

  // Track whether shared files have been checked
  const sharedFilesCheckedRef = useRef(false);

  // Check for shared files on mount (from PWA share target)
  useEffect(() => {
    const checkSharedFiles = async () => {
      if (sharedFilesCheckedRef.current) return;
      sharedFilesCheckedRef.current = true;
      
      const sharedFiles = await getSharedFiles();
      if (sharedFiles.length > 0) {
        await uploadFiles(sharedFiles);
      }
    };
    
    checkSharedFiles();
  }, [uploadFiles]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 text-gray-900 font-sans overflow-hidden relative">
      {/* Error Alert */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white p-4 rounded-xl shadow-xl text-sm border border-red-700/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <strong>Error:</strong> {error}
          <button
            className="ml-4 bg-white text-red-600 px-2 py-1 rounded hover:bg-red-100 border border-red-200"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <style>{styles}</style>

      {/* Side Panel */}
      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        settings={settings}
        onRadiusChange={updateRadius}
        onToggleRoads={toggleConnectPaths}
        onMaxLinkDistanceChange={updatePathLength}
        isProcessing={isProcessing}
        loadingState={loadingState}
        hasData={hasData}
        onFilesSelected={uploadFiles}
        onClearAll={clearAll}
      />

      {/* Info Toast (Visible only when no data imported) */}
      {!hasData && !isProcessing && (
        <div className="absolute bottom-20 left-4 md:top-[calc(100vh-10rem)] md:bottom-auto z-[490] max-w-sm bg-blue-900/90 backdrop-blur text-white p-4 rounded-xl shadow-xl text-sm border border-blue-700/50 pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-500">
          <p className="font-semibold mb-1">Gamify Your Travel History</p>
          <p className="opacity-90 leading-relaxed text-blue-100">
            Your map starts covered in a "Fog of War". Upload your Google Timeline data to clear
            the fog and reveal the world you've explored!
          </p>
        </div>
      )}

      {/* Toggle Button (Floating) */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute z-[500] bg-white p-3 rounded-xl shadow-lg border border-gray-200 text-gray-700 hover:text-blue-600 active:scale-95 transition-all bottom-6 left-4 md:top-4 md:left-4 md:bottom-auto"
        >
          {isProcessing ? (
            <svg
              className="animate-spin w-6 h-6 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Address Search (Top Center) */}
      <div className="absolute z-[500] top-4 left-1/2 -translate-x-1/2 w-[90%] md:w-96 max-w-lg">
        <AddressSearch onLocationSelect={flyToLocation} />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative isolate">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-gray-200" />
        <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />
      </div>
    </div>
  );
}

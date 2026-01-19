// Presentation Layer: Main Application Component

import { useMemo, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { ServiceContainer } from './infrastructure/service-container';
import { MapBounds, LocationPoint } from './domains/map/value-objects';
import { useTimelineFiles } from './presentation/hooks/useTimelineFiles';
import { useFogSettings } from './presentation/hooks/useFogSettings';
import { useMapViewport } from './presentation/hooks/useMapViewport';
import { useMap } from './presentation/hooks/useMap';
import { SidePanel } from './presentation/components/SidePanel';
import { AddressSearch } from './presentation/components/AddressSearch';
import { getSharedFiles } from './utils/share-target';
import './index.css';

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

export default function App() {
  // Initialize services
  const container = useMemo(() => ServiceContainer.getInstance(), []);
  const timelineFileService = useMemo(() => container.timelineFileService, [container]);
  const settingsService = useMemo(() => container.settingsService, [container]);

  // State management through custom hooks
  const {
    files,
    loadingState,
    isProcessing,
    uploadFiles,
    removeFile,
  } = useTimelineFiles(timelineFileService);

  const {
    settings,
    isPanelOpen,
    setIsPanelOpen,
    updateRadius,
    toggleConnectPaths,
    updatePathLength,
  } = useFogSettings(settingsService);

  const { viewport, updateViewport } = useMapViewport();

  // Query viewport data using grid-based spatial index
  const { points, segments } = useMemo(() => {
    const map = timelineFileService.getMap();
    
    // Calculate generous bounds to ensure full viewport coverage
    // Use exponential decay: at zoom 0 query world, at zoom 10+ query local area
    const zoomFactor = Math.max(1, viewport.zoom);
    const latRange = 180 / Math.pow(1.5, zoomFactor);
    const lonRange = 360 / Math.pow(1.5, zoomFactor);
    const pad = Math.max(5, settings.getRadius() / 111); // At least 5 degrees padding
    
    // Clamp to valid coordinate ranges
    const minLat = Math.max(-90, viewport.lat - latRange - pad);
    const maxLat = Math.min(90, viewport.lat + latRange + pad);
    const minLon = Math.max(-180, viewport.lng - lonRange - pad);
    const maxLon = Math.min(180, viewport.lng + lonRange + pad);
    
    const bounds = new MapBounds(
      new LocationPoint(minLat, minLon),
      new LocationPoint(maxLat, maxLon)
    );
    
    const result = map.queryViewport(bounds);
    return { points: result.points, segments: result.paths };
  }, [timelineFileService, files, viewport, settings]);

  // Get total statistics from map (not just viewport)
  const totalStats = useMemo(() => {
    const map = timelineFileService.getMap();
    return map.getStatistics();
  }, [timelineFileService, files]);

  // Map management
  const { mapContainerRef, canvasRef, centerOnPoint, flyToLocation } = useMap(
    points, 
    segments, 
    settings,
    viewport,
    updateViewport
  );

  // Track whether initial load is complete and previous point count
  const initialLoadCompleteRef = useRef(false);
  const prevPointCountRef = useRef(0);
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

  // Mark initial load as complete once loading state is ready
  useEffect(() => {
    if (loadingState === 'ready' && !initialLoadCompleteRef.current) {
      initialLoadCompleteRef.current = true;
      prevPointCountRef.current = points.length;
    }
  }, [loadingState, points.length]);

  // Jump to latest location when user adds first points (after initial load)
  useEffect(() => {
    // Skip if initial load not complete yet
    if (!initialLoadCompleteRef.current) return;
    
    const prevCount = prevPointCountRef.current;
    const currentCount = points.length;
    
    // If we went from 0 points to having points, center on latest point
    if (prevCount === 0 && currentCount > 0) {
      const latestPoint = points[points.length - 1];
      centerOnPoint(latestPoint);
    }
    
    prevPointCountRef.current = currentCount;
  }, [points, centerOnPoint]);

  // File upload handler
  const handleFilesSelected = async (fileList: File[]) => {
    await uploadFiles(fileList);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 text-gray-900 font-sans overflow-hidden relative">
      <style>{styles}</style>

      {/* Side Panel */}
      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        settings={settings}
        onRadiusChange={updateRadius}
        onToggleRoads={toggleConnectPaths}
        onMaxLinkDistanceChange={updatePathLength}
        files={files}
        loadingState={loadingState}
        isProcessing={isProcessing}
        totalPoints={totalStats.pointsCount}
        totalSegments={totalStats.pathsCount}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={removeFile}
      />

      {/* Info Toast (Visible only when empty) */}
      {files.length === 0 && loadingState !== 'loading' && (
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
          className="absolute z-[500] bg-white p-3 rounded-xl shadow-lg border border-gray-200 text-gray-700 hover:text-blue-600 active:scale-95 transition-all
                     bottom-6 left-4 md:top-4 md:left-4 md:bottom-auto"
        >
          <Menu className="w-6 h-6" />
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

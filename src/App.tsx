// Presentation Layer: Main Application Component

import { useMemo, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { ServiceContainer } from './infrastructure/service-container';
import { useTimelineFiles } from './presentation/hooks/useTimelineFiles';
import { useFogSettings } from './presentation/hooks/useFogSettings';
import { useMapViewport } from './presentation/hooks/useMapViewport';
import { useMap } from './presentation/hooks/useMap';
import { SidePanel } from './presentation/components/SidePanel';
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
    toggleRoads,
    updateMaxLinkDistance,
  } = useFogSettings(settingsService);

  const { viewport, updateViewport } = useMapViewport();

  // Aggregate data from all files
  const { points, segments } = useMemo(() => {
    const allPoints = files.flatMap(f => f.data.points);
    const allSegments = files.flatMap(f => f.data.segments);
    return { points: allPoints, segments: allSegments };
  }, [files]);

  // Map management
  const { mapContainerRef, canvasRef, centerOnPoint } = useMap(
    points, 
    segments, 
    settings,
    viewport,
    updateViewport
  );

  // Track whether initial load is complete and previous file count
  const initialLoadCompleteRef = useRef(false);
  const prevFileCountRef = useRef(files.length);

  // Mark initial load as complete once loading state is ready
  useEffect(() => {
    if (loadingState === 'ready' && !initialLoadCompleteRef.current) {
      initialLoadCompleteRef.current = true;
      prevFileCountRef.current = files.length;
    }
  }, [loadingState, files.length]);

  // Jump to latest location only when user uploads first files (not on initial load)
  useEffect(() => {
    // Skip if initial load not complete yet
    if (!initialLoadCompleteRef.current) return;
    
    const prevCount = prevFileCountRef.current;
    const currentCount = files.length;
    
    // If we went from 0 to having files after initial load, center on latest point
    if (prevCount === 0 && currentCount > 0 && points.length > 0) {
      const latestPoint = points[points.length - 1];
      centerOnPoint(latestPoint);
    }
    
    prevFileCountRef.current = currentCount;
  }, [files.length, points, centerOnPoint]);

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
        onToggleRoads={toggleRoads}
        onMaxLinkDistanceChange={updateMaxLinkDistance}
        files={files}
        loadingState={loadingState}
        isProcessing={isProcessing}
        totalPoints={points.length}
        totalSegments={segments.length}
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

      {/* Map Container */}
      <div className="flex-1 relative isolate">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-gray-200" />
        <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />
      </div>
    </div>
  );
}

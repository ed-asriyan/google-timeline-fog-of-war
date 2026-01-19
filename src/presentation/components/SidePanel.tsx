// Presentation Layer: Side Panel Component


import { Map as MapIcon, X } from 'lucide-react';
import { TimelineFile } from '../../domains/map';
import { ControlPanel } from './ControlPanel';
import { FileList } from './FileList';
import { FileUpload } from './FileUpload';
import { FogSettings } from '../../domains/settings';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FogSettings;
  onRadiusChange: (radius: number) => void;
  onToggleRoads: () => void;
  onMaxLinkDistanceChange: (distance: number) => void;
  files: TimelineFile[];
  loadingState: 'idle' | 'loading' | 'ready' | 'error';
  isProcessing: boolean;
  totalPoints: number;
  totalSegments: number;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (file: TimelineFile) => void;
}

export function SidePanel({
  isOpen,
  onClose,
  settings,
  onRadiusChange,
  onToggleRoads,
  onMaxLinkDistanceChange,
  files,
  loadingState,
  isProcessing,
  totalPoints,
  totalSegments,
  onFilesSelected,
  onRemoveFile,
}: SidePanelProps) {
  return (
    <div
      className={`
        absolute z-[500] flex flex-col gap-3 pointer-events-none transition-transform duration-300
        
        /* Mobile: Bottom Sheet */
        bottom-0 left-0 w-full max-h-[85vh]
        ${!isOpen ? 'translate-y-full' : 'translate-y-0'}

        /* Desktop: Top Left Panel */
        md:top-4 md:left-4 md:bottom-auto md:w-80 md:max-h-[calc(100vh-2rem)]
        ${!isOpen ? 'md:-translate-x-[calc(100%+2rem)] md:translate-y-0' : 'md:translate-x-0 md:translate-y-0'}
      `}
    >
      {/* Main Card */}
      <div className="bg-white md:rounded-xl shadow-xl border-t md:border border-gray-200 pointer-events-auto flex flex-col overflow-hidden h-full md:h-auto rounded-t-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapIcon className="text-blue-600 w-5 h-5" />
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Timeline Fog of War
              </h1>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>{totalPoints.toLocaleString()} locations</span>
              <span>•</span>
              <span>{totalSegments.toLocaleString()} paths</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 active:bg-gray-200 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Middle Area */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar flex flex-col min-h-0">
          <ControlPanel
            settings={settings}
            onRadiusChange={onRadiusChange}
            onToggleRoads={onToggleRoads}
            onMaxLinkDistanceChange={onMaxLinkDistanceChange}
          />

          {/* File List Header */}
          <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100 flex justify-between items-center flex-shrink-0 sticky top-0 md:static z-10 md:z-auto backdrop-blur-sm bg-gray-50/90 md:bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Source Files
            </span>
            <span className="text-xs text-gray-400">
              {loadingState === 'loading' ? 'Restoring...' : `${files.length} loaded`}
            </span>
          </div>

          {/* File List */}
          <div className="bg-gray-50/30 md:overflow-y-auto md:custom-scrollbar md:flex-1 md:min-h-0 md:max-h-48">
            <FileList files={files} loadingState={loadingState} onRemove={onRemoveFile} />
          </div>
        </div>

        {/* Upload Button Area */}
        <FileUpload isProcessing={isProcessing} onFilesSelected={onFilesSelected} />
      </div>
    </div>
  );
}

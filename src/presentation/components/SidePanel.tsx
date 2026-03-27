// Presentation Layer: Side Panel Component


import { Map as MapIcon, X, Trash2 } from 'lucide-react';
import { ControlPanel } from './ControlPanel';
import { FileUpload } from './FileUpload';
import { FogSettings } from '../../domains/settings';
import { LoadingState } from '../../application/Map';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FogSettings;
  onRadiusChange: (radius: number) => void;
  onToggleRoads: () => void;
  onMaxLinkDistanceChange: (distance: number) => void;
  isProcessing: boolean;
  loadingState: LoadingState;
  hasData: boolean;
  onFilesSelected: (files: File[]) => void;
  onClearAll: () => void;
}

export function SidePanel({
  isOpen,
  onClose,
  settings,
  onRadiusChange,
  onToggleRoads,
  onMaxLinkDistanceChange,
  isProcessing,
  loadingState,
  hasData,
  onFilesSelected,
  onClearAll,
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
          <div className="flex items-center gap-2">
            <MapIcon className="text-blue-600 w-5 h-5" />
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Timeline Fog of War
            </h1>
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
        </div>

        {/* Action Buttons Area */}
        <div className="p-3 border-t border-gray-100 bg-white flex flex-col">
          <FileUpload loadingState={loadingState} onFilesSelected={onFilesSelected} />
          {hasData && (
            <button
              onClick={onClearAll}
              disabled={isProcessing}
              className="flex items-center mt-3 justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


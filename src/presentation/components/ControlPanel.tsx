// Presentation Layer: Control Panel Component


import { Settings, Route } from 'lucide-react';
import { FogSettings } from '../../domain/value-objects';
import { analytics } from '../../infrastructure/analytics';

interface ControlPanelProps {
  settings: FogSettings;
  onRadiusChange: (radius: number) => void;
  onToggleRoads: () => void;
  onMaxLinkDistanceChange: (distance: number) => void;
}

export function ControlPanel({
  settings,
  onRadiusChange,
  onToggleRoads,
  onMaxLinkDistanceChange,
}: ControlPanelProps) {
  return (
    <div className="p-4 space-y-5">
      {/* Radius Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="radius"
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"
          >
            <Settings className="w-3 h-3" /> Visibility Radius
          </label>
          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {Math.round(settings.radiusKm * 1000)} m
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={settings.radiusKm * 1000}
          onChange={(e) => {
            const newRadius = parseFloat(e.target.value) / 1000;
            onRadiusChange(newRadius);
          }}
          onMouseUp={(e) => {
            const target = e.target as HTMLInputElement;
            analytics.track('Visibility Radius Changed', {
              radiusMeters: Math.round(parseFloat(target.value)),
            });
          }}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Connection Controls Group */}
      <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
        {/* Toggle */}
        <div
          className="flex items-center justify-between cursor-pointer group select-none"
          onClick={() => {
            analytics.track('Connect Dots Toggled', {
              enabled: !settings.showRoads,
            });
            onToggleRoads();
          }}
        >
          <div className="flex items-center gap-2">
            <Route
              className={`w-4 h-4 ${settings.showRoads ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <span className="text-sm font-medium text-gray-700">Connect Dots</span>
          </div>
          <div
            className={`w-8 h-4 rounded-full relative transition-colors ${
              settings.showRoads ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm`}
              style={{
                transform: settings.showRoads ? 'translateX(1.125rem)' : 'translateX(0.125rem)',
              }}
            />
          </div>
        </div>

        {/* Path Length Slider (Conditional) */}
        {settings.showRoads && (
          <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Max Link Distance
              </label>
              <span className="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                {settings.maxLinkDistanceKm} km
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.maxLinkDistanceKm}
              onChange={(e) => onMaxLinkDistanceChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-gray-400 leading-tight">
              Prevents drawing lines for flights or GPS jumps longer than this.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

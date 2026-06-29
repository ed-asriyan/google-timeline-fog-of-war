// Presentation Layer: Control Panel Component

import { useState, useEffect } from 'react';
import { Settings, Route } from 'lucide-react';
import { FogSettings } from '../../infrastructure/repositories/UISettingsRepository';
import { analytics } from '../../infrastructure/analytics';

interface ControlPanelProps {
  settings: FogSettings;
  onRadiusChange: (radius: number) => void;
  onToggleRoads: () => void;
  onMaxLinkDistanceChange: (distance: number) => void;
  onMaxVelocityChange: (velocity: number) => void;
}

export function ControlPanel({
  settings,
  onRadiusChange,
  onToggleRoads,
  onMaxLinkDistanceChange,
  onMaxVelocityChange,
}: ControlPanelProps) {
  const [localRadius, setLocalRadius] = useState(settings.radius);
  const [localPathLength, setLocalPathLength] = useState(settings.pathLengthKm);
  const [localPathVelocity, setLocalPathVelocity] = useState(settings.pathVelocityKmh);

  useEffect(() => {
    setLocalRadius(settings.radius);
  }, [settings.radius]);

  useEffect(() => {
    setLocalPathLength(settings.pathLengthKm);
  }, [settings.pathLengthKm]);

  useEffect(() => {
    setLocalPathVelocity(settings.pathVelocityKmh);
  }, [settings.pathVelocityKmh]);

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
            {Math.round(localRadius * 1000)} m
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={localRadius * 1000}
          onChange={(e) => {
            const newRadius = parseFloat(e.target.value) / 1000;
            setLocalRadius(newRadius);
          }}
          onMouseUp={(e) => {
            const target = e.target as HTMLInputElement;
            const newRadius = parseFloat(target.value) / 1000;
            onRadiusChange(newRadius);
            analytics.track('Visibility Radius Changed', {
              radiusMeters: Math.round(newRadius * 1000),
            });
          }}
          onTouchEnd={(e) => {
            const target = e.target as HTMLInputElement;
            const newRadius = parseFloat(target.value) / 1000;
            onRadiusChange(newRadius);
            analytics.track('Visibility Radius Changed', {
              radiusMeters: Math.round(newRadius * 1000),
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
              enabled: !settings.connectPaths,
            });
            onToggleRoads();
          }}
        >
          <div className="flex items-center gap-2">
            <Route
              className={`w-4 h-4 ${settings.connectPaths ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <span className="text-sm font-medium text-gray-700">Connect Dots</span>
          </div>
          <div
            className={`w-8 h-4 rounded-full relative transition-colors ${
              settings.connectPaths ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm`}
              style={{
                transform: settings.connectPaths ? 'translateX(1.125rem)' : 'translateX(0.125rem)',
              }}
            />
          </div>
        </div>

        {/* Path Length Slider (Conditional) */}
        {settings.connectPaths && (
          <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 pt-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Max Link Distance
                </label>
                <span className="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                  {localPathLength} km
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={localPathLength}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLocalPathLength(val);
                }}
                onMouseUp={(e) => {
                  onMaxLinkDistanceChange(parseFloat((e.target as HTMLInputElement).value));
                }}
                onTouchEnd={(e) => {
                  onMaxLinkDistanceChange(parseFloat((e.target as HTMLInputElement).value));
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Max Link Velocity
                </label>
                <span className="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                  {localPathVelocity} km/h
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="256"
                step="10"
                value={localPathVelocity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLocalPathVelocity(val);
                }}
                onMouseUp={(e) => {
                  onMaxVelocityChange(parseFloat((e.target as HTMLInputElement).value));
                }}
                onTouchEnd={(e) => {
                  onMaxVelocityChange(parseFloat((e.target as HTMLInputElement).value));
                }}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <p className="text-[10px] text-gray-400 leading-tight">
              Prevents drawing lines for flights or GPS jumps exceeding these limits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

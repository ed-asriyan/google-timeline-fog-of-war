<!-- Presentation Layer: Control Panel Component (Svelte) -->
<script lang="ts">
  import { Settings, Route } from '@lucide/svelte';
  import type { FogSettings } from '../../infrastructure/repositories/UISettingsRepository';
  import { analytics } from '../../infrastructure/analytics';

  let {
    settings,
    onRadiusChange,
    onToggleRoads,
    onMaxLinkDistanceChange,
    onMaxVelocityChange,
  }: {
    settings: FogSettings;
    onRadiusChange: (radius: number) => void;
    onToggleRoads: () => void;
    onMaxLinkDistanceChange: (distance: number) => void;
    onMaxVelocityChange: (velocity: number) => void;
  } = $props();

  let localRadius = $state(settings.radius);
  let localPathLength = $state(settings.pathLengthKm);
  let localPathVelocity = $state(settings.pathVelocityKmh);

  $effect(() => {
    localRadius = settings.radius;
  });

  $effect(() => {
    localPathLength = settings.pathLengthKm;
  });

  $effect(() => {
    localPathVelocity = settings.pathVelocityKmh;
  });

  function commitRadius(target: HTMLInputElement) {
    const newRadius = parseFloat(target.value) / 1000;
    onRadiusChange(newRadius);
    analytics.track('Visibility Radius Changed', {
      radiusMeters: Math.round(newRadius * 1000),
    });
  }
</script>

<div class="p-4 space-y-5">
  <!-- Radius Slider -->
  <div class="space-y-2">
    <div class="flex justify-between items-center">
      <label
        for="radius"
        class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"
      >
        <Settings class="w-3 h-3" /> Visibility Radius
      </label>
      <span class="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
        {Math.round(localRadius * 1000)} m
      </span>
    </div>
    <input
      id="radius"
      type="range"
      min="0"
      max="1000"
      step="10"
      value={localRadius * 1000}
      oninput={(e) => {
        localRadius = parseFloat((e.currentTarget as HTMLInputElement).value) / 1000;
      }}
      onmouseup={(e) => commitRadius(e.currentTarget as HTMLInputElement)}
      ontouchend={(e) => commitRadius(e.currentTarget as HTMLInputElement)}
      class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
  </div>

  <!-- Connection Controls Group -->
  <div class="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
    <!-- Toggle -->
    <div
      class="flex items-center justify-between cursor-pointer group select-none"
      onclick={() => {
        analytics.track('Connect Dots Toggled', {
          enabled: !settings.connectPaths,
        });
        onToggleRoads();
      }}
      role="switch"
      tabindex="0"
      aria-checked={settings.connectPaths}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          analytics.track('Connect Dots Toggled', { enabled: !settings.connectPaths });
          onToggleRoads();
        }
      }}
    >
      <div class="flex items-center gap-2">
        <Route class={`w-4 h-4 ${settings.connectPaths ? 'text-blue-600' : 'text-gray-400'}`} />
        <span class="text-sm font-medium text-gray-700">Connect Dots</span>
      </div>
      <div
        class={`w-8 h-4 rounded-full relative transition-colors ${
          settings.connectPaths ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <div
          class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm"
          style={`transform: ${settings.connectPaths ? 'translateX(1.125rem)' : 'translateX(0.125rem)'}`}
        ></div>
      </div>
    </div>

    <!-- Path Length Slider (Conditional) -->
    {#if settings.connectPaths}
      <div class="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200 pt-1">
        <div class="space-y-2">
          <div class="flex justify-between items-center mb-2">
            <label for="max-link-distance" class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Max Link Distance
            </label>
            <span
              class="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded"
            >
              {localPathLength} km
            </span>
          </div>
          <input
            id="max-link-distance"
            type="range"
            min="0"
            max="100"
            step="1"
            value={localPathLength}
            oninput={(e) => {
              localPathLength = parseFloat((e.currentTarget as HTMLInputElement).value);
            }}
            onmouseup={(e) => onMaxLinkDistanceChange(parseFloat((e.currentTarget as HTMLInputElement).value))}
            ontouchend={(e) => onMaxLinkDistanceChange(parseFloat((e.currentTarget as HTMLInputElement).value))}
            class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center mb-2">
            <label for="max-link-velocity" class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Max Link Velocity
            </label>
            <span
              class="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded"
            >
              {localPathVelocity} km/h
            </span>
          </div>
          <input
            id="max-link-velocity"
            type="range"
            min="10"
            max="256"
            step="10"
            value={localPathVelocity}
            oninput={(e) => {
              localPathVelocity = parseFloat((e.currentTarget as HTMLInputElement).value);
            }}
            onmouseup={(e) => onMaxVelocityChange(parseFloat((e.currentTarget as HTMLInputElement).value))}
            ontouchend={(e) => onMaxVelocityChange(parseFloat((e.currentTarget as HTMLInputElement).value))}
            class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <p class="text-[10px] text-gray-400 leading-tight">
          Prevents drawing lines for flights or GPS jumps exceeding these limits.
        </p>
      </div>
    {/if}
  </div>
</div>

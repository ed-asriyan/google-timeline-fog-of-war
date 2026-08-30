<!-- Presentation Layer: File Upload Component (Svelte) -->
<script lang="ts">
  import { Plus, Database, ExternalLink } from '@lucide/svelte';
  import type { LoadingState } from '../hooks/useTimelineFiles.svelte';
  import { analytics } from '../../infrastructure/analytics';

  let {
    loadingState,
    onFilesSelected,
  }: {
    loadingState: LoadingState;
    onFilesSelected: (files: File[]) => void;
  } = $props();

  let inputRef: HTMLInputElement;
  let currentTime = $state('');

  const isProcessing = $derived(loadingState.status !== 'idle');

  $effect(() => {
    if (!isProcessing) {
      currentTime = '';
      return;
    }
    const tick = () => {
      currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  });

  function handleChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const files = Array.from(target.files);
      analytics.track('Files Selected', {
        fileCount: files.length,
      });
      onFilesSelected(files);
      if (inputRef) {
        inputRef.value = '';
      }
    }
  }

  const processingLabel = $derived(
    loadingState.status === 'parsing'
      ? `Parsing locations... ${loadingState.progress}%`
      : 'Loading files...'
  );
</script>

<div>
  <div class="relative mb-3">
    <input
      bind:this={inputRef}
      type="file"
      id="file-upload"
      multiple
      accept=".json,.gpx"
      onchange={handleChange}
      disabled={isProcessing}
      class="hidden"
    />
    <label
      for={isProcessing ? undefined : 'file-upload'}
      class={`flex flex-col items-center justify-center w-full h-10 px-4 rounded-lg transition-all shadow-sm border border-transparent font-medium text-sm ${
        isProcessing
          ? 'bg-blue-500 text-white cursor-wait opacity-80'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 cursor-pointer'
      }`}
    >
      {#if isProcessing}
        <span class="flex items-center gap-2 leading-none">
          <svg
            class="animate-spin w-4 h-4 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {processingLabel}
        </span>
        <span class="text-[10px] font-normal opacity-75 leading-none mt-0.5">
          As of {currentTime}
        </span>
      {:else}
        <span class="flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Add Google Timeline files
        </span>
      {/if}
    </label>
  </div>

  <div class="flex flex-col gap-1 mt-1 items-center text-[10px] text-gray-400">
    <p class="flex items-center gap-1 text-center leading-tight max-w-[90%] mx-auto opacity-75">
      <Database class="w-3 h-3 flex-shrink-0" />
      <span>Your data is <b>never</b> uploaded to any server</span>
    </p>
    <div>
      <span>Export Google Timeline files:</span>
      &nbsp;
      <a
        href="https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DAndroid&oco=1#androidimport"
        target="_blank"
        rel="noreferrer"
        class="items-center gap-1 hover:text-blue-500 transition-colors"
      >
        <ExternalLink class="w-3 h-3 inline" />
        &nbsp;
        <u>Android</u>
      </a>
      &nbsp;
      <span>and</span>
      &nbsp;
      <a
        href="https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DiOS&oco=1#iosimport"
        target="_blank"
        rel="noreferrer"
        class="items-center gap-1 hover:text-blue-500 transition-colors"
      >
        <ExternalLink class="w-3 h-3 inline" />
        &nbsp;
        <u>iOS</u>
      </a>
    </div>
  </div>
</div>

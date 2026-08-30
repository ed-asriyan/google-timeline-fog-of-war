<!-- Presentation Layer: Address Search Component (Svelte) -->
<script lang="ts">
  import { Search, X, Loader2 } from '@lucide/svelte';
  import { analytics } from '../../infrastructure/analytics';

  interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }

  let {
    onLocationSelect,
  }: {
    onLocationSelect: (lat: number, lon: number) => void;
  } = $props();

  let query = $state('');
  let results = $state<SearchResult[]>([]);
  let isSearching = $state(false);
  let showResults = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;
  let containerRef: HTMLDivElement;

  // Close results when clicking outside
  $effect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef && !containerRef.contains(event.target as Node)) {
        showResults = false;
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  async function searchAddress(searchQuery: string) {
    if (!searchQuery.trim()) {
      results = [];
      return;
    }

    isSearching = true;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`,
        {
          headers: {
            'User-Agent': 'Google Timeline Fog of War App',
          },
        }
      );
      const data = await response.json();
      results = data;
      showResults = true;
    } catch (error) {
      console.error('Search error:', error);
      results = [];
    } finally {
      isSearching = false;
    }
  }

  function handleInputChange(value: string) {
    query = value;

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search
    if (value.trim()) {
      searchTimeout = setTimeout(() => {
        searchAddress(value);
      }, 500);
    } else {
      results = [];
      showResults = false;
    }
  }

  function handleResultClick(result: SearchResult) {
    analytics.track('Location Searched', {
      // Don't track actual coordinates or full address for privacy
      hasResult: true,
    });
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
    query = result.display_name;
    showResults = false;
  }

  function handleClear() {
    query = '';
    results = [];
    showResults = false;
  }
</script>

<div bind:this={containerRef} class="relative w-full">
  <!-- Search Input -->
  <div class="relative group">
    <Search
      class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors"
    />
    <input
      type="text"
      value={query}
      oninput={(e) => handleInputChange((e.currentTarget as HTMLInputElement).value)}
      onfocus={() => {
        if (results.length > 0) showResults = true;
      }}
      placeholder="Search location..."
      class="w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl shadow-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
    />
    {#if query}
      <button
        onclick={handleClear}
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        {#if isSearching}
          <Loader2 class="w-4 h-4 animate-spin" />
        {:else}
          <X class="w-4 h-4" />
        {/if}
      </button>
    {/if}
  </div>

  <!-- Results Dropdown -->
  {#if showResults && results.length > 0}
    <div
      class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden divide-y divide-gray-100"
    >
      {#each results as result (result.place_id)}
        <button
          onclick={() => handleResultClick(result)}
          class="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-start gap-3 group"
        >
          <div class="mt-0.5 text-gray-400 group-hover:text-blue-500 transition-colors">
            <Search class="w-3.5 h-3.5" />
          </div>
          <div class="text-gray-700 line-clamp-2 leading-relaxed">{result.display_name}</div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- No Results Message -->
  {#if showResults && !isSearching && query && results.length === 0}
    <div
      class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center"
    >
      <p class="text-sm text-gray-500">No results found</p>
    </div>
  {/if}
</div>

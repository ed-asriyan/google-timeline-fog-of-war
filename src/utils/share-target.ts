// Utility to handle shared files from PWA share target

const CACHE_NAME = 'timeline-fow-shared-files';
const SHARED_DATA_KEY = 'shared-files';

interface SharedFileData {
  name: string;
  type: string;
  content: string;
}

/**
 * Check if there are files shared via the PWA share target
 * and retrieve them from the cache
 */
export async function getSharedFiles(): Promise<File[]> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(SHARED_DATA_KEY);
    
    if (!response) {
      return [];
    }
    
    const filesData: SharedFileData[] = await response.json();
    
    // Clear the cached data after reading
    await cache.delete(SHARED_DATA_KEY);
    
    // Convert back to File objects
    const files = filesData.map(fileData => {
      const blob = new Blob([fileData.content], { type: fileData.type || 'application/json' });
      return new File([blob], fileData.name, { type: fileData.type || 'application/json' });
    });
    
    return files;
  } catch (error) {
    console.error('Error retrieving shared files:', error);
    return [];
  }
}

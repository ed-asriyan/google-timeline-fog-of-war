// Custom service worker handler for share target
// This will be injected into the generated service worker

// Handle share target
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle share target endpoint
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(handleSharedFiles(event.request));
  }
});

async function handleSharedFiles(request) {
  const CACHE_NAME = 'timeline-fow-shared-files';
  const SHARED_DATA_KEY = 'shared-files';
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    // Store the shared files temporarily
    if (files.length > 0) {
      const filesData = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          content: await file.text()
        }))
      );
      
      // Store in cache for the main app to retrieve
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify(filesData), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(SHARED_DATA_KEY, response);
    }
    
    // Redirect to the main app
    return Response.redirect('/', 303);
  } catch (error) {
    console.error('Error handling shared files:', error);
    return Response.redirect('/', 303);
  }
}

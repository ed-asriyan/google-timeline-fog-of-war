import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { analytics } from './infrastructure/analytics'
import { IndexedDbMapSegmentRepository } from './infrastructure/repositories/IndexedDbMapSegmentRepository'
import { MapSettingsRepository } from './infrastructure/repositories/MapSettingsRepository'
import { Map as MapApp } from './domains/map/app'

import { TimelineParserFactory } from './infrastructure/parsers/TimelineParser'

// Initialize analytics
analytics.init();

// Register service worker for PWA functionality
registerSW({
// ... (skipping SW registration detail limit)
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegisteredSW(swUrl, r) {
    console.log('SW registered:', swUrl);
    // Add custom fetch handler for share target
    if (r) {
      r.addEventListener('updatefound', () => {
        console.log('SW update found');
      });
    }
  },
})

// Extend service worker with share target handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    // The service worker will automatically handle /share-target endpoint
    console.log('Service Worker ready');
  });
}

// Create infrastructure and application objects, then render
IndexedDbMapSegmentRepository.openDb().then(mapSegmentRepository => {
  const mapSettingsRepository = new MapSettingsRepository();
  
  const parser = new TimelineParserFactory();
  const mapApp = new MapApp(mapSegmentRepository, parser, mapSettingsRepository);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App mapApp={mapApp} mapSegmentRepository={mapSegmentRepository} />
    </React.StrictMode>,
  );
}).catch(err => {
  console.error('Failed to initialize app:', err);
  alert('Failed to initialize app. Error: ' + err);
});

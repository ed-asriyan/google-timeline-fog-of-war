import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { analytics } from './infrastructure/analytics'

// Initialize analytics
analytics.init();

// Register service worker for PWA functionality
registerSW({
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

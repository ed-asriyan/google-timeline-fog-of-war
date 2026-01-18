import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Google Timeline Fog of War',
        short_name: 'Timeline FOW',
        description: 'Gamify your travel history by revealing places you have visited',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/1.png',
            sizes: '2458x1588',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshots/2.png',
            sizes: '1076x2151',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: '/screenshots/3.png',
            sizes: '1076x2147',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'files',
                accept: ['application/json', '.json']
              }
            ]
          }
        }
      },
      workbox: {
        // Import our custom share target handler
        importScripts: ['/sw-share-target.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  base: './', // Useful for GitHub Pages relative paths
})

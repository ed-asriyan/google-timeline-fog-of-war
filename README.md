# Google Timeline Fog of War 🗺️⚔️

Gamify your travel history! This application visualizes your Google Timeline location history by clearing the "Fog of War" from the world map as you explore.

**Live Demo:** [https://fogofwar.asriyan.me](https://fogofwar.asriyan.me)

## ✨ Features

*   **Fog of War Mechanics**: The map is initially obscured. Your visited locations interactively clear the fog.
*   **Privacy First**: 🔒 **All processing happens locally in your browser.** Your location data is **never** uploaded to any server.
*   **Offline Capable**: Installable as a PWA (Progressive Web App) on desktop and mobile.
*   **Customizable**: Adjust visibility radius and toggle travel path connections.
*   **Persistent**: Data is saved locally in your browser (IndexedDB) so you don't have to re-upload every time.
*   **Responsive**: Works on desktop and mobile devices.

## 🚀 How to Use
1.  **Get your Data**:
    *   Export Google Timeline files ([how to do it?](https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DAndroid&oco=1#androidimport))
2.  **Upload**:
    *   Open the app.
    *   Click "Add Google Timeline files".
    *   Select one or multiple JSON files.
3.  **Explore**:
    *   Watch the fog vanish!
    *   Use the controls to tweak the visual settings.

## 🛠️ Development

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation
```bash
git clone https://github.com/ed-asriyan/google-timeline-fog-of-war.git
cd google-timeline-fog-of-war
npm ci
```

### Run Locally
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🏗️ Built With
*   [React](https://react.dev/)
*   [Vite](https://vitejs.dev/)
*   [Leaflet](https://leafletjs.com/) (Maps)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Vite PWA](https://vite-pwa-org.netlify.app/)
*   IndexedDB (Local Storage)

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

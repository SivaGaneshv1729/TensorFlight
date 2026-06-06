# AgriHUD Frontend

Next-generation HUD interface for drone operations, built with React and Three.js.

## Features

- **Augmented Reality HUD**: Real-time overlays for altitude, battery, and GPS.
- **3D Spatial Scene**: Uses `@react-three/fiber` to render a virtual horizon and flight tunnel.
- **Zustand State Management**: Centralized telemetry store for high-performance updates.
- **WebSocket Integration**: Low-latency connection to the backend telemetry stream.

## Structure

- `src/components/HUD.jsx`: 2D SVG/CSS HUD elements.
- `src/canvas/Scene.jsx`: 3D Three.js environment.
- `src/store/useTelemetryStore.js`: Global state management.
- `src/useWebSocket.js`: Connection logic and message handling.

## Styling
Uses **TailwindCSS** for UI components with a custom "Agri-Neon" color palette designed for high visibility in field conditions.

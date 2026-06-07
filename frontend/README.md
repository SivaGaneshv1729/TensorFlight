# AgriHUD Frontend

Next-generation HUD interface for drone operations, built with React and Three.js.

## Features

- **Augmented Reality HUD**: Real-time overlays for altitude, battery, and GPS with optimized re-renders.
- **Modernized 3D Environment**: High-stability spatial scene with `Sky`, `Stars`, and `BoundedEnvironment`.
- **Live Video Stream**: Integrated MJPEG stream with toggleable **VARI (Visible Atmospheric Resistant Index)** mode for crop health analysis.
- **Manual Controls**: Fly the drone directly from the interface using WASD and Arrow keys.
- **Zustand State Management**: High-performance telemetry store using shallow selectors.
- **Smooth Interpolation**: 20Hz telemetry data is smoothly interpolated in the 3D scene using `lerp` to prevent jitter.

## Structure

- `src/components/HUD.jsx`: 2D SVG/CSS HUD elements, optimized for performance.
- `src/components/VideoContainer.jsx`: Real-time video player with health analysis toggles.
- `src/canvas/Scene.jsx`: 3D environment with smooth camera and orientation tracking.
- `src/useKeyboardControls.js`: Event listeners for manual flight inputs.
- `src/useWebSocket.js`: Connection logic and message handling.

## Controls

- **WASD**: Pitch and Roll.
- **Arrow Keys**: Altitude and Yaw.
- **VARI Toggle**: Found on the video feed to switch between normal and health analysis modes.

## Styling
Uses **TailwindCSS** for UI components with a custom "Agri-Neon" color palette. The interface is designed for high-contrast visibility in outdoor agricultural environments.

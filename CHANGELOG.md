# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-06-07

### Added
- **Live Video Streaming**: Real-time MJPEG feed from the drone/backend to the HUD.
- **VARI Analysis**: Added Visible Atmospheric Resistant Index (VARI) mode to the video stream for basic crop health visualization.
- **Manual Keyboard Controls**: Support for WASD (Pitch/Roll) and Arrow Keys (Altitude/Yaw) to control the drone/simulator.
- **Command Polling System**: New backend mechanism to allow high-frequency manual control updates (20Hz).
- **MongoDB Persistence**: Async logging of all telemetry data to a local MongoDB instance.
- **Sky & Environmental Effects**: Added `Sky`, `Stars`, and `Cloud` components to the 3D scene for better spatial orientation.

### Changed
- **Modernized 3D Scene**: Refactored `Scene.jsx` to use a `BoundedEnvironment` and smooth camera interpolation via `lerp`.
- **Gimbal Lock Resolution**: Fixed rotation order and interpolation logic to prevent jitter and gimbal lock during extreme maneuvers.
- **Optimized HUD State**: Implemented shallow selectors in `HUD.jsx` and `App.jsx` to minimize React re-renders during high-frequency telemetry updates.
- **Scorched-Earth Simulator**: Updated `mock_telemetry.py` with zero-drift physics and instantaneous command response.
- **UI Styling**: Refined "Agri-Neon" palette and added interactive toggles for video modes.

### Fixed
- Resolved WebSocket connection logging and disconnection handling.
- Fixed database event loop conflicts by using async MongoDB drivers.
- Resolved "ghost drift" in the 3D environment by freezing star and cloud movement.

## [1.0.0] - 2026-05-20

### Added
- Initial project release with basic telemetry visualization and 3D horizon.
- FastAPI backend with WebSocket support.
- Basic circular flight simulator.
- TailwindCSS-based HUD interface.

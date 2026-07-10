# Changelog

## [Unreleased]
### Added
- **AI Guided Scouting**: Implemented 'GUIDED MISSION' button logic to autonomously generate and execute a 4-point square search pattern over the field.
- **Dynamic Speed Control**: Manual flight control physics now accurately interpret and apply the frontend's Forward Speed settings for realistic thrust scaling.

### Changed
- **Dark Theme Overhaul**: Darkened the main dashboard to a stealthier, professional aesthetic (using `#0a0a0c` and `#141517` backgrounds).
- **Compact UI Layout**: Significantly reduced padding, gaps, and sizes in the `Sidebar`, `TelemetryPanel`, and `ControllerPanel` for a more tactical, data-dense layout.

### Fixed
- **Simulator Physics**: Greatly reduced the aerodynamic drag coefficient in `mock_telemetry.py` from 2.5 to 0.8, allowing the drone to reach proper top speeds without struggling.
- **RTL Altitude Bug**: Fixed a critical simulation bug where the drone would get stuck bouncing at 15m altitude during a Return-to-Launch sequence instead of landing and disarming.

## [1.1.0] - 2026-06-07
### Added
- **ArduPilot SITL Integration:** Replaced mock telemetry with a real-time MAVLink bridge.
- **MAVLink Bridge:** Implementation of `app/core/mavlink.py` using `pymavlink`.
- **Horizontal GPS Movement:** Added GPS-to-local coordinate translation logic in `Scene.jsx`.
- **Command Routing:** Native support for ARM, TAKEOFF, and LAND MAVLink commands.

### Changed
- **Architectural Overhaul:** Transitioned from a standalone mock simulator to a professional-grade SITL architecture.
- **Non-blocking Startup:** Backend now initializes without waiting for a MAVLink heartbeat, improving stability.

### Fixed
- Video pipeline resource leak potential by refining initialization.
- Frontend "Ghost Drift" by fixing Star and Cloud movement speeds.


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

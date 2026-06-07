# AgriHUD Backend

High-performance API and telemetry distribution engine built with FastAPI.

## Key Components

- `app/main.py`: Application entry point and middleware configuration.
- `app/api/websockets.py`: WebSocket handler for real-time telemetry streaming (20Hz) with MongoDB persistence.
- `app/api/endpoints.py`: REST endpoints for drone commands, command polling, and video streaming.
- `app/core/video_pipeline.py`: OpenCV-based pipeline for frame processing (Normal vs VARI analysis).
- `mock_telemetry.py`: "Scorched-Earth" simulator with zero-drift manual control support.

## API Endpoints

- `GET /health`: Health check.
- `POST /telemetry/update`: Receives telemetry from the drone or simulator.
- `WS /ws/telemetry`: WebSocket stream for the frontend.
- `POST /api/command`: Send flight commands (Land, RTH) or `MANUAL_CONTROL` inputs.
- `GET /api/commands/poll`: Poll current manual inputs (used by the simulator).
- `GET /api/video/stream?mode=normal`: Live MJPEG video stream (modes: `normal`, `vari`).

## Simulator Logic
The `mock_telemetry.py` script implements a low-latency control loop:
- **Command Polling**: Fetches active keyboard inputs from the backend at 20Hz.
- **Zero-Drift Physics**: Instantaneous velocity application for precise simulator testing.
- **Visual Tilt Interpolation**: Smoothly tilts the simulated drone during movement, snapping back to zero when idle.
- **State Persistence**: Reports active state and battery drainage based on altitude.

## Database
Telemetry logs are persisted to a MongoDB instance (`telemetry_logs` collection) for post-flight analysis and mission playback.

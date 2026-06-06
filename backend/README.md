# AgriHUD Backend

High-performance API and telemetry distribution engine built with FastAPI.

## Key Components

- `app/main.py`: Application entry point and middleware configuration.
- `app/api/websockets.py`: WebSocket handler for real-time telemetry streaming (20Hz).
- `app/api/endpoints.py`: REST endpoints for drone commands.
- `mock_telemetry.py`: A standalone simulation script for testing the HUD without a physical drone.

## API Endpoints

- `GET /`: Health check.
- `POST /telemetry/update`: Receives telemetry from the drone or simulator.
- `WS /ws/telemetry`: WebSocket stream for the frontend.
- `POST /api/command`: Send flight commands (Land, Return to Home, etc.).

## Simulator Logic
The `mock_telemetry.py` script simulates:
- A circular flight pattern around a fixed GPS coordinate.
- Fluctuating altitude based on a sine wave.
- Real-time battery percentage reporting.

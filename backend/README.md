# AgriHUD Backend & AI Engine

High-performance API, AI Computer Vision processor, and telemetry distribution engine built with FastAPI.

## Key Components

- `app/main.py`: Application entry point. Wires the Video stream, AI Engine, and WebSockets together upon lifespan startup.
- `app/api/websockets.py`: WebSocket handler for real-time telemetry streaming. Receives physical simulation data and seamlessly injects live ML metrics before broadcasting to React.
- `app/api/endpoints.py`: REST endpoints for REST commands, AI status checks (`/api/ai/latest`, `/api/ai/weather`), and MJPEG video streaming.
- `app/ai/analysis_engine.py`: Runs an asynchronous, non-blocking 4fps daemon thread merging computer vision and live weather.
- `app/ai/vegetation_analysis.py`: OpenCV-based algorithmic processor computing VARI, ExG, and NGRDI indices from standard RGB frames.
- `app/ai/crop_classifier.py`: Scikit-Learn RandomForest classifier determining whether a crop zone is Healthy, Weed, Pest-Stressed, or Drought-Stressed.
- `app/ai/weather_model.py`: Connects to Open-Meteo API using the active GPS coordinate for real wind, temperature, and storm modeling.
- `mock_telemetry.py`: "Scorched-Earth" simulator providing 10Hz physical drone physics, multi-drone spoofing, and zero-drift manual control support.

## API Endpoints

- `GET /api/health`: Health check, returns AI daemon status and last analysis age.
- `GET /api/video/stream?mode=normal`: Live MJPEG video stream with dynamically drawn bounding boxes.
- `GET /api/ai/latest`: Full JSON dump of the most recent AI and weather inference.
- `GET /api/ai/report`: Returns the history of AI inferences for trend graphing.
- `GET /api/ai/weather`: Forces a fetch of current API weather conditions.
- `POST /api/telemetry/update`: Receives telemetry from the drone or simulator.
- `WS /ws/telemetry`: High-speed WebSocket stream for the React frontend.
- `POST /api/command`: Send flight commands (Arm, Disarm) or `MANUAL_CONTROL` stick inputs.

## AI & Simulator Workflow

The `mock_telemetry.py` script executes a 10Hz simulation loop, establishing 3D positions, attitudes (pitch, roll, yaw), and battery drains for the fleet. 
Simultaneously, the `analysis_engine.py` parses the local webcam/video feed through the ML models.
Before the backend broadcasts physical state to the UI via `/ws/telemetry`, it intercepts the packet and appends the `ai_analysis` dictionary containing real spectral indices, bounding boxes, and weather warnings.

## Dependencies

- **FastAPI/Uvicorn**: Core web server
- **OpenCV-Python**: Image manipulation and bounding boxes
- **NumPy & Scipy**: Fast, vectorized agricultural index computation
- **Scikit-Learn**: Machine Learning classifiers
- **PyMAVLink**: Bridging architecture for ArduPilot SITL / Pixhawk hardware

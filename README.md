# AgriHUD-AI: Precision Agriculture Drone Interface

AgriHUD-AI is a high-performance, web-based Ground Control Station (GCS) and Head-Up Display (HUD) for precision agriculture. It provides real-time telemetry visualization, 3D holographic overlays, live video streaming with ML-powered health analysis, and manual flight controls.

## ✨ Key Features

- **Live Video Stream**: Real-time camera feed with ultra-low latency.
- **VARI Health Analysis**: Toggleable Visible Atmospheric Resistant Index (VARI) mode to assess crop health from standard RGB frames.
- **Manual Keyboard Controls**: Control the drone or simulator using WASD and Arrow keys (20Hz polling).
- **3D Spatial HUD**: Modernized holographic environment with smooth interpolation and gimbal-lock resolution.
- **High-Frequency Telemetry**: 20Hz WebSocket updates for real-time responsiveness.
- **Data Persistence**: Automatic telemetry logging to MongoDB for post-flight analysis.

## 🏗️ Professional Architecture

The project now implements an industry-standard simulation and flight control stack:
- **Frontend:** React + Three.js (React Three Fiber) for real-time 3D HUD rendering and GPS-to-World coordinate translation.
- **Backend:** FastAPI with a high-performance **MAVLink Bridge** (`pymavlink`).
- **Autopilot:** Integrates directly with **ArduPilot SITL** for realistic flight dynamics, failsafes, and MAVLink communication.
- **Data Persistence:** Automatic telemetry logging to MongoDB for post-flight analysis.

## 🚀 Setup & Execution

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for ArduPilot SITL)
- MongoDB (Running locally on default port 27017)

### 2. Start ArduPilot SITL (The Drone Brain)
Run the flight simulator via Docker:
```bash
docker run -it -p 14550:14550/udp radarku/ardupilot-sitl
```

### 3. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://127.0.0.1:5173` to view the HUD.

## 🎮 Flight Commands
The UI now routes commands directly to ArduPilot via MAVLink:
- **ARM**: Prepare motors for flight.
- **TAKEOFF**: Automatic ascent to a target altitude.
- **LAND**: Automatic descent and disarming.
- **SET_MODE**: Switch between GUIDED, LOITER, and RTL.

## 🛰️ Telemetry Schema

The system uses a standardized JSON schema for telemetry:
```json
{
  "timestamp": 1623456789,
  "is_active": true,
  "drone_state": {
    "gps": { "latitude": 12.9716, "longitude": 77.5946, "altitude_relative_m": 10.5 },
    "orientation_deg": { "pitch": 2.1, "roll": -0.5, "yaw_heading": 185.0 },
    "battery_percentage": 92
  },
  "navigation_target": {
    "next_waypoint_gps": { "latitude": 12.9720, "longitude": 77.5950 },
    "distance_to_wp_m": 45.2,
    "coverage_efficiency_score": 0.98
  }
}
```

## 📜 License
MIT

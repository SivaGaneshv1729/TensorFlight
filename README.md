# AgriHUD-AI: Precision Agriculture Drone Interface

AgriHUD-AI is a high-performance, web-based Ground Control Station (GCS) and Head-Up Display (HUD) for precision agriculture. It provides real-time telemetry visualization, 3D holographic overlays, live video streaming with ML-powered health analysis, and manual flight controls.

## ✨ Key Features

- **Live Video Stream**: Real-time camera feed with ultra-low latency.
- **VARI Health Analysis**: Toggleable Visible Atmospheric Resistant Index (VARI) mode to assess crop health from standard RGB frames.
- **Manual Keyboard Controls**: Control the drone or simulator using WASD and Arrow keys (20Hz polling).
- **3D Spatial HUD**: Modernized holographic environment with smooth interpolation and gimbal-lock resolution.
- **High-Frequency Telemetry**: 20Hz WebSocket updates for real-time responsiveness.
- **Data Persistence**: Automatic telemetry logging to MongoDB for post-flight analysis.

## 🏗️ Architecture

- **Frontend:** React + Three.js (Fiber/Drei) + TailwindCSS + Zustand.
  - Optimized 3D environment with `BoundedEnvironment` for stability.
  - `useKeyboardControls` hook for low-latency command dispatch.
  - Reactive HUD components using optimized store selectors.
- **Backend:** FastAPI (Python) + OpenCV + WebSockets.
  - `VideoPipeline` for real-time image processing (Normal vs VARI).
  - Dedicated command polling system for high-frequency manual control.
  - Async MongoDB integration for flight logs.
- **Simulator:** "Scorched-Earth" physics model with zero-drift manual control simulation.

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (Running locally on default port 27017)
- A webcam (for `VideoPipeline` if no drone is connected)

### 2. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

### 4. Running the System
You can start all components using the following commands:

**Backend (API & Stream):**
```bash
cd backend
uvicorn app.main:app --reload
```

**Simulator (Manual Control):**
```bash
cd backend
python mock_telemetry.py
```

**Frontend (HUD Interface):**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to view the HUD.

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` / `S` | Pitch Forward / Back |
| `A` / `D` | Roll Left / Right |
| `↑` / `↓` | Altitude Up / Down |
| `←` / `→` | Yaw Left / Right |

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

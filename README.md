# AgriHUD-AI: Precision Agriculture Drone Interface

AgriHUD-AI is a high-performance, web-based Ground Control Station (GCS) and Head-Up Display (HUD) for precision agriculture. It provides real-time telemetry visualization, 3D holographic overlays, and ML-powered crop health analysis.

## 🏗️ Architecture

- **Frontend:** React + Three.js (Fiber/Drei) + TailwindCSS + Zustand.
  - Implements a low-latency HUD with augmented reality overlays.
  - 3D spatial visualization for flight paths and waypoint navigation.
- **Backend:** FastAPI (Python) + WebSockets.
  - Handles real-time telemetry distribution at 20Hz.
  - Provides REST endpoints for drone commands and telemetry updates.
- **Simulator:** Async Python script simulating drone flight and battery drainage.

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (Optional, for mission logging)

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
You can start all components using the following commands (ideally in separate terminals):

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Simulator:**
```bash
cd backend
python mock_telemetry.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to view the HUD.

## 🛰️ Telemetry Schema

The system uses a standardized JSON schema for telemetry:
```json
{
  "timestamp": 1623456789,
  "drone_state": {
    "gps": { "latitude": 12.9716, "longitude": 77.5946, "altitude_relative_m": 10.5 },
    "orientation_deg": { "pitch": 2.1, "roll": -0.5, "yaw_heading": 185.0 },
    "battery_percentage": 92
  },
  "navigation_target": {
    "next_waypoint_gps": { "latitude": 12.9720, "longitude": 77.5950 },
    "distance_to_wp_m": 45.2
  }
}
```

## 📜 License
MIT

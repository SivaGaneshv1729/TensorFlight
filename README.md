# AgriHUD-AI: Precision Agriculture Drone Interface

AgriHUD-AI is a high-performance, web-based Ground Control Station (GCS) and Head-Up Display (HUD) for precision agriculture. It provides real-time telemetry visualization, 3D holographic environment mapping, and autonomous mission planning capabilities.

## 🚀 Key Features

- **High-Fidelity Glass Cockpit**: A professional-grade, zero-gap UI featuring a Primary Flight Display (PFD) with realistic attitude indicators, rolling tapes, and a structured Flight Management System (FMS).
- **Single-Canvas 3D Engine**: Highly optimized WebGL architecture using `@react-three/fiber` for rendering multiple synchronized FPV viewports (Front, Rear, Ground) at 60+ FPS without duplicate memory overhead.
- **Realistic Simulated Environment**: Procedurally generated terrain, mountain ranges, and deterministic vegetation (200+ trees, farm complexes) for immersive flight simulation and obstacle awareness.
- **Tactical Radar & Mission Planning**: Interactive 2D Map (via Leaflet) styled as a tactical radar. It mathematically projects 3D simulated obstacles onto GPS coordinates, allowing users to point-and-click to set autonomous `GOTO_WAYPOINT` navigation paths.
- **MAVLink Integration**: Backend built with FastAPI, bridging WebSocket UI commands directly to ArduPilot SITL (or physical drones) via PyMAVLink.
- **Low-Latency Video Pipeline**: Integrated OpenCV streaming with simulated health-analysis (VARI) filters.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Three.js, React-Three-Fiber, Zustand, Leaflet, Lucide-React.
- **Backend**: Python, FastAPI, PyMAVLink, OpenCV, Motor (MongoDB).
- **Simulation**: Custom `mock_telemetry.py` with physical flight dynamics, or Dockerized ArduPilot SITL.

## 🏃‍♂️ Running the Project

### 1. Backend (API & Telemetry)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # or `source venv/bin/activate` on Linux/Mac
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Simulator (Flight Physics)
In a new terminal:
```bash
cd backend
.\venv\Scripts\activate
python mock_telemetry.py
```

### 3. Frontend (UI)
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Access the dashboard at `http://127.0.0.1:5173`.

## 📜 License
MIT

# AgriHUD-AI: Precision Agriculture Drone Interface

AgriHUD-AI is a high-performance, web-based Ground Control Station (GCS) and Head-Up Display (HUD) built for precision agriculture. It combines 3D holographic environment mapping, real-time ML-driven crop analysis, and drone fleet management into a single, cohesive industrial dashboard.

## 🚀 Key Features

- **High-Fidelity Industrial Cockpit**: A zero-gap, scroll-free dashboard layout containing a Primary Flight Display (PFD) with realistic attitude indicators, rolling altitude/speed tapes, and dual-stick manual controls.
- **Dynamic Multi-View Framework**: A highly flexible WebGL camera system allowing pilots to swap instantly between a 3D Map Radar, Forward FPV, Rear FPV, and Nadir (downward) camera feeds into the main viewport seamlessly.
- **Real-Time AI Crop Analysis**: Integrated Computer Vision pipeline mapping real NDVI/VARI indices directly from RGB feeds, classified by a Scikit-Learn Random Forest model (Healthy, Weed, Pest Stress, Drought Stress).
- **Live Weather Integration**: Connects dynamically to the Open-Meteo API based on drone GPS coordinates, pulling real wind vectors, temperatures, and predicting flight safety conditions.
- **Single-Canvas 3D Engine**: Highly optimized WebGL architecture using `@react-three/fiber` rendering multi-perspective views at 60 FPS utilizing shared geometries, instanced meshes, and strictly memoized configurations to prevent context loss.
- **Multi-Drone Fleet Management**: Dynamic WebSocket broadcasting handling synchronized telemetry feeds for multiple UAVs seamlessly from a fast Python backend.
- **Tactical Radar & Mission Planning**: Interactive 2D Leaflet map styled as a tactical radar to track drone movements and plan autonomous routes.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS (strict CSS Grid layout), Three.js, React-Three-Fiber, Zustand, Leaflet, Lucide-React.
- **Backend Core**: Python, FastAPI, WebSockets.
- **AI/ML Pipeline**: OpenCV (Video processing), NumPy (Index calculation), Scikit-Learn (Classification), Open-Meteo (Weather).
- **Simulation**: Custom high-efficiency deterministic physics engine (`mock_telemetry.py`) bypassing SITL for rapid frontend/backend testing. Features fully stable exponential decay integration and omnidirectional AI pathing.

## 🏃‍♂️ Running the Project

### 1. Backend API & AI Engine
```bash
cd backend
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Simulation Environment (Flight Physics & Drone Data)
In a new terminal window:
```bash
cd backend
.\venv\Scripts\activate
python mock_telemetry.py
```

### 3. Frontend UI
In a third terminal window:
```bash
cd frontend
npm install
npm run dev
```
Access the dashboard at `http://127.0.0.1:5173`.

## 📜 Architecture

- The backend (`AnalysisEngine`) runs the expensive crop inferences and weather fetching asynchronously, merging the `AIReport` directly into the fleet's 10Hz MAVLink stream.
- The frontend strictly throttles React UI redraws to 8 FPS to prevent render fatigue, while the WebGL `<Canvas />` runs unimpeded at 60 FPS.

## 📄 License
MIT

# AgriHUD-AI: Comprehensive Project Report

## 1. Executive Summary

**AgriHUD-AI** is a state-of-the-art precision agriculture dashboard designed to operate as a Ground Control Station (GCS) and Head-Up Display (HUD) for agricultural UAV fleets. The system bridges high-performance WebGL 3D rendering, real-time Computer Vision analysis, and autonomous UAV flight physics into a unified, zero-latency industrial interface. 

This document serves as a detailed report outlining the working procedures, feature set, real-time analytics methodology, and future scope of the project.

---

## 2. Working Procedure

The AgriHUD-AI ecosystem operates on a decoupled client-server architecture to maximize render efficiency and analytical throughput.

### 2.1 Backend: Physics and AI Engine
1. **Telemetry Simulation**: The backend utilizes a deterministic kinematic physics engine (`mock_telemetry.py`) running at 10Hz. It accurately simulates multirotor flight dynamics including pitch/roll-induced acceleration, exponential aerodynamic drag, and turbulent wind drift.
2. **AI Target Generation**: Real-time simulated crop data (e.g., weed targets, pest stress clusters, and crop health indices like VARI and ExG) is generated and injected into the telemetry payload.
3. **Command Processing**: The server listens for WebSocket events containing MAVLink-style commands (e.g., `TAKEOFF`, `RTL`, `MANUAL_CONTROL`, `SET_MODE: GUIDED`) and translates them into physical UAV maneuvers or AI navigation objectives.

### 2.2 Frontend: React & WebGL Engine
1. **WebSocket Ingestion**: The frontend connects to the backend at `ws://127.0.0.1:8000` to stream real-time JSON payloads containing fleet GPS coordinates, attitude (pitch/roll/yaw), and AI analysis metadata.
2. **State Management**: Using `Zustand`, the raw 10Hz telemetry data is parsed using shallow selectors to prevent heavy React DOM re-renders. The HUD updates completely independently of the underlying 3D canvas.
3. **WebGL Rendering**: The `@react-three/fiber` canvas operates autonomously at 60 FPS. It dynamically interpolates the drone's position and attitude to generate ultra-smooth, jitter-free FPV, Radar, and Nadir camera views using shared geometries to prevent GPU bottlenecks.

---

## 3. Core Features

### 3.1 Industrial Holographic HUD
- **Zero-Gap Layout**: A strictly enforced CSS Grid ensures a professional, responsive dashboard layout with no scrolling required.
- **Dark Tactical Aesthetic**: Utilizes a highly readable `#0a0a0c` dark mode palette with strategic color accents (e.g., Agri-Neon green for safe/active states, Amber/Red for warnings).
- **Dynamic Multi-View System**: Allows the operator to instantly switch between primary visual feeds:
  - **Radar**: A top-down strategic overview for tracking the entire fleet.
  - **FPV (Forward)**: First-person drone nose camera view with real-time pitch/roll matching.
  - **Rear View**: Tail-mounted backup camera.
  - **Nadir (Downward)**: Crucial for direct crop scanning and precision spraying.

### 3.2 Real-Time Real-World Data Integration
- **Live Weather Sync**: Integrates with the `Open-Meteo API` to dynamically fetch live weather metrics (wind speed, direction, temperature, and storm predictions) based on the drone's exact GPS coordinates.

### 3.3 Autonomous & Manual Flight Controls
- **Dual-Stick Controller**: A responsive digital D-Pad layout supporting WASD + Arrow Keys for fluid manual override capabilities (Throttle, Yaw, Pitch, Roll).
- **Dynamic Thrust Scaling**: The manual physics engine directly interprets user-defined "Forward Speed" and "Climb Speed" slider settings, allowing seamless transitions between slow, methodical scans and high-speed transit flights.
- **RTL (Return to Launch)**: A robust failsafe mechanism that commands the drone to navigate to home coordinates, perform a stabilized descent, and automatically disarm upon touchdown.
- **AI Guided Scouting**: An autonomous `GUIDED MISSION` mode that programmatically generates and executes a 4-point expanding square search pattern to systematically scan a crop field without manual pilot input.

---

## 4. Real-Time Analysis & Reporting

![AgriHUD-AI Dashboard](assets/dashboard.png)
*Figure 1: The main AgriHUD-AI dashboard running in a live monitoring state.*

### 4.1 EICAS (Engine Indicating and Crew Alerting System)
The Telemetry panel serves as an EICAS, providing real-time aggregation of AI inferences and flight safety metrics:
- **Weed Targets**: Actively counts localized anomalies classified as weeds.
- **Crop Health (VARI)**: Uses the Visible Atmospheric Resistant Index to calculate a real-time percentage of crop coverage vs. stressed zones.
- **Wind Vectors**: Visualized on the mini-radar, showing precise wind drift impact on the UAV's flight path.

### 4.2 Spray Recommendation Engine
The system aggregates the real-time AI metrics (Weed Count, Pest Stress, NDVI, and Wind speeds) to output a binary, high-visibility decision:
- **No Spray Needed**: Denotes healthy crop thresholds or unsafe weather conditions (e.g., high winds preventing spray drift compliance).
- **Spray Recommended**: Highlights specific zones requiring targeted agricultural intervention, minimizing chemical usage by focusing solely on stressed coordinates.

---

## 5. Project Scope and Future Expansion

The foundational architecture of AgriHUD-AI is highly modular, allowing for significant industrial scaling.

### 5.1 Immediate Scope
- **Hardware Integration**: Bridging the Python `mock_telemetry` backend directly to a physical Pixhawk flight controller via a 915MHz SiK Telemetry Radio and `pymavlink` (as documented in `Hardware_Integration.md`).
- **Live RTSP Video Analysis**: Swapping the simulated 3D WebGL background for a live `gstreamer` feed running through OpenCV for real-time edge detection and crop classification.

### 5.2 Long-Term Scope
- **Swarm Operations**: Expanding the radar and WebSocket systems to handle 10+ drones simultaneously, rendering fleet formations and assigning clustered sub-missions dynamically.
- **Cloud Analytics**: Persistent telemetry and ML classification logging into MongoDB for seasonal yield analysis, predictive drought modeling, and historical heatmaps of pest migrations.
- **Automated Chemical Dosing**: Integrating physical spray nozzles with the AI recommendation engine to achieve fully automated, precision spot-spraying based strictly on real-time VARI anomalies.

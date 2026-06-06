from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json

router = APIRouter()

# Global shared state for telemetry
latest_telemetry = {
    "timestamp": 0,
    "is_active": False,
    "drone_state": {
        "gps": {"latitude": 12.9716, "longitude": 77.5946, "altitude_relative_m": 0.0},
        "orientation_deg": {"pitch": 0.0, "roll": 0.0, "yaw_heading": 0.0},
        "battery_percentage": 100
    },
    "navigation_target": {
        "next_waypoint_gps": {"latitude": 12.9720, "longitude": 77.5950},
        "distance_to_wp_m": 0.0,
        "coverage_efficiency_score": 1.0
    }
}

@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(latest_telemetry)
            await asyncio.sleep(0.05) # 20Hz update for smooth UI
    except WebSocketDisconnect:
        print("Telemetry WebSocket disconnected")

@router.post("/telemetry/update")
async def update_telemetry(data: dict):
    global latest_telemetry
    latest_telemetry = data
    latest_telemetry["is_active"] = True
    # Debug print to ensure data is arriving
    print(f"📡 Received Telemetry: Lat {data['drone_state']['gps']['latitude']:.4f}")
    return {"status": "success"}

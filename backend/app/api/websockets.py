import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

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

class TelemetryBroadcaster:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        
        # Create a list of tasks for parallel sending
        tasks = [connection.send_json(message) for connection in self.active_connections]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Clean up any connections that failed
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                await self.disconnect(self.active_connections[i])

broadcaster = TelemetryBroadcaster()

@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        while True:
            # The broadcaster handles the data, this loop keeps the socket alive
            await broadcaster.broadcast(latest_telemetry)
            await asyncio.sleep(0.05) # 20Hz sync
    except WebSocketDisconnect:
        await broadcaster.disconnect(websocket)

@router.post("/telemetry/update")
async def update_telemetry(data: dict):
    global latest_telemetry
    latest_telemetry = data
    latest_telemetry["is_active"] = True
    return {"status": "success"}

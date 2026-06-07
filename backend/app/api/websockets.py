import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.telemetry import TelemetryData

router = APIRouter()

# Global shared state for telemetry
latest_telemetry = TelemetryData(
    timestamp=0,
    is_active=False,
    drone_state={
        "gps": {"latitude": 12.9716, "longitude": 77.5946, "altitude_relative_m": 0.0},
        "orientation_deg": {"pitch": 0.0, "roll": 0.0, "yaw_heading": 0.0},
        "battery_percentage": 100
    },
    navigation_target={
        "next_waypoint_gps": {"latitude": 12.9720, "longitude": 77.5950},
        "distance_to_wp_m": 0.0,
        "coverage_efficiency_score": 1.0
    }
)

class TelemetryBroadcaster:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        print(f"📡 New WebSocket Client Connected. Total: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        print(f"❌ WebSocket Client Disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: TelemetryData):
        if not self.active_connections:
            return
        
        data = message.model_dump_json()
        async with self._lock:
            connections = list(self.active_connections)

        # Broadcast to all clients
        tasks = [connection.send_text(data) for connection in connections]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

broadcaster = TelemetryBroadcaster()

@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        while True:
            # Keep the connection open and wait for messages (which we ignore)
            # or for a disconnect exception
            await websocket.receive_text()
    except WebSocketDisconnect:
        await broadcaster.disconnect(websocket)

from app.models.database import get_db

@router.post("/telemetry/update")
async def update_telemetry(data: TelemetryData):
    global latest_telemetry
    latest_telemetry = data
    latest_telemetry.is_active = True
    
    print(f"📥 Telemetry received: Lat={data.drone_state.gps.latitude:.4f}, Alt={data.drone_state.gps.altitude_relative_m:.1f}")
    
    # Trigger an immediate broadcast to all connected HUDs
    await broadcaster.broadcast(latest_telemetry)
    
    # Persist to MongoDB (Async)
    try:
        db = await get_db()
        if db is not None:
            await db.telemetry_logs.insert_one(data.model_dump())
    except Exception as e:
        # Fail silently for DB but log the error
        print(f"⚠️ DB Logging Error: {e}")
        
    return {"status": "success"}

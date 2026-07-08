import asyncio
import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.telemetry import TelemetryData
from app.core.mavlink import mav_bridge
from app.core.manager import sim_manager
from app.ai.analysis_engine import analysis_engine

router = APIRouter()

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
        failed_connections = []
        
        for connection in list(self.active_connections):
            try:
                await connection.send_text(data)
            except (WebSocketDisconnect, ConnectionResetError) as e:
                print(f"Client disconnected forcefully: {e}")
                failed_connections.append(connection)
            except Exception as e:
                print(f"Error sending to a websocket: {e}")
                failed_connections.append(connection)

        if failed_connections:
            async with self._lock:
                for connection in failed_connections:
                    if connection in self.active_connections:
                        self.active_connections.remove(connection)
                        print(f"🚮 Removed stale WebSocket connection. Total: {len(self.active_connections)}")

from app.models.database import get_db

broadcaster = TelemetryBroadcaster()
fleet_state = {}

async def broadcast_telemetry_loop(broadcaster: TelemetryBroadcaster, bridge: 'MAVLinkBridge'):
    """Periodically fetches the latest data and broadcasts it, injecting real AI analysis."""
    while True:
        if fleet_state:
            # Inject real AI report into every drone's ai_analysis field
            ai_dict = analysis_engine.get_latest_report().to_ai_analysis_dict()
            enriched_fleet = {}
            for drone_id, drone_data in fleet_state.items():
                enriched = dict(drone_data)
                enriched["ai_analysis"] = ai_dict  # Real AI replaces mock sin() values
                enriched_fleet[drone_id] = enriched

            payload = {"type": "FLEET_UPDATE", "drones": enriched_fleet}
            json_payload = json.dumps(payload)
            for connection in list(broadcaster.active_connections):
                try:
                    await connection.send_text(json_payload)
                except:
                    pass
        else:
            data = await bridge.get_latest_data()
            if data:
                await broadcaster.broadcast(data)
        await asyncio.sleep(1 / 10)  # 10Hz broadcast

async def persistence_loop(bridge: 'MAVLinkBridge'):
    """Saves telemetry data to MongoDB at 1Hz."""
    db = await get_db()
    while True:
        data = await bridge.get_latest_data()
        if data and data.is_connected:
            try:
                # Convert to dict
                doc = data.model_dump()
                await db.telemetry_logs.insert_one(doc)
            except Exception as e:
                print(f"❌ Database Persistence Error: {e}")
        await asyncio.sleep(1) # Log at 1Hz to save space/performance

@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                if isinstance(cmd, dict) and "action" in cmd:
                    print(f"🎮 WS Command: {cmd.get('action')} for {cmd.get('target_id', 'UAV_01')}")
                    await sim_manager.send_command(cmd)
            except Exception:
                pass
    except WebSocketDisconnect:
        await broadcaster.disconnect(websocket)

@router.websocket("/ws/simulator")
async def simulator_websocket(websocket: WebSocket):
    await websocket.accept()
    await sim_manager.connect(websocket)
    try:
        while True:
            data_json = await websocket.receive_json()
            try:
                # Support new Fleet format
                if data_json.get("type") == "FLEET_UPDATE":
                    drones = data_json.get("drones", {})
                    for drone_id, telemetry in drones.items():
                        fleet_state[drone_id] = telemetry
                    
                    primary_telemetry = drones.get("UAV_01") or next(iter(drones.values()))
                    if primary_telemetry:
                        telemetry_data = TelemetryData(**primary_telemetry)
                        async with mav_bridge._lock:
                            mav_bridge.latest_data = telemetry_data
                            mav_bridge.latest_data.is_connected = True
                            mav_bridge.last_heartbeat = time.time()
                else:
                    # Legacy single-drone format
                    telemetry_data = TelemetryData(**data_json)
                    drone_id = data_json.get("id", "UAV_01")
                    fleet_state[drone_id] = data_json
                    async with mav_bridge._lock:
                        mav_bridge.latest_data = telemetry_data
                        mav_bridge.latest_data.is_connected = True
                        mav_bridge.last_heartbeat = time.time()
            except Exception as e:
                print(f"Error parsing simulator telemetry: {e}")
    except WebSocketDisconnect:
        await sim_manager.disconnect()

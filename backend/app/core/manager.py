import asyncio
from fastapi import WebSocket

class SimulatorConnectionManager:
    def __init__(self):
        self.connection: WebSocket = None
        self._lock = asyncio.Lock()
        
    async def connect(self, websocket: WebSocket):
        async with self._lock:
            self.connection = websocket
            print("🤖 Simulator WebSocket Connected")
        
    async def disconnect(self):
        async with self._lock:
            self.connection = None
            print("❌ Simulator WebSocket Disconnected")
        
    async def send_command(self, command: dict):
        conn = None
        async with self._lock:
            conn = self.connection
        if conn:
            try:
                await conn.send_json(command)
            except Exception as e:
                print(f"Error sending command to simulator: {e}")
                async with self._lock:
                    if self.connection == conn:
                        self.connection = None

sim_manager = SimulatorConnectionManager()

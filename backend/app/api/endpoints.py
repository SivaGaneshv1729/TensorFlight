from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from app.schemas.telemetry import DroneCommand, TelemetryData
from app.core.video_pipeline import video_manager
from app.core.mavlink import mav_bridge
import cv2
import asyncio
import time

router = APIRouter()
# Queue for all commands to support mock_telemetry.py
command_queue = []

async def gen_frames(mode: str = "normal"):
    frame_time = 1 / 30  # 30 FPS
    while True:
        start_time = time.time()
        
        # Get frame from global video manager
        processed_frame = video_manager.get_frame(mode=mode)
        
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if ret:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        
        # Enforce FPS limit using non-blocking sleep
        elapsed = time.time() - start_time
        if elapsed < frame_time:
            await asyncio.sleep(frame_time - elapsed)

@router.get("/video/stream")
async def video_feed(mode: str = "normal"):
    return StreamingResponse(gen_frames(mode), media_type='multipart/x-mixed-replace; boundary=frame')

@router.post("/telemetry/update")
async def update_telemetry(data: TelemetryData):
    # This allows the mock_telemetry.py to update the system state
    # We update the mav_bridge.latest_data directly
    async with mav_bridge._lock:
        mav_bridge.latest_data = data
        mav_bridge.latest_data.is_connected = True # Always connected if being updated via API
        mav_bridge.last_heartbeat = time.time()
    return {"status": "success"}

@router.get("/commands/poll")
async def poll_commands():
    global command_queue
    if not command_queue:
        return {"commands": []}
    
    commands = list(command_queue)
    command_queue = [] # Clear queue after polling
    print(f"📤 Polled {len(commands)} commands")
    return {"commands": commands}

@router.post("/command")
async def send_command(command: DroneCommand):
    print(f"📥 Received Command: {command.action} with params {command.params}")
    
    # Queue for mock_telemetry.py
    global command_queue
    command_queue.append(command.model_dump())
    print(f"📝 Command queued. Queue size: {len(command_queue)}")
    
    # Forward to MAVLink (for real SITL if connected)
    mav_bridge.send_command(command.action, command.params)
    
    return {"status": "success", "executed": command.action}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

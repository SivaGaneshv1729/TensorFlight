from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from app.schemas.telemetry import DroneCommand, TelemetryData
from app.core.video_pipeline import video_manager
from app.core.mavlink import mav_bridge
from app.ai.analysis_engine import analysis_engine
from app.ai.weather_model import weather_model
import cv2
import asyncio
import time

router = APIRouter()
# Queue for all commands to support mock_telemetry.py
command_queue = []

async def gen_frames(mode: str = "normal"):
    frame_time = 1 / 24  # 24 FPS — slightly lower for CPU savings
    while True:
        start_time = time.time()
        
        # Get frame from global video manager (already annotated by AI engine)
        processed_frame = video_manager.get_frame(mode=mode)
        
        ret, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ret:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        
        elapsed = time.time() - start_time
        if elapsed < frame_time:
            await asyncio.sleep(frame_time - elapsed)

@router.get("/video/stream")
async def video_feed(mode: str = "normal"):
    return StreamingResponse(gen_frames(mode), media_type='multipart/x-mixed-replace; boundary=frame')

@router.post("/telemetry/update")
async def update_telemetry(data: TelemetryData):
    async with mav_bridge._lock:
        mav_bridge.latest_data = data
        mav_bridge.latest_data.is_connected = True
        mav_bridge.last_heartbeat = time.time()
    return {"status": "success"}

@router.get("/commands/poll")
async def poll_commands():
    global command_queue
    if not command_queue:
        return {"commands": []}
    
    commands = list(command_queue)
    command_queue = []
    return {"commands": commands}

from app.core.manager import sim_manager

@router.post("/command")
async def send_command(command: DroneCommand):
    print(f"📥 Received Command: {command.action} with params {command.params}")
    
    cmd_dict = command.model_dump()
    command_queue.append(cmd_dict)
    
    await sim_manager.send_command(cmd_dict)
    mav_bridge.send_command(command.action, command.params)
    
    return {"status": "success", "executed": command.action}

@router.get("/ai/latest")
async def get_ai_latest():
    """Returns the most recent AI analysis report in full detail."""
    report = analysis_engine.get_latest_report()
    return report.to_ai_analysis_dict()

@router.get("/ai/report")
async def get_ai_report():
    """Returns the AI trend history for the current session."""
    return {"history": analysis_engine.get_history()}

@router.get("/ai/weather")
async def get_weather():
    """Returns current weather at the drone's GPS position."""
    weather = weather_model.get_weather()
    return weather.to_dict()

@router.get("/health")
async def health_check():
    report = analysis_engine.get_latest_report()
    return {
        "status": "healthy",
        "ai_engine": "running",
        "last_analysis": round(time.time() - report.timestamp, 1),
        "weather_source": report.weather_source,
    }


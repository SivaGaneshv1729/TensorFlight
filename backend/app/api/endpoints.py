from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from app.schemas.telemetry import DroneCommand
from app.core.video_pipeline import VideoPipeline
import cv2
import asyncio

router = APIRouter()
pipeline = VideoPipeline(source="0")

def gen_frames(mode: str = "normal"):
    pipeline.start_stream()
    try:
        while True:
            success, frame = pipeline.cap.read()
            if not success: break
            processed_frame = pipeline.process_frame(frame, mode=mode)
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    finally:
        pipeline.release()

# Persistent command state
current_manual_inputs = []

@router.get("/video/stream")
async def video_feed(mode: str = "normal"):
    return StreamingResponse(gen_frames(mode), media_type='multipart/x-mixed-replace; boundary=frame')

@router.get("/commands/poll")
async def poll_commands():
    global current_manual_inputs
    temp = list(current_manual_inputs)
    current_manual_inputs = [] # Snap-clear to prevent drift
    return {"inputs": temp}

@router.post("/command")
async def send_command(command: DroneCommand):
    global current_manual_inputs
    if command.action == "MANUAL_CONTROL":
        current_manual_inputs = command.params.get("inputs", [])
        return {"status": "ok"}
    return {"status": "success", "executed": command.action}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

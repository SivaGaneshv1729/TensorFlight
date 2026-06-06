from fastapi import APIRouter
from app.schemas.telemetry import DroneCommand

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.post("/command")
async def send_command(command: DroneCommand):
    # This will later translate to MAVLink commands
    action = command.action
    print(f"🎮 Executing Drone Command: {action}")
    return {"status": "success", "executed": action}

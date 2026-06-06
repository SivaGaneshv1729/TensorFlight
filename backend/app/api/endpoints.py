from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.post("/command")
async def send_command(command: dict):
    # This will later translate to MAVLink commands
    action = command.get("action")
    print(f"🎮 Executing Drone Command: {action}")
    return {"status": "success", "executed": action}

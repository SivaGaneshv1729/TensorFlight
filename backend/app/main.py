import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints, websockets
from app.models.database import connect_db, close_db
from app.core.mavlink import mav_bridge
from app.core.video_pipeline import video_manager
from app.api.websockets import broadcaster, broadcast_telemetry_loop, persistence_loop
from app.ai.analysis_engine import analysis_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    await connect_db()
    
    # Startup: Initialize MAVLink (will retry in background if SITL not ready)
    mav_bridge.connect()
    
    # Startup: Initialize Video Manager
    video_manager.start()

    # Startup: Start the real AI analysis engine (background thread at 4fps)
    analysis_engine.start()
    
    # Start the MAVLink, broadcast, and persistence loops as background tasks
    asyncio.create_task(mav_bridge.listen_loop())
    asyncio.create_task(broadcast_telemetry_loop(broadcaster, mav_bridge))
    asyncio.create_task(persistence_loop(mav_bridge))

    yield
    # Shutdown: Close DB
    await close_db()

app = FastAPI(
    title="AgriHUD-AI Backend", 
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api")
app.include_router(websockets.router) # No prefix for direct WS access

@app.get("/")
async def root():
    return {"message": "AgriHUD-AI API is running"}

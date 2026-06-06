from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints, websockets
from app.models.database import connect_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    await connect_db()
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

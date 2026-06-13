from pydantic import BaseModel, Field
from typing import Optional

class GPSPoint(BaseModel):
    latitude: float
    longitude: float
    altitude_relative_m: Optional[float] = 0.0

class Orientation(BaseModel):
    pitch: float
    roll: float
    yaw_heading: float

class DroneState(BaseModel):
    gps: GPSPoint
    orientation_deg: Orientation
    battery_percentage: int = Field(ge=0, le=100)

class NavigationTarget(BaseModel):
    next_waypoint_gps: GPSPoint
    distance_to_wp_m: float
    coverage_efficiency_score: Optional[float] = 1.0

class AIAnalysis(BaseModel):
    weed_count: int = 0
    pest_stressed_count: int = 0
    collision_warning: bool = False
    safe_flight_radius_m: float = 300.0
    wind_speed_mps: float = 0.0
    wind_dir_deg: float = 0.0

class TelemetryData(BaseModel):
    timestamp: int
    is_connected: bool = False
    is_active: bool = False
    drone_state: DroneState
    navigation_target: NavigationTarget
    ai_analysis: Optional[AIAnalysis] = None

class DroneCommand(BaseModel):
    action: str
    params: Optional[dict] = {}

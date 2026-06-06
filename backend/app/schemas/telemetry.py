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

class TelemetryData(BaseModel):
    timestamp: int
    is_active: bool = False
    drone_state: DroneState
    navigation_target: NavigationTarget

class DroneCommand(BaseModel):
    action: str
    params: Optional[dict] = {}

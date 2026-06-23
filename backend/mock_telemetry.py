import asyncio
import math
import time
import json
import websockets
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Mapped assets
VEGETATION = []
for i in range(300):
    VEGETATION.append((0, 0)) # Placeholder for collision avoidance logic

SKYSCRAPERS = []

class DroneSimulator:
    def __init__(self, id, home_lat, home_lon):
        self.id = id
        self.home_lat = home_lat
        self.home_lon = home_lon
        self.lat = home_lat
        self.lon = home_lon
        self.alt = 0.0
        self.heading = 0.0
        self.pitch = 0.0
        self.roll = 0.0
        self.battery = 100.0
        self.is_armed = False
        self.is_rtl = False
        self.target_wp = None
        self.mission_waypoints = []
        self.vel_forward = 0.0
        self.vel_right = 0.0
        self.vel_alt = 0.0
        self.vel_yaw = 0.0
        self.active_inputs = []

    def update(self, dt, wind_speed, wind_dir):
        # 1. Battery model
        if self.is_armed:
            drain = 0.01 + (abs(self.vel_forward) + abs(self.vel_right)) * 0.05
            self.battery -= drain * dt
            if self.battery <= 0:
                self.battery = 0
                self.is_armed = False

        # 2. Physics & Navigation
        if self.is_armed:
            # Default to zero velocity each frame (prevent infinite coasting)
            self.vel_forward = 0
            self.vel_right = 0
            self.vel_alt = 0
            self.vel_yaw = 0
            
            # Manual override logic
            if self.active_inputs:
                self.target_wp = None
                self.is_rtl = False
                
                f_speed = 10.0
                c_speed = 4.0
                y_speed = 90.0
                
                if 'PITCH_FORWARD' in self.active_inputs: self.vel_forward = f_speed
                if 'PITCH_BACK' in self.active_inputs: self.vel_forward = -f_speed
                if 'ROLL_LEFT' in self.active_inputs: self.vel_right = -f_speed
                if 'ROLL_RIGHT' in self.active_inputs: self.vel_right = f_speed
                if 'ALT_UP' in self.active_inputs: self.vel_alt = c_speed
                if 'ALT_DOWN' in self.active_inputs: self.vel_alt = -c_speed
                if 'YAW_LEFT' in self.active_inputs: self.vel_yaw = -y_speed
                if 'YAW_RIGHT' in self.active_inputs: self.vel_yaw = y_speed
            
            # Simplistic RTL/Waypoint logic
            elif self.is_rtl:
                self.target_wp = {"lat": self.home_lat, "lon": self.home_lon, "alt": 15.0}

            if self.target_wp and not self.active_inputs:
                dist_lat = (self.target_wp['lat'] - self.lat) * 111319
                dist_lon = (self.target_wp['lon'] - self.lon) * 111319 * math.cos(math.radians(self.lat))
                dist = math.sqrt(dist_lat**2 + dist_lon**2)
                
                if dist < 1.0 and abs(self.alt - self.target_wp.get('alt', 15)) < 1.0:
                    if self.is_rtl:
                        self.vel_alt = -0.5
                        if self.alt <= 0.1:
                            self.is_armed = False
                            self.is_rtl = False
                            self.vel_alt = 0
                    elif self.mission_waypoints:
                        self.target_wp = self.mission_waypoints.pop(0)
                    else:
                        self.target_wp = None
                else:
                    # Move towards target
                    angle = math.atan2(dist_lon, dist_lat)
                    self.vel_forward = 5.0 * math.cos(angle)
                    self.vel_right = 5.0 * math.sin(angle)
                    # Smoothly rotate heading towards target
                    target_heading = math.degrees(angle) % 360
                    self.vel_yaw = (target_heading - self.heading + 180) % 360 - 180
                    if self.alt < self.target_wp.get('alt', 15): self.vel_alt = 1.0
                    elif self.alt > self.target_wp.get('alt', 15): self.vel_alt = -1.0
                    else: self.vel_alt = 0

            # Apply wind effect ONLY if in the air
            if self.alt > 0.5:
                wind_rad = math.radians(wind_dir)
                self.lat += (wind_speed * 0.000001 * math.cos(wind_rad)) * dt
                self.lon += (wind_speed * 0.000001 * math.sin(wind_rad)) * dt

            # Apply velocity to position
            # We need to rotate forward/right velocity by the current heading
            heading_rad = math.radians(self.heading)
            cos_h = math.cos(heading_rad)
            sin_h = math.sin(heading_rad)
            
            world_vel_lat = self.vel_forward * cos_h - self.vel_right * sin_h
            world_vel_lon = self.vel_forward * sin_h + self.vel_right * cos_h
            
            self.lat += (world_vel_lat * 0.000009) * dt
            self.lon += (world_vel_lon * 0.000009) * dt
            self.alt += self.vel_alt * dt
            self.heading = (self.heading + self.vel_yaw * dt) % 360

            # Visual tilt interpolation
            target_pitch = (self.vel_forward / 10.0) * 20.0
            target_roll = (self.vel_right / 10.0) * 20.0
            self.pitch += (target_pitch - self.pitch) * 5 * dt
            self.roll += (target_roll - self.roll) * 5 * dt

        else:
            self.vel_forward = 0
            self.vel_right = 0
            self.vel_alt = 0
            self.vel_yaw = 0
            self.pitch *= 0.9
            self.roll *= 0.9
            if self.alt > 0: self.alt -= 2.0 * dt
            if self.alt < 0: self.alt = 0

    def get_payload(self):
        return {
            "timestamp": int(time.time() * 1000),
            "id": self.id,
            "is_connected": True,
            "is_active": self.is_armed,
            "drone_state": {
                "gps": {"latitude": self.lat, "longitude": self.lon, "altitude_relative_m": self.alt},
                "orientation_deg": {"pitch": self.pitch, "roll": self.roll, "yaw_heading": self.heading},
                "battery_percentage": int(self.battery)
            },
            "navigation_target": {
                "next_waypoint_gps": self.target_wp if self.target_wp else {"latitude": self.home_lat, "longitude": self.home_lon, "altitude_relative_m": 0},
                "distance_to_wp_m": 0.0
            },
            "ai_analysis": {
                "weed_count": int(5 + 2 * math.sin(time.time())),
                "pest_stressed_count": 0,
                "collision_warning": False,
                "wind_speed_mps": 0.0,
                "wind_dir_deg": 0.0
            }
        }

async def simulate_fleet():
    url = "ws://127.0.0.1:8000/ws/simulator"
    
    drones = [
        # UAV_01: Starting at Home (Farm/NE)
        DroneSimulator("UAV_01", 41.7315, -93.8587),
        # UAV_02: Starting in the City (NW)
        DroneSimulator("UAV_02", 41.7345, -93.8640),
        # UAV_03: Starting in the Desert (SW)
        DroneSimulator("UAV_03", 41.7280, -93.8640)
    ]
    
    # Pre-randomize batteries for instant visual difference
    drones[1].battery = 84.0
    drones[2].battery = 42.0

    while True:
        try:
            async with websockets.connect(url) as ws:
                print("✅ Fleet Connected to Backend.")
                
                async def handle_commands():
                    try:
                        async for message in ws:
                            cmd = json.loads(message)
                            target_id = cmd.get("target_id", "UAV_01")
                            action = cmd.get("action")
                            for d in drones:
                                if d.id == target_id:
                                    print(f"[{d.id}] Received CMD: {action}")
                                    if action == "ARM": d.is_armed = True; d.battery = 100
                                    if action == "DISARM": d.is_armed = False
                                    if action == "TAKEOFF": d.target_wp = {"lat": d.lat, "lon": d.lon, "alt": 10.0}
                                    if action == "RTL": d.is_rtl = True
                                    if action == "GOTO_WAYPOINTS": d.mission_waypoints = cmd.get("params", {}).get("waypoints", [])
                                    if action == "MANUAL_CONTROL":
                                        d.active_inputs = cmd.get("params", {}).get("inputs", [])
                    except: pass

                asyncio.create_task(handle_commands())

                last_t = time.time()
                while True:
                    t = time.time()
                    dt = t - last_t
                    last_t = t

                    # Phase 4: Simulated Weather Front
                    # Periodic high winds or storm
                    is_storming = (math.sin(t * 0.05) > 0.8)
                    wind_speed = 5.0 if is_storming else 1.2
                    wind_dir = (t * 2) % 360

                    fleet_payload = {}
                    for d in drones:
                        d.update(dt, wind_speed, wind_dir)
                        payload = d.get_payload()
                        # Override weather info in payload
                        payload["ai_analysis"]["wind_speed_mps"] = wind_speed
                        payload["ai_analysis"]["wind_dir_deg"] = wind_dir
                        payload["ai_analysis"]["is_storming"] = is_storming
                        fleet_payload[d.id] = payload

                    # The current backend expects a single TelemetryData object.
                    # To keep it working, we broadcast the ACTIVE drone's telemetry as the main object.
                    # Or we update the backend to handle a fleet dictionary.
                    # For now, let's send a special MULTI_TELEMETRY type.
                    await ws.send(json.dumps({
                        "type": "FLEET_UPDATE",
                        "drones": fleet_payload
                    }))
                    
                    await asyncio.sleep(0.05)
        except:
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(simulate_fleet())

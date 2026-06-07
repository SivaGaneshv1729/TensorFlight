from pymavlink import mavutil
import asyncio
import time
import math
from app.schemas.telemetry import TelemetryData, DroneState, GPSPoint, Orientation, NavigationTarget

class MAVLinkBridge:
    def __init__(self, connection_url="udpin:0.0.0.0:14550"):
        self.connection_url = connection_url
        self.master = None
        self.latest_data = self._initial_state()
        self._is_running = False
        self.heartbeat_timeout = 5.0
        self.last_heartbeat = 0

    def _initial_state(self):
        return TelemetryData(
            timestamp=int(time.time() * 1000),
            is_active=False,
            drone_state=DroneState(
                gps=GPSPoint(latitude=0, longitude=0, altitude_relative_m=0),
                orientation_deg=Orientation(pitch=0, roll=0, yaw_heading=0),
                battery_percentage=0
            ),
            navigation_target=NavigationTarget(
                next_waypoint_gps=GPSPoint(latitude=0, longitude=0),
                distance_to_wp_m=0
            )
        )

    def connect(self):
        print(f"🔗 Connecting to MAVLink SITL at {self.connection_url}...")
        try:
            self.master = mavutil.mavlink_connection(self.connection_url)
            # We don't wait_heartbeat() here to avoid blocking startup.
            # The listen_loop will handle connection state via heartbeats.
            print("📡 MAVLink Bridge Initialized (waiting for heartbeat in background)")
        except Exception as e:
            print(f"❌ MAVLink Initialization Failed: {e}")

    async def listen_loop(self, broadcast_callback):
        self._is_running = True
        while self._is_running:
            try:
                # Non-blocking receive
                msg = self.master.recv_match(blocking=False)
                if msg:
                    self._handle_message(msg)
                    
                    # Periodic broadcast (e.g., at 20Hz)
                    # We can also broadcast on every message, but that's high traffic.
                    # Let's broadcast when we get important updates.
                    if msg.get_type() in ['ATTITUDE', 'GLOBAL_POSITION_INT']:
                        self.latest_data.timestamp = int(time.time() * 1000)
                        await broadcast_callback(self.latest_data)

                # Check for connection loss
                if time.time() - self.last_heartbeat > self.heartbeat_timeout:
                    self.latest_data.is_active = False

                await asyncio.sleep(0.01) # 100Hz polling rate
            except Exception as e:
                print(f"⚠️ MAVLink Error: {e}")
                await asyncio.sleep(1)

    def _handle_message(self, msg):
        msg_type = msg.get_type()

        if msg_type == 'HEARTBEAT':
            self.last_heartbeat = time.time()
            # MAV_STATE_ACTIVE is usually 4
            self.latest_data.is_active = msg.system_status == 4
            self.master.target_system = msg.get_srcSystem()
            self.master.target_component = msg.get_srcComponent()

        elif msg_type == 'ATTITUDE':
            # MAVLink sends radians, we convert to degrees
            self.latest_data.drone_state.orientation_deg.pitch = math.degrees(msg.pitch)
            self.latest_data.drone_state.orientation_deg.roll = math.degrees(msg.roll)
            self.latest_data.drone_state.orientation_deg.yaw_heading = (math.degrees(msg.yaw) + 360) % 360

        elif msg_type == 'GLOBAL_POSITION_INT':
            # Lat/Lon are scaled by 1e7
            self.latest_data.drone_state.gps.latitude = msg.lat / 1.0e7
            self.latest_data.drone_state.gps.longitude = msg.lon / 1.0e7
            # Alt is in mm
            self.latest_data.drone_state.gps.altitude_relative_m = msg.relative_alt / 1000.0

        elif msg_type == 'SYS_STATUS':
            self.latest_data.drone_state.battery_percentage = msg.battery_remaining

        elif msg_type == 'NAV_CONTROLLER_OUTPUT':
            self.latest_data.navigation_target.distance_to_wp_m = msg.wp_dist

    def send_command(self, action: str, params: dict = None):
        if not self.master:
            return False
        
        params = params or {}
        print(f"📡 Sending MAVLink Command: {action} with {params}")

        if action == "ARM":
            self.master.arducopter_arm()
        elif action == "DISARM":
            self.master.arducopter_disarm()
        elif action == "TAKEOFF":
            altitude = params.get("altitude", 10)
            self.master.mav.command_long_send(
                self.master.target_system, self.master.target_component,
                mavutil.mavlink.MAV_CMD_NAV_TAKEOFF, 0, 0, 0, 0, 0, 0, 0, altitude
            )
        elif action == "LAND":
            self.master.mav.command_long_send(
                self.master.target_system, self.master.target_component,
                mavutil.mavlink.MAV_CMD_NAV_LAND, 0, 0, 0, 0, 0, 0, 0, 0
            )
        elif action == "SET_MODE":
            mode = params.get("mode", "GUIDED")
            if mode in self.master.mode_mapping():
                mode_id = self.master.mode_mapping()[mode]
                self.master.mav.set_mode_send(
                    self.master.target_system,
                    mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
                    mode_id
                )
        return True

# Singleton instance
mav_bridge = MAVLinkBridge()

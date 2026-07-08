from pymavlink import mavutil
import asyncio
import time
import math
import os
from dotenv import load_dotenv
from app.schemas.telemetry import TelemetryData, DroneState, GPSPoint, Orientation, NavigationTarget

import sys
import io

load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class MAVLinkBridge:
    def __init__(self, connection_url=None):
        self.connection_url = connection_url or os.getenv("MAVLINK_URL", "udpin:0.0.0.0:14551")
        self.master = None
        # Use a thread-safe lock for accessing latest_data
        self._lock = asyncio.Lock()
        self.latest_data = self._initial_state()
        self._is_running = False
        self.heartbeat_timeout = 5.0
        self.last_heartbeat = 0

    def _initial_state(self):
        return TelemetryData(
            timestamp=int(time.time() * 1000),
            is_connected=False,
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
        if self.master:
            try:
                self.master.close()
            except Exception:
                pass
        
        print(f"🔗 Connecting to MAVLink SITL at {self.connection_url}...")
        try:
            self.master = mavutil.mavlink_connection(self.connection_url)
            print("📡 MAVLink Bridge Initialized (waiting for heartbeat)")
            return True
        except Exception as e:
            print(f"❌ MAVLink Initialization Failed: {e}")
            self.master = None
            return False

    async def get_latest_data(self):
        async with self._lock:
            return self.latest_data

    async def _update_data(self, new_msg):
        async with self._lock:
            self._handle_message(new_msg)

    async def listen_loop(self):
        """Dedicated loop to only ingest MAVLink messages."""
        self._is_running = True
        loop = asyncio.get_running_loop()
        while self._is_running:
            if not self.master:
                self.connect()
                if not self.master:
                    await asyncio.sleep(5)
                    continue

            try:
                # Run the blocking recv_match in a thread pool
                msg = await loop.run_in_executor(
                    None, 
                    lambda: self.master.recv_match(blocking=True, timeout=1.0)
                )
                
                if msg:
                    await self._update_data(msg)
                
                # Check for connection loss
                if time.time() - self.last_heartbeat > self.heartbeat_timeout:
                    async with self._lock:
                        if self.latest_data.is_connected:
                            print("⚠️ MAVLink Heartbeat Timeout")
                            self.latest_data.is_connected = False
                            self.latest_data.is_active = False

            except Exception as e:
                print(f"⚠️ MAVLink Error: {e}")
                self.master = None # Trigger reconnection
                await asyncio.sleep(1)

    def _handle_message(self, msg):
        msg_type = msg.get_type()
        self.latest_data.timestamp = int(time.time() * 1000)

        if msg_type == 'HEARTBEAT':
            self.last_heartbeat = time.time()
            if not self.latest_data.is_connected:
                print("📡 MAVLink Heartbeat Received - Connected")
                self.latest_data.is_connected = True
            
            # is_active represents "ARMED" status
            self.latest_data.is_active = bool(msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED)
            self.master.target_system = msg.get_srcSystem()
            self.master.target_component = msg.get_srcComponent()

        elif msg_type == 'ATTITUDE':
            self.latest_data.drone_state.orientation_deg.pitch = math.degrees(msg.pitch)
            self.latest_data.drone_state.orientation_deg.roll = math.degrees(msg.roll)
            self.latest_data.drone_state.orientation_deg.yaw_heading = (math.degrees(msg.yaw) + 360) % 360

        elif msg_type == 'GLOBAL_POSITION_INT':
            self.latest_data.drone_state.gps.latitude = msg.lat / 1.0e7
            self.latest_data.drone_state.gps.longitude = msg.lon / 1.0e7
            self.latest_data.drone_state.gps.altitude_relative_m = msg.relative_alt / 1000.0

        elif msg_type == 'SYS_STATUS':
            self.latest_data.drone_state.battery_percentage = msg.battery_remaining

        elif msg_type == 'NAV_CONTROLLER_OUTPUT':
            self.latest_data.navigation_target.distance_to_wp_m = msg.wp_dist

    def send_command(self, action: str, params: dict = None):
        if not self.master:
            print(f"⚠️ Command '{action}' rejected: MAVLink not connected.")
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
        elif action == "RTL":
            self.master.set_mode_rtl()
        elif action == "GOTO_WAYPOINT":
            lat = params.get("lat")
            lon = params.get("lon")
            alt = params.get("alt", 10)
            if lat and lon:
                self.master.mav.command_int_send(
                    self.master.target_system, self.master.target_component,
                    mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
                    mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
                    0, 0, 0, 0, 0, 0,
                    int(lat * 1e7), int(lon * 1e7), alt
                )
        elif action == "EMERGENCY_STOP":
            # Force disarm (Dangerous, but that's what emergency stop is)
            self.master.mav.command_long_send(
                self.master.target_system, self.master.target_component,
                mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, 0, 
                0, # 0 to disarm
                21196, # Magic number for force disarm
                0, 0, 0, 0, 0
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
        elif action == "MANUAL_CONTROL":
            inputs = params.get("inputs", [])
            f_speed = params.get("forward_speed", 500)
            c_speed = params.get("climb_speed", 200)
            
            x, y, z, r = 0, 0, 500, 0  # thrust 500 is neutral
            
            if 'PITCH_FORWARD' in inputs: x = f_speed
            if 'PITCH_BACK' in inputs: x = -f_speed
            if 'ROLL_LEFT' in inputs: y = -f_speed
            if 'ROLL_RIGHT' in inputs: y = f_speed
            if 'ALT_UP' in inputs: z = 500 + c_speed
            if 'ALT_DOWN' in inputs: z = 500 - c_speed
            if 'YAW_LEFT' in inputs: r = -f_speed
            if 'YAW_RIGHT' in inputs: r = f_speed
            
            self.master.mav.manual_control_send(
                self.master.target_system,
                x, y, z, r, 0
            )
        return True

mav_bridge = MAVLinkBridge()

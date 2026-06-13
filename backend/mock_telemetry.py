import asyncio
import math
import time
import json
import websockets

# Mapped assets matching Environment.jsx for Collision Avoidance
VEGETATION = []
for i in range(250):
    angle = (i / 250) * math.pi * 2 * 13
    dist = 45 + (i * 6)
    VEGETATION.append((math.cos(angle) * dist, math.sin(angle) * dist)) # (x, z)

SKYSCRAPERS = []
for i in range(28):
    x = -40 - (i % 5) * 80
    z = -40 - (i // 5) * 80
    SKYSCRAPERS.append((x, z))

async def simulate_drone():
    url = "ws://127.0.0.1:8000/ws/simulator"

    # State
    is_armed = False
    is_rtl = False
    is_landing = False
    
    # Home Position
    home_lat, home_lon = 41.7315, -93.8587
    latPerMeter = 1 / 111319
    lonPerMeter = 1 / (111319 * math.cos(home_lat * math.pi / 180))
    
    # Mission State
    target_wp = None # {lat, lon, alt}
    mission_waypoints = []
    
    # Position
    lat, lon, alt, heading = home_lat, home_lon, 0.0, 0.0
    pitch, roll = 0.0, 0.0
    
    # Dynamic Telemetry State
    battery = 100.0
    
    # Inertial Velocities
    vel_forward = 0.0
    vel_right = 0.0
    vel_alt = 0.0
    vel_yaw = 0.0

    # Command Queue
    pending_commands = []
    
    async def listen_commands(ws):
        nonlocal is_armed, is_rtl, is_landing, target_wp, mission_waypoints, pending_commands
        try:
            async for message in ws:
                cmd = json.loads(message)
                pending_commands.append(cmd)
        except Exception as e:
            print(f"📡 WebSocket Listener connection lost: {e}")

    print("🚀 PRO-STABLE AI-Enabled Simulator Started via WebSocket.")
    
    active_inputs = []

    while True:
        try:
            async with websockets.connect(url) as ws:
                print("✅ Connected to Backend WebSocket.")
                listener_task = asyncio.create_task(listen_commands(ws))
                
                try:
                    while True:
                        t = time.time()
                        
                        # Simulating real-time wind vector
                        wind_speed = 4.0 + 2.5 * math.sin(t * 0.05) # Knots/Mps
                        wind_dir = (45.0 + 10.0 * math.cos(t * 0.03)) % 360
                        
                        # 1. Process received commands
                        commands = list(pending_commands)
                        pending_commands.clear()
                        
                        f_speed_mult = 1.0
                        c_speed_mult = 1.0

                        for cmd in commands:
                            action = cmd.get("action")
                            print(f"⚙️ Processing Action: {action}")
                            if action == "ARM":
                                is_armed = True
                                is_rtl = False
                                is_landing = False
                                battery = 100.0 # Fully charged on arm
                                mission_waypoints = []
                                target_wp = None
                                print("✅ Drone ARMED")
                            elif action == "DISARM":
                                if alt < 0.5:
                                    is_armed = False
                                    is_landing = False
                                    print("⏹️ Drone DISARMED")
                                else:
                                    print("⚠️ Cannot DISARM while in air!")
                            elif action == "RTL":
                                is_rtl = True
                                is_landing = False
                                target_wp = None
                                mission_waypoints = []
                                print("🏠 Returning to Home...")
                            elif action == "GOTO_WAYPOINT":
                                target_wp = cmd.get("params")
                                is_rtl = False
                                is_landing = False
                                mission_waypoints = []
                                print(f"📍 New Waypoint set: {target_wp['lat']}, {target_wp['lon']}")
                            elif action == "GOTO_WAYPOINTS":
                                mission_waypoints = cmd.get("params", {}).get("waypoints", [])
                                is_rtl = False
                                is_landing = False
                                if mission_waypoints:
                                    target_wp = mission_waypoints.pop(0)
                                    print(f"📍 AI Route loaded. {len(mission_waypoints) + 1} waypoints. Next: {target_wp}")
                            elif action == "EMERGENCY_STOP":
                                is_armed = False
                                alt = 0
                                is_landing = False
                                vel_forward = vel_right = vel_alt = vel_yaw = 0.0
                                print("🚨 EMERGENCY STOP ACTIVATED")
                            elif action == "MANUAL_CONTROL":
                                active_inputs = cmd.get("params", {}).get("inputs", [])
                                f_speed_mult = cmd.get("params", {}).get("forward_speed", 100) / 100.0
                                c_speed_mult = cmd.get("params", {}).get("climb_speed", 200) / 200.0

                        # 2. Battery Consumption Model
                        if is_armed:
                            # Hover takes base rate; throttle takes extra power
                            thrust_factor = math.sqrt(vel_forward**2 + vel_right**2) / 0.0000100 if vel_forward != 0 or vel_right != 0 else 0
                            climb_factor = abs(vel_alt) / 0.08
                            
                            drain = 0.008 + (0.015 * thrust_factor) + (0.012 * climb_factor)
                            battery -= drain
                            if battery <= 0:
                                battery = 0
                                is_armed = False
                                print("🔋 BATTERY EXHAUSTED - Drone Disarmed & Dropping!")

                        # Convert current GPS coordinates to 3D relative positions
                        x_3d = (lon - home_lon) / lonPerMeter
                        z_3d = -(lat - home_lat) / latPerMeter

                        # 3. 3D Collision Avoidance System
                        collision_warning = False
                        if is_armed and alt > 0.2:
                            # Check buildings (Skyscrapers NW)
                            for bx, bz in SKYSCRAPERS:
                                dist_to_b = math.sqrt((x_3d - bx)**2 + (z_3d - bz)**2)
                                if dist_to_b < 12.0 and alt < 65.0: # Critical range around skyscraper
                                    collision_warning = True
                            
                            # Check trees
                            for tx, tz in VEGETATION:
                                dist_to_t = math.sqrt((x_3d - tx)**2 + (z_3d - tz)**2)
                                if dist_to_t < 4.0 and alt < 6.5: # Tree branch range
                                    collision_warning = True
                                    
                            # Check barn complex
                            dist_to_barn = math.sqrt((x_3d - 150)**2 + (z_3d - (-200))**2)
                            if dist_to_barn < 17.0 and alt < 13.0:
                                collision_warning = True

                        # 4. AI Predictive RTL Calculator (Point of No Return)
                        dist_to_home = math.sqrt(x_3d**2 + z_3d**2)
                        
                        # Calculate wind vector component against return path
                        heading_to_home = math.atan2(-x_3d, -z_3d) # relative angle towards 0,0
                        wind_dir_rad = math.radians(wind_dir)
                        # dot product of wind vector with home vector
                        wind_opposing = wind_speed * math.cos(heading_to_home - wind_dir_rad)
                        
                        cruise_speed = 11.0 # m/s
                        return_speed = max(2.5, cruise_speed - wind_opposing)
                        time_needed = dist_to_home / return_speed
                        # Estimate battery required for return flight (0.08% drain rate/sec during cruise return + 8% safety buffer)
                        battery_needed = (time_needed * 0.015) + 8.0
                        
                        # Auto-Trigger RTL if envelope crossed
                        if is_armed and not is_rtl and battery <= battery_needed and alt > 1.5:
                            is_rtl = True
                            is_landing = False
                            target_wp = None
                            mission_waypoints = []
                            print("🚨 AI PREDICTIVE RTL ACTIVATED - Battery low against opposing wind vector!")

                        # Safe flight envelope radius (in meters)
                        safe_flight_radius = max(0.0, ((battery - 8.0) / 0.015) * return_speed)

                        # 5. Physics & Flight dynamics
                        BASE_SPEED_FACTOR = 0.0000100
                        BASE_ALT_SPEED = 0.08
                        YAW_SPEED = 3.5

                        v_forward, v_right, v_alt, v_yaw = 0.0, 0.0, 0.0, 0.0
                        target_pitch, target_roll = 0.0, 0.0

                        if is_armed:
                            if is_rtl:
                                target_alt = 15.0
                                dist_lat_m = (home_lat - lat) * 111319
                                dist_lon_m = (home_lon - lon) * 111319 * math.cos(math.radians(lat))
                                dist_to_home_gps = math.sqrt(dist_lat_m**2 + dist_lon_m**2)

                                if dist_to_home_gps < 1.8:
                                    is_landing = True

                                if not is_landing:
                                    if alt < (target_alt - 1.0):
                                        vel_alt += (BASE_ALT_SPEED - vel_alt) * 0.15
                                        vel_forward *= 0.8
                                    elif alt > (target_alt + 1.0):
                                        vel_alt += (-BASE_ALT_SPEED - vel_alt) * 0.15
                                        vel_forward *= 0.8
                                    else:
                                        vel_alt *= 0.9

                                    # Navigate towards home
                                    target_heading = (math.degrees(math.atan2(dist_lon_m, dist_lat_m)) + 360) % 360
                                    angle_diff = (target_heading - heading + 180) % 360 - 180
                                    
                                    target_vyaw = max(-YAW_SPEED, min(YAW_SPEED, angle_diff * 0.2))
                                    vel_yaw += (target_vyaw - vel_yaw) * 0.2
                                    
                                    if abs(angle_diff) < 30:
                                        target_vf = BASE_SPEED_FACTOR * 1.5
                                        target_pitch = -10.0
                                    else:
                                        target_vf = 0.0
                                    vel_forward += (target_vf - vel_forward) * 0.15
                                    vel_right *= 0.8
                                else:
                                    # Landing Phase
                                    vel_forward += (0.0 - vel_forward) * 0.15
                                    vel_right += (0.0 - vel_right) * 0.15
                                    vel_yaw += (0.0 - vel_yaw) * 0.15
                                    
                                    vel_alt += (-BASE_ALT_SPEED * 0.5 - vel_alt) * 0.08
                                    
                                    if alt < 0.15:
                                        is_rtl = False
                                        is_landing = False
                                        is_armed = False
                                        vel_alt = 0.0
                                        alt = 0.0
                                        print("RTL: Landed and Disarmed.")
                                
                                v_forward = vel_forward
                                v_right = vel_right
                                v_alt = vel_alt
                                v_yaw = vel_yaw

                            elif target_wp:
                                t_lat, t_lon = target_wp['lat'], target_wp['lon']
                                t_alt = target_wp.get('alt', 15)

                                dist_lat_m = (t_lat - lat) * 111319
                                dist_lon_m = (t_lon - lon) * 111319 * math.cos(math.radians(lat))
                                dist_to_wp = math.sqrt(dist_lat_m**2 + dist_lon_m**2)

                                if alt < (t_alt - 0.5): 
                                    vel_alt += (BASE_ALT_SPEED - vel_alt) * 0.15
                                elif alt > (t_alt + 0.5): 
                                    vel_alt += (-BASE_ALT_SPEED - vel_alt) * 0.15
                                else:
                                    vel_alt *= 0.9

                                if dist_to_wp > 1.2:
                                    target_heading = (math.degrees(math.atan2(dist_lon_m, dist_lat_m)) + 360) % 360
                                    angle_diff = (target_heading - heading + 180) % 360 - 180
                                    
                                    target_vyaw = max(-YAW_SPEED, min(YAW_SPEED, angle_diff * 0.3))
                                    vel_yaw += (target_vyaw - vel_yaw) * 0.2
                                    
                                    if abs(angle_diff) < 30:
                                        target_vf = BASE_SPEED_FACTOR * 1.2
                                        target_pitch = -8.0
                                    else:
                                        target_vf = 0.0
                                    vel_forward += (target_vf - vel_forward) * 0.15
                                else:
                                    print("📍 Waypoint Reached.")
                                    if mission_waypoints:
                                        target_wp = mission_waypoints.pop(0)
                                        print(f"📍 AI Route: Moving to next waypoint: {target_wp}")
                                    else:
                                        target_wp = None
                                        vel_forward *= 0.8
                                        vel_yaw *= 0.8
                                
                                v_forward = vel_forward
                                v_right = vel_right
                                v_alt = vel_alt
                                v_yaw = vel_yaw

                            else:
                                # Manual control with collision override
                                speed_factor = BASE_SPEED_FACTOR * f_speed_mult
                                alt_speed = BASE_ALT_SPEED * c_speed_mult

                                target_vf = 0.0
                                target_vr = 0.0
                                target_va = 0.0
                                target_vy = 0.0

                                if 'PITCH_FORWARD' in active_inputs: target_vf = speed_factor; target_pitch = -12.0 * f_speed_mult
                                if 'PITCH_BACK' in active_inputs: target_vf = -speed_factor; target_pitch = 12.0 * f_speed_mult
                                if 'ROLL_LEFT' in active_inputs: target_vr = -speed_factor; target_roll = -12.0 * f_speed_mult
                                if 'ROLL_RIGHT' in active_inputs: target_vr = speed_factor; target_roll = 12.0 * f_speed_mult
                                if 'ALT_UP' in active_inputs: target_va = alt_speed
                                if 'ALT_DOWN' in active_inputs: target_va = -alt_speed
                                if 'YAW_LEFT' in active_inputs: target_vy = -YAW_SPEED * f_speed_mult
                                if 'YAW_RIGHT' in active_inputs: target_vy = YAW_SPEED * f_speed_mult

                                ACCEL = 0.22
                                DRAG = 0.04

                                k_vf = ACCEL if target_vf != 0 else DRAG
                                k_vr = ACCEL if target_vr != 0 else DRAG
                                k_va = ACCEL if target_va != 0 else DRAG
                                k_vy = ACCEL if target_vy != 0 else DRAG

                                vel_forward += (target_vf - vel_forward) * k_vf
                                vel_right += (target_vr - vel_right) * k_vr
                                vel_alt += (target_va - vel_alt) * k_va
                                vel_yaw += (target_vy - vel_yaw) * k_vy

                                # Collision Avoidance Auto Braking
                                if collision_warning:
                                    vel_forward *= 0.1
                                    vel_right *= 0.1
                                    if vel_alt < 0: vel_alt = 0.0

                                v_forward = vel_forward
                                v_right = vel_right
                                v_alt = vel_alt
                                v_yaw = vel_yaw

                            # 6. Position Update
                            rad = math.radians(heading)
                            lat += (v_forward * math.cos(rad) - v_right * math.sin(rad))
                            lon += (v_forward * math.sin(rad) + v_right * math.cos(rad))
                            
                            alt += v_alt
                            heading = (heading + v_yaw) % 360
                            if alt < 0: alt = 0
                        else:
                            vel_forward = vel_right = vel_yaw = 0.0
                            if alt > 0: 
                                vel_alt += (-0.1 - vel_alt) * 0.2
                                alt += vel_alt
                            if alt < 0: alt = 0

                        # Visual Tilt Interpolation
                        pitch += (target_pitch - pitch) * 0.15
                        roll += (target_roll - roll) * 0.15
                        if not active_inputs and not is_rtl and not target_wp: 
                            pitch *= 0.85
                            roll *= 0.85

                        # Simulated AI Diagnosticts metrics based on drone coordinate quadrants
                        # In the Village quadrant (NE), weed count is higher.
                        # In the Desert quadrant (SW), it is low. In City/Mountains it is 0.
                        weeds_found = 0
                        stress_found = 0
                        if lat > home_lat and lon > home_lon:
                            weeds_found = int(5 + 3 * math.sin(t * 0.2))
                            stress_found = int(2 + math.cos(t * 0.15))
                        elif lat < home_lat and lon < home_lon:
                            weeds_found = int(1 + math.cos(t * 0.1))
                            stress_found = 0

                        # Send telemetry JSON payload
                        payload = {
                            "timestamp": int(time.time() * 1000), 
                            "is_connected": True,
                            "is_active": is_armed,
                            "drone_state": {
                                "gps": {"latitude": lat, "longitude": lon, "altitude_relative_m": alt},
                                "orientation_deg": {"pitch": pitch, "roll": roll, "yaw_heading": heading},
                                "battery_percentage": int(battery)
                            },
                            "navigation_target": {"next_waypoint_gps": {"latitude": home_lat, "longitude": home_lon}, "distance_to_wp_m": 0, "coverage_efficiency_score": 1.0},
                            "ai_analysis": {
                                "weed_count": weeds_found,
                                "pest_stressed_count": stress_found,
                                "collision_warning": collision_warning,
                                "safe_flight_radius_m": float(safe_flight_radius),
                                "wind_speed_mps": float(wind_speed),
                                "wind_dir_deg": float(wind_dir)
                            }
                        }
                        
                        await ws.send(json.dumps(payload))
                        await asyncio.sleep(0.02)
                finally:
                    listener_task.cancel()
        except (websockets.exceptions.ConnectionClosed, OSError) as e:
            print(f"🔌 Connection closed/failed ({e}). Retrying in 2 seconds...")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(simulate_drone())

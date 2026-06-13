import asyncio
import math
import time
import json
import websockets

async def simulate_drone():
    url = "ws://127.0.0.1:8000/ws/simulator"

    # State
    is_armed = False
    is_rtl = False
    is_landing = False
    
    # Home Position - Relocated to a farm in Iowa, USA
    home_lat, home_lon = 41.7315, -93.8587
    
    # Mission State
    target_wp = None # {lat, lon, alt}
    
    # Position
    lat, lon, alt, heading = home_lat, home_lon, 0.0, 0.0
    # Orientation
    pitch, roll = 0.0, 0.0
    
    # Inertial Velocities (for smooth movement dynamics)
    vel_forward = 0.0
    vel_right = 0.0
    vel_alt = 0.0
    vel_yaw = 0.0

    # Command Queue
    pending_commands = []
    
    async def listen_commands(ws):
        nonlocal is_armed, is_rtl, is_landing, target_wp, pending_commands
        try:
            async for message in ws:
                cmd = json.loads(message)
                pending_commands.append(cmd)
        except Exception as e:
            print(f"📡 WebSocket Listener connection lost: {e}")

    print("🚀 PRO-STABLE Simulator Started via WebSocket.")
    print("🎮 ARM status enforced. RTL and Stability systems active.")
    
    # Track the active input keys across updates
    active_inputs = []

    while True:
        try:
            async with websockets.connect(url) as ws:
                print("✅ Connected to Backend WebSocket.")
                # Start listener task
                listener_task = asyncio.create_task(listen_commands(ws))
                
                try:
                    while True:
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
                                print("🏠 Returning to Home...")
                            elif action == "GOTO_WAYPOINT":
                                target_wp = cmd.get("params")
                                is_rtl = False
                                is_landing = False
                                print(f"📍 New Waypoint set: {target_wp['lat']}, {target_wp['lon']}")
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

                                   # Realistic Speed Constants (in degrees per step, adjusted for 50Hz)
                        BASE_SPEED_FACTOR = 0.0000100 # Multiplied for fast forward/lateral flight
                        BASE_ALT_SPEED = 0.08 # Faster climb/descend
                        YAW_SPEED = 3.5 # Faster turn rate

                        v_forward, v_right, v_alt, v_yaw = 0.0, 0.0, 0.0, 0.0
                        target_pitch, target_roll = 0.0, 0.0

                        if is_armed:
                            if is_rtl:
                                target_alt = 15.0
                                dist_lat_m = (home_lat - lat) * 111319
                                dist_lon_m = (home_lon - lon) * 111319 * math.cos(math.radians(lat))
                                dist_to_home = math.sqrt(dist_lat_m**2 + dist_lon_m**2)

                                # Phase check: lock landing state once close to home coordinates
                                if dist_to_home < 1.8:
                                    is_landing = True

                                if not is_landing:
                                    # Climb to safety altitude first
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
                                    # Landing Phase: Dampen horizontal movements to zero, descend vertically
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

                                if dist_to_wp > 1.0:
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
                                    target_wp = None
                                    vel_forward *= 0.8
                                    vel_yaw *= 0.8
                                
                                v_forward = vel_forward
                                v_right = vel_right
                                v_alt = vel_alt
                                v_yaw = vel_yaw

                            else:
                                # Manual control
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

                                ACCEL = 0.22 # Faster acceleration response
                                DRAG = 0.04  # Lower drag for a smooth sliding momentum glide

                                k_vf = ACCEL if target_vf != 0 else DRAG
                                k_vr = ACCEL if target_vr != 0 else DRAG
                                k_va = ACCEL if target_va != 0 else DRAG
                                k_vy = ACCEL if target_vy != 0 else DRAG

                                vel_forward += (target_vf - vel_forward) * k_vf
                                vel_right += (target_vr - vel_right) * k_vr
                                vel_alt += (target_va - vel_alt) * k_va
                                vel_yaw += (target_vy - vel_yaw) * k_vy

                                v_forward = vel_forward
                                v_right = vel_right
                                v_alt = vel_alt
                                v_yaw = vel_yaw

                            # 3. Position Update
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

                        # 4. Visual Tilt Interpolation
                        pitch += (target_pitch - pitch) * 0.15
                        roll += (target_roll - roll) * 0.15
                        if not active_inputs and not is_rtl and not target_wp: 
                            pitch *= 0.85
                            roll *= 0.85

                        # 5. Broadcast telemetry data
                        payload = {
                            "timestamp": int(time.time() * 1000), 
                            "is_connected": True,
                            "is_active": is_armed,
                            "drone_state": {
                                "gps": {"latitude": lat, "longitude": lon, "altitude_relative_m": alt},
                                "orientation_deg": {"pitch": pitch, "roll": roll, "yaw_heading": heading},
                                "battery_percentage": 85
                            },
                            "navigation_target": {"next_waypoint_gps": {"latitude": home_lat, "longitude": home_lon}, "distance_to_wp_m": 0, "coverage_efficiency_score": 1.0}
                        }
                        
                        await ws.send(json.dumps(payload))
                        await asyncio.sleep(0.02) # Run at 50Hz (20ms) for maximum smoothness
                finally:
                    listener_task.cancel()
        except (websockets.exceptions.ConnectionClosed, OSError) as e:
            print(f"🔌 Connection closed/failed ({e}). Retrying in 2 seconds...")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(simulate_drone())

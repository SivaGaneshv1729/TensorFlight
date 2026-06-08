import asyncio
import math
import time
import httpx

async def simulate_drone():
    url = "http://127.0.0.1:8000/api/telemetry/update"
    poll_url = "http://127.0.0.1:8000/api/commands/poll"

    # State
    is_armed = False
    is_rtl = False
    
    # Home Position (Set on first arm)
    home_lat, home_lon = 12.9716, 77.5946
    
    # Position
    lat, lon, alt, heading = home_lat, home_lon, 0.0, 0.0
    # Orientation
    pitch, roll = 0.0, 0.0
    
    print("🚀 PRO-STABLE Simulator Started.")
    print("🎮 ARM status enforced. RTL and Stability systems active.")
    
    async with httpx.AsyncClient() as client:
        while True:
            # 1. Poll Commands
            commands = []
            try:
                resp = await client.get(poll_url, timeout=0.05)
                if resp.status_code == 200:
                    commands = resp.json().get("commands", [])
            except Exception: pass

            inputs = []
            for cmd in commands:
                action = cmd.get("action")
                if action == "ARM":
                    is_armed = True
                    is_rtl = False
                    print("✅ Drone ARMED")
                elif action == "DISARM":
                    if alt < 0.5:
                        is_armed = False
                        print("⏹️ Drone DISARMED")
                    else:
                        print("⚠️ Cannot DISARM while in air!")
                elif action == "RTL":
                    is_rtl = True
                    print("🏠 Returning to Home...")
                elif action == "EMERGENCY_STOP":
                    is_armed = False
                    alt = 0 # Instant drop
                    print("🚨 EMERGENCY STOP ACTIVATED")
                elif action == "MANUAL_CONTROL":
                    inputs = cmd.get("params", {}).get("inputs", [])

            # 2. Physics & Logic
            # Realistic Speed Constants (in degrees per step)
            # 1 degree ≈ 111,319 meters. 
            # 5 m/s ≈ 0.000045 deg/sec ≈ 0.0000022 deg/step (@20Hz)
            SPEED_FACTOR = 0.0000025 # ~5.5 m/s
            ALT_SPEED = 0.05 # 1.0 m/s
            YAW_SPEED = 3.0 # deg/step

            v_forward, v_right, v_alt, v_yaw = 0.0, 0.0, 0.0, 0.0
            target_pitch, target_roll = 0.0, 0.0

            if is_armed:
                if is_rtl:
                    # PRO RTL: 3-Phase Logic
                    target_alt = 15.0
                    
                    # Calculate Distances in Meters (Approx)
                    dist_lat_m = (home_lat - lat) * 111319
                    dist_lon_m = (home_lon - lon) * 111319 * math.cos(math.radians(lat))
                    dist_to_home = math.sqrt(dist_lat_m**2 + dist_lon_m**2)

                    # 1. Height Control
                    if alt < (target_alt - 0.5):
                        v_alt = ALT_SPEED
                    elif alt > (target_alt + 0.5):
                        v_alt = -ALT_SPEED

                    # 2. Navigation
                    if dist_to_home > 1.5:
                        # Phase 1 & 2: Rotate and Move towards Home
                        target_heading = (math.degrees(math.atan2(dist_lon_m, dist_lat_m)) + 360) % 360
                        angle_diff = (target_heading - heading + 180) % 360 - 180
                        
                        # Rotate towards home
                        v_yaw = max(-YAW_SPEED, min(YAW_SPEED, angle_diff * 0.2))
                        
                        # Only move forward if reasonably aligned (within 45 degrees)
                        if abs(angle_diff) < 45:
                            v_forward = SPEED_FACTOR * 1.5 # Boosted speed for RTL
                            target_pitch = 10.0
                        
                        if dist_to_home < 5.0:
                            print(f"RTL: Approaching... {dist_to_home:.1f}m")
                    else:
                        # Phase 3: Final Landing
                        v_forward = 0
                        v_yaw = 0
                        if alt > 0.1:
                            v_alt = -ALT_SPEED * 0.5 # Slow descent
                            if int(time.time() * 2) % 2 == 0: # Throttle print
                                print(f"RTL: Landing... Alt: {alt:.1f}m")
                        else:
                            is_rtl = False
                            is_armed = False
                            print("RTL: Mission Complete. Disarmed.")
                else:
                    # Manual Controls
                    if 'PITCH_FORWARD' in inputs: v_forward = SPEED_FACTOR; target_pitch = 15.0
                    if 'PITCH_BACK' in inputs: v_forward = -SPEED_FACTOR; target_pitch = -15.0
                    if 'ROLL_LEFT' in inputs: v_right = -SPEED_FACTOR; target_roll = -15.0
                    if 'ROLL_RIGHT' in inputs: v_right = SPEED_FACTOR; target_roll = 15.0
                    if 'ALT_UP' in inputs: v_alt = ALT_SPEED
                    if 'ALT_DOWN' in inputs: v_alt = -ALT_SPEED
                    if 'YAW_LEFT' in inputs: v_yaw = -YAW_SPEED
                    if 'YAW_RIGHT' in inputs: v_yaw = YAW_SPEED

                # 3. Position Update (Relative to Heading)
                rad = math.radians(heading)
                lat += (v_forward * math.cos(rad) - v_right * math.sin(rad))
                lon += (v_forward * math.sin(rad) + v_right * math.cos(rad))
                
                alt += v_alt
                heading = (heading + v_yaw) % 360
                if alt < 0: alt = 0
            else:
                # Gravity if disarmed mid-air
                if alt > 0: alt -= 0.1
                if alt < 0: alt = 0

            # 4. Visual Tilt Interpolation
            pitch += (target_pitch - pitch) * 0.2
            roll += (target_roll - roll) * 0.2
            if not inputs and not is_rtl: 
                pitch *= 0.8
                roll *= 0.8

            payload = {
                "timestamp": int(time.time() * 1000), "is_active": is_armed,
                "drone_state": {
                    "gps": {"latitude": lat, "longitude": lon, "altitude_relative_m": alt},
                    "orientation_deg": {"pitch": pitch, "roll": roll, "yaw_heading": heading},
                    "battery_percentage": 85
                },
                "navigation_target": {"next_waypoint_gps": {"latitude": home_lat, "longitude": home_lon}, "distance_to_wp_m": 0, "coverage_efficiency_score": 1.0}
            }
            
            try:
                await client.post(url, json=payload, timeout=0.05)
            except Exception: pass
            
            await asyncio.sleep(0.05)

if __name__ == "__main__":
    asyncio.run(simulate_drone())

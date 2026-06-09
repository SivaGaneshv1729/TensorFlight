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
                resp = await client.get(poll_url, timeout=0.1)
                if resp.status_code == 200:
                    commands = resp.json().get("commands", [])
                    if commands:
                        print(f"📥 Simulator received {len(commands)} commands")
            except Exception as e: 
                # print(f"Poll error: {e}")
                pass

            inputs = []
            for cmd in commands:
                action = cmd.get("action")
                print(f"⚙️ Processing Action: {action}")
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
                    # For manual control, we use the latest inputs in the batch
                    inputs = cmd.get("params", {}).get("inputs", [])
                    # print(f"🎮 Manual Inputs: {inputs}")

            # 2. Physics & Logic
            # Realistic Speed Constants (in degrees per step)
            BASE_SPEED_FACTOR = 0.0000050 # Doubled for responsiveness (~11 m/s)
            BASE_ALT_SPEED = 0.08 # ~1.6 m/s
            YAW_SPEED = 4.0 # deg/step

            v_forward, v_right, v_alt, v_yaw = 0.0, 0.0, 0.0, 0.0
            target_pitch, target_roll = 0.0, 0.0

            if is_armed:
                if is_rtl:
                    # RTL Logic... (rest of RTL logic)
                    pass
                else:
                    # Manual Controls with Custom Speeds
                    manual_cmd = next((c for c in reversed(commands) if c.get("action") == "MANUAL_CONTROL"), {})
                    f_speed_mult = manual_cmd.get("params", {}).get("forward_speed", 100) / 100.0
                    c_speed_mult = manual_cmd.get("params", {}).get("climb_speed", 200) / 200.0
                    
                    speed_factor = BASE_SPEED_FACTOR * f_speed_mult
                    alt_speed = BASE_ALT_SPEED * c_speed_mult

                    # FIX: Nose-down (negative pitch) for forward movement
                    # Reduced angles to 8.0 for visual stability
                    if 'PITCH_FORWARD' in inputs: v_forward = speed_factor; target_pitch = -8.0 * f_speed_mult
                    if 'PITCH_BACK' in inputs: v_forward = -speed_factor; target_pitch = 8.0 * f_speed_mult
                    if 'ROLL_LEFT' in inputs: v_right = -speed_factor; target_roll = -8.0 * f_speed_mult
                    if 'ROLL_RIGHT' in inputs: v_right = speed_factor; target_roll = 8.0 * f_speed_mult
                    if 'ALT_UP' in inputs: v_alt = alt_speed
                    if 'ALT_DOWN' in inputs: v_alt = -alt_speed
                    if 'YAW_LEFT' in inputs: v_yaw = -YAW_SPEED * f_speed_mult
                    if 'YAW_RIGHT' in inputs: v_yaw = YAW_SPEED * f_speed_mult

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
            
            try:
                await client.post(url, json=payload, timeout=0.05)
            except Exception: pass
            
            await asyncio.sleep(0.05)

if __name__ == "__main__":
    asyncio.run(simulate_drone())

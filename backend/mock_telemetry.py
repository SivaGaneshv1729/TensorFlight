import asyncio
import math
import time
import httpx

async def simulate_drone():
    url = "http://127.0.0.1:8000/telemetry/update"
    poll_url = "http://127.0.0.1:8000/api/commands/poll"

    # Position
    lat, lon, alt, heading = 12.9716, 77.5946, 0.0, 0.0
    # Orientation
    pitch, roll = 0.0, 0.0
    
    print("🚀 SCORCHED-EARTH Simulator Started.")
    print("🎮 Zero margin for drift. Hardware-level stability active.")
    
    async with httpx.AsyncClient() as client:
        while True:
            # 1. Poll (This CLEARs the backend queue)
            inputs = []
            try:
                resp = await client.get(poll_url, timeout=0.05)
                if resp.status_code == 200:
                    inputs = resp.json().get("inputs", [])
            except Exception: pass

            # 2. Force Absolute Zero by default
            v_lat, v_lon, v_alt, v_yaw = 0.0, 0.0, 0.0, 0.0
            target_pitch, target_roll = 0.0, 0.0

            # 3. Only apply if keys are ACTIVELY held in this exact 50ms window
            if 'PITCH_FORWARD' in inputs: v_lat = 0.0001; target_pitch = 15.0
            if 'PITCH_BACK' in inputs: v_lat = -0.0001; target_pitch = -15.0
            if 'ROLL_LEFT' in inputs: v_lon = -0.0001; target_roll = -15.0
            if 'ROLL_RIGHT' in inputs: v_lon = 0.0001; target_roll = 15.0
            if 'ALT_UP' in inputs: v_alt = 0.2
            if 'ALT_DOWN' in inputs: v_alt = -0.2
            if 'YAW_LEFT' in inputs: v_yaw = -5.0
            if 'YAW_RIGHT' in inputs: v_yaw = 5.0

            # 4. Direct Position Update (No inertia, no gliding)
            lat += v_lat
            lon += v_lon
            alt += v_alt
            heading = (heading + v_yaw) % 360
            if alt < 0: alt = 0

            # 5. Visual tilt interpolation (Still smooth, but returns to 0 instantly)
            pitch += (target_pitch - pitch) * 0.3
            roll += (target_roll - roll) * 0.3
            if not inputs: 
                pitch, roll = 0.0, 0.0 # Snap to zero visual tilt if no inputs

            payload = {
                "timestamp": int(time.time() * 1000), "is_active": alt > 0.01,
                "drone_state": {
                    "gps": {"latitude": lat, "longitude": lon, "altitude_relative_m": alt},
                    "orientation_deg": {"pitch": pitch, "roll": roll, "yaw_heading": heading},
                    "battery_percentage": 90
                },
                "navigation_target": {"next_waypoint_gps": {"latitude": 0, "longitude": 0}, "distance_to_wp_m": 0, "coverage_efficiency_score": 1.0}
            }
            
            try:
                await client.post(url, json=payload, timeout=0.05)
            except Exception: pass
            
            await asyncio.sleep(0.05)

if __name__ == "__main__":
    asyncio.run(simulate_drone())

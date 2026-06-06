import asyncio
import math
import time
import httpx

async def simulate_drone():
    url = "http://127.0.0.1:8000/telemetry/update"
    semaphore = asyncio.Semaphore(5) # Limit concurrent POST requests

    start_lat = 12.9716
    start_lon = 77.5946
    alt = 10.0
    heading = 0
    
    print("🚀 Telemetry Simulator Started...")
    
    async with httpx.AsyncClient() as client:
        async def send_data(payload):
            async with semaphore:
                try:
                    await client.post(url, json=payload, timeout=1.0)
                except Exception:
                    pass

        while True:
            # Simulate a slow circular flight path
            heading = (heading + 2) % 360
            rad = math.radians(heading)
            
            curr_lat = start_lat + (math.cos(rad) * 0.0001)
            curr_lon = start_lon + (math.sin(rad) * 0.0001)
            
            payload = {
                "timestamp": int(time.time() * 1000),
                "drone_state": {
                    "gps": {
                        "latitude": curr_lat,
                        "longitude": curr_lon,
                        "altitude_relative_m": alt + math.sin(time.time()) * 2
                    },
                    "orientation_deg": {
                        "pitch": math.sin(time.time()) * 5,
                        "roll": math.cos(time.time()) * 5,
                        "yaw_heading": heading
                    },
                    "battery_percentage": 95
                },
                "navigation_target": {
                    "next_waypoint_gps": { "latitude": 12.9720, "longitude": 77.5950 },
                    "distance_to_wp_m": 45.5,
                    "coverage_efficiency_score": 0.98
                }
            }
            
            # Fire and forget but with a limit on concurrency
            asyncio.create_task(send_data(payload))
            
            print(f"Drone at: {curr_lat:.6f}, {curr_lon:.6f} | Heading: {heading}°", end="\r")
            await asyncio.sleep(0.1) # 10Hz

if __name__ == "__main__":
    asyncio.run(simulate_drone())

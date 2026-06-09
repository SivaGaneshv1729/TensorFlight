import asyncio
import websockets

async def test():
    try:
        # Some versions of websockets don't like timeout in connect
        async with websockets.connect('ws://127.0.0.1:8000/ws/telemetry') as ws:
            print("✅ Direct WebSocket Connection Successful")
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            print(f"📡 Data Received: {msg[:100]}...")
    except Exception as e:
        print(f"❌ WebSocket Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())

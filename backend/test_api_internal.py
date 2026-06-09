import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        print("Sending ARM command...")
        r = await client.post('http://127.0.0.1:8000/api/command', json={'action': 'ARM', 'params': {}})
        print(f"Post Response: {r.status_code} - {r.json()}")
        
        print("Polling commands...")
        r = await client.get('http://127.0.0.1:8000/api/commands/poll')
        print(f"Poll Response: {r.status_code} - {r.json()}")

if __name__ == "__main__":
    asyncio.run(test())

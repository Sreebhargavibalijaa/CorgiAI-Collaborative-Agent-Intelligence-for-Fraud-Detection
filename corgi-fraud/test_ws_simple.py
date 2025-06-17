#!/usr/bin/env python3
import asyncio
import websockets
import json
import sys

async def test_websocket(task_id):
    """Simple WebSocket test"""
    try:
        uri = f'ws://localhost:8000/ws/{task_id}'
        print(f"Connecting to: {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ Connected!")
            
            # Wait for initial message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(message)
                print(f"📨 Received: {data}")
            except asyncio.TimeoutError:
                print("⏰ No initial message received (this is normal if task completed)")
            except Exception as e:
                print(f"❌ Error receiving message: {e}")
                
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 test_ws_simple.py <task_id>")
        sys.exit(1)
    
    task_id = sys.argv[1]
    asyncio.run(test_websocket(task_id))

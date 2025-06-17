#!/usr/bin/env python3
import asyncio
import websockets
import json
import requests
import sys
import time

async def monitor_websocket(task_id):
    """Monitor WebSocket updates for a given task ID"""
    try:
        uri = f'ws://localhost:8000/ws/{task_id}'
        print(f"🔌 Connecting to WebSocket: {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            while True:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=60.0)
                    data = json.loads(message)
                    
                    # Pretty print the update
                    if data['type'] == 'connection_established':
                        print(f"🟢 {data['message']}")
                    elif data['type'] == 'progress':
                        progress = data.get('progress', 0)
                        message = data.get('message', 'Processing...')
                        print(f"⏳ [{progress:3d}%] {message}")
                    elif data['type'] == 'completed':
                        print(f"🎉 {data['message']}")
                        if 'processing_time' in data:
                            print(f"   Processing time: {data['processing_time']}")
                        break
                    elif data['type'] == 'error':
                        print(f"❌ Error: {data['error']}")
                        break
                    else:
                        print(f"📨 {data}")
                        
                except asyncio.TimeoutError:
                    print("⏰ WebSocket timeout - no updates received")
                    break
                except websockets.exceptions.ConnectionClosed:
                    print("🔌 WebSocket connection closed")
                    break
                    
    except Exception as e:
        print(f"❌ WebSocket error: {e}")

def upload_file_and_get_task_id(file_path):
    """Upload file and return task ID"""
    try:
        print(f"📤 Uploading file: {file_path}")
        
        with open(file_path, 'rb') as f:
            files = {'file': ('sample_claims.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post('http://localhost:8000/api/upload-excel', files=files)
        
        if response.status_code == 200:
            data = response.json()
            task_id = data['task_id']
            print(f"✅ Upload successful! Task ID: {task_id}")
            return task_id
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

async def main():
    print("🚀 Testing WebSocket Real-time Batch Processing")
    print("=" * 50)
    
    # Upload file
    file_path = "/tmp/sample_claims_test.xlsx"
    task_id = upload_file_and_get_task_id(file_path)
    
    if not task_id:
        print("❌ Failed to upload file. Exiting.")
        return
    
    print(f"\n🔍 Monitoring task: {task_id}")
    print("=" * 50)
    
    # Monitor WebSocket updates
    await monitor_websocket(task_id)
    
    print("\n✨ Test completed!")

if __name__ == "__main__":
    asyncio.run(main())

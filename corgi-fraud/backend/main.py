from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import pandas as pd
import json
import os
import sys
import uuid
from datetime import datetime
import logging
from dotenv import load_dotenv
import asyncio
import time

# Load environment variables first
load_dotenv()

# Add the parent directory to the path to import our existing modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

try:
    from agents_excel import CorgiAgentSystem, ExcelProcessor
    # Note: ClaimDataGenerator is not a class but a function in synthesized_data
    import synthesized_data
    ClaimDataGenerator = synthesized_data  # Use the module itself
except ImportError as e:
    print(f"Warning: Could not import fraud detection modules: {e}")
    print("The API will run with limited functionality.")
    CorgiAgentSystem = None
    ExcelProcessor = None
    ClaimDataGenerator = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Corgi Fraud Detection API",
    description="Advanced Multi-Agent Fraud Detection System",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the fraud detection system
if CorgiAgentSystem:
    fraud_system = CorgiAgentSystem()
else:
    fraud_system = None

# Data models
class ClaimRequest(BaseModel):
    claimant: str
    claim_text: str
    claim_amount: Optional[float] = None
    date_of_incident: Optional[str] = None
    policy_number: Optional[str] = None
    contact_email: Optional[str] = None
    supporting_docs: Optional[str] = None
    medical_codes: Optional[str] = None
    location: Optional[str] = None
    transaction_hashes: Optional[str] = None

class ClaimResponse(BaseModel):
    claim_id: str
    decision: str
    confidence: float
    processing_time: float
    agent_scores: Dict
    risk_factors: List[str]
    recommendations: List[str]

class BatchProcessResponse(BaseModel):
    task_id: str
    status: str
    message: str

# In-memory storage for batch processing tasks
batch_tasks = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.pending_updates: Dict[str, List[dict]] = {}  # Store updates for reconnection

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        self.active_connections[task_id] = websocket
        logger.info(f"WebSocket connection established for task {task_id}")
        
        # Send any pending updates that were missed during disconnection
        if task_id in self.pending_updates:
            for update in self.pending_updates[task_id]:
                try:
                    await websocket.send_text(json.dumps(update))
                    logger.debug(f"Sent pending update to {task_id}: {update.get('type', 'unknown')}")
                except Exception as e:
                    logger.error(f"Error sending pending update to {task_id}: {e}")
                    break
            # Clear pending updates after sending
            del self.pending_updates[task_id]

    def disconnect(self, task_id: str):
        if task_id in self.active_connections:
            del self.active_connections[task_id]
            logger.info(f"WebSocket connection removed for task {task_id}")

    async def send_progress_update(self, task_id: str, data: dict):
        if task_id in self.active_connections:
            try:
                websocket = self.active_connections[task_id]
                if websocket.client_state.name == "CONNECTED":
                    await websocket.send_text(json.dumps(data))
                    logger.debug(f"Sent WebSocket update to {task_id}: {data.get('type', 'unknown')}")
                else:
                    logger.warning(f"WebSocket for task {task_id} not in CONNECTED state")
                    self._store_pending_update(task_id, data)
                    self.disconnect(task_id)
            except Exception as e:
                logger.error(f"Error sending WebSocket message to {task_id}: {e}")
                self._store_pending_update(task_id, data)
                self.disconnect(task_id)
        else:
            # Store update for when client reconnects
            self._store_pending_update(task_id, data)
            logger.debug(f"No active WebSocket connection for task {task_id}, storing update for later")

    def _store_pending_update(self, task_id: str, data: dict):
        """Store updates for tasks that don't have active connections"""
        if task_id not in self.pending_updates:
            self.pending_updates[task_id] = []
        
        # Only store important updates (not heartbeats) and limit to last 10 updates
        if data.get('type') != 'heartbeat':
            self.pending_updates[task_id].append(data)
            # Keep only the last 10 updates to prevent memory issues
            self.pending_updates[task_id] = self.pending_updates[task_id][-10:]

    async def broadcast_to_all(self, data: dict):
        disconnected_tasks = []
        for task_id, websocket in self.active_connections.items():
            try:
                if websocket.client_state.name == "CONNECTED":
                    await websocket.send_text(json.dumps(data))
                else:
                    disconnected_tasks.append(task_id)
            except Exception as e:
                logger.error(f"Error broadcasting to {task_id}: {e}")
                disconnected_tasks.append(task_id)
        
        # Clean up disconnected connections and store updates
        for task_id in disconnected_tasks:
            self._store_pending_update(task_id, data)
            self.disconnect(task_id)

manager = ConnectionManager()

@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """WebSocket endpoint for real-time batch processing updates"""
    await manager.connect(websocket, task_id)
    logger.info(f"WebSocket connected for task {task_id}")
    
    try:
        # Send initial connection confirmation
        await manager.send_progress_update(task_id, {
            "type": "connection_established",
            "task_id": task_id,
            "message": "Connected to batch processing updates",
            "timestamp": datetime.now().isoformat()
        })
        
        # If task exists, send current status immediately
        if task_id in batch_tasks:
            task_data = batch_tasks[task_id]
            status = task_data.get("status", "unknown")
            progress = task_data.get("progress", 0)
            
            if status == "completed":
                await manager.send_progress_update(task_id, {
                    "type": "completed",
                    "task_id": task_id,
                    "status": "completed",
                    "progress": 100,
                    "message": "Batch processing completed successfully!",
                    "processing_time": f'{task_data.get("processing_time", 0):.2f} seconds',
                    "output_path": task_data.get("output_path", ""),
                    "timestamp": datetime.now().isoformat()
                })
            elif status == "failed":
                await manager.send_progress_update(task_id, {
                    "type": "error",
                    "task_id": task_id,
                    "status": "failed",
                    "error": task_data.get("error", "Unknown error"),
                    "timestamp": datetime.now().isoformat()
                })
            elif status == "processing":
                await manager.send_progress_update(task_id, {
                    "type": "progress",
                    "task_id": task_id,
                    "status": "processing",
                    "progress": progress,
                    "message": f"Processing in progress... {progress}%",
                    "timestamp": datetime.now().isoformat()
                })
        
        # Keep connection alive - focus on maintaining connection, not receiving messages
        heartbeat_task = None
        try:
            # Start heartbeat task for this connection
            heartbeat_task = asyncio.create_task(send_periodic_heartbeat(task_id, 30))
            
            # Wait for client to disconnect - use a simple ping mechanism
            while True:
                try:
                    # Check if connection is still alive by trying to ping
                    await websocket.ping()
                    await asyncio.sleep(10)  # Check every 10 seconds
                except Exception:
                    logger.info(f"WebSocket ping failed for task {task_id}, connection lost")
                    break
                    
        finally:
            if heartbeat_task:
                heartbeat_task.cancel()
                try:
                    await heartbeat_task
                except asyncio.CancelledError:
                    pass
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for task {task_id}")
    except Exception as e:
        logger.error(f"WebSocket error for task {task_id}: {e}")
    finally:
        manager.disconnect(task_id)

async def send_periodic_heartbeat(task_id: str, interval: int):
    """Send periodic heartbeat messages to keep connection alive"""
    try:
        while True:
            await asyncio.sleep(interval)
            await manager.send_progress_update(task_id, {
                "type": "heartbeat",
                "task_id": task_id,
                "message": "Connection alive",
                "timestamp": datetime.now().isoformat()
            })
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Heartbeat error for task {task_id}: {e}")

@app.get("/")
async def root():
    return {"message": "Corgi Fraud Detection API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/analyze-claim", response_model=ClaimResponse)
async def analyze_single_claim(claim: ClaimRequest):
    """Analyze a single claim for fraud detection"""
    if not fraud_system:
        raise HTTPException(status_code=503, detail="Fraud detection system not available")
    
    try:
        # Prepare metadata
        metadata = {
            "ClaimAmount": claim.claim_amount,
            "DateOfIncident": claim.date_of_incident,
            "PolicyNumber": claim.policy_number,
            "ContactEmail": claim.contact_email,
            "SupportingDocs": claim.supporting_docs,
            "MedicalCodes": claim.medical_codes,
            "Location": claim.location,
            "TransactionHashes": claim.transaction_hashes
        }
        
        # Filter out None values
        metadata = {k: v for k, v in metadata.items() if v is not None}
        
        # Process the claim
        result = fraud_system.process_claim(
            claim_text=claim.claim_text,
            claimant=claim.claimant,
            metadata=metadata
        )
        
        # Extract risk factors and recommendations from agent scores
        risk_factors = []
        recommendations = []
        
        if result.get("agent_scores", {}).get("scores"):
            scores = result["agent_scores"]["scores"]
            for agent, score in scores.items():
                if score > 0.7:
                    risk_factors.append(f"High risk detected by {agent} (score: {score:.2f})")
                elif score > 0.5:
                    recommendations.append(f"Monitor {agent} indicators (score: {score:.2f})")
        
        if result["decision"] == "REJECT":
            recommendations.append("Recommend manual review")
            recommendations.append("Contact claimant for additional documentation")
        
        return ClaimResponse(
            claim_id=result["claim_id"],
            decision=result["decision"],
            confidence=result["agent_scores"].get("average_score", 0),
            processing_time=result.get("processing_time_seconds", 0),
            agent_scores=result["agent_scores"],
            risk_factors=risk_factors,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error processing claim: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-excel")
async def upload_excel_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload and process an Excel file with multiple claims"""
    if not fraud_system:
        raise HTTPException(status_code=503, detail="Fraud detection system not available. Please check OpenAI API key configuration.")
    
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
        
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Save uploaded file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{task_id}_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Initialize task status
        batch_tasks[task_id] = {
            "status": "processing",
            "file_path": file_path,
            "created_at": datetime.now().isoformat(),
            "progress": 0
        }
        
        # Process in background
        background_tasks.add_task(process_excel_background, task_id, file_path)
        
        return BatchProcessResponse(
            task_id=task_id,
            status="processing",
            message="File uploaded successfully. Processing started."
        )
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_excel_background(task_id: str, file_path: str):
    """Background task to process Excel file with WebSocket updates"""
    try:
        # Increased delay to allow WebSocket connection to be established
        # Frontend typically takes 1-2 seconds to establish WebSocket after getting task_id
        await asyncio.sleep(2.0)
        
        # Send initial processing update
        await manager.send_progress_update(task_id, {
            "type": "progress",
            "task_id": task_id,
            "status": "starting",
            "progress": 0,
            "message": "Initializing batch processing...",
            "timestamp": datetime.now().isoformat()
        })
        
        batch_tasks[task_id]["status"] = "processing"
        batch_tasks[task_id]["progress"] = 5
        
        # Check if fraud system is available
        if not fraud_system:
            error_msg = "Fraud detection system not available. Please check OpenAI API key configuration."
            await manager.send_progress_update(task_id, {
                "type": "error",
                "task_id": task_id,
                "status": "failed",
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            })
            raise Exception(error_msg)
        
        # Send loading update
        await manager.send_progress_update(task_id, {
            "type": "progress",
            "task_id": task_id,
            "status": "processing",
            "progress": 10,
            "message": "Loading Excel file...",
            "timestamp": datetime.now().isoformat()
        })
        
        # Read the Excel file to get row count for progress tracking
        try:
            df = pd.read_excel(file_path)
            total_rows = len(df)
            
            await manager.send_progress_update(task_id, {
                "type": "progress",
                "task_id": task_id,
                "status": "processing",
                "progress": 20,
                "message": f"Found {total_rows} claims to process...",
                "total_items": total_rows,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            await manager.send_progress_update(task_id, {
                "type": "progress",
                "task_id": task_id,
                "status": "processing",
                "progress": 20,
                "message": "Processing Excel file...",
                "timestamp": datetime.now().isoformat()
            })
        
        # Simulate processing steps with progress updates
        processing_steps = [
            (30, "Validating claim data..."),
            (40, "Initializing AI agents..."),
            (50, "Running fraud detection analysis..."),
            (70, "Evaluating risk factors..."),
            (85, "Generating recommendations..."),
            (95, "Finalizing results...")
        ]
        
        for progress, message in processing_steps:
            await asyncio.sleep(1)  # Simulate processing time
            batch_tasks[task_id]["progress"] = progress
            
            await manager.send_progress_update(task_id, {
                "type": "progress",
                "task_id": task_id,
                "status": "processing",
                "progress": progress,
                "message": message,
                "timestamp": datetime.now().isoformat()
            })
        
        # Process the Excel file
        start_time = time.time()
        output_path = fraud_system.process_excel(file_path)
        processing_time = time.time() - start_time
        
        # Send completion update
        await manager.send_progress_update(task_id, {
            "type": "completed",
            "task_id": task_id,
            "status": "completed",
            "progress": 100,
            "message": "Batch processing completed successfully!",
            "processing_time": f"{processing_time:.2f} seconds",
            "output_path": output_path,
            "timestamp": datetime.now().isoformat()
        })
        
        batch_tasks[task_id].update({
            "status": "completed",
            "output_path": output_path,
            "completed_at": datetime.now().isoformat(),
            "progress": 100,
            "processing_time": processing_time
        })
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error processing Excel file {task_id}: {error_msg}")
        
        # Send error update via WebSocket
        await manager.send_progress_update(task_id, {
            "type": "error",
            "task_id": task_id,
            "status": "failed",
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        })
        
        batch_tasks[task_id].update({
            "status": "failed",
            "error": error_msg,
            "completed_at": datetime.now().isoformat()
        })

@app.get("/api/batch-status/{task_id}")
async def get_batch_status(task_id: str):
    """Get the status of a batch processing task"""
    if task_id not in batch_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return batch_tasks[task_id]

@app.get("/api/download-results/{task_id}")
async def download_results(task_id: str):
    """Download the processed results file"""
    if task_id not in batch_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = batch_tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Task not completed")
    
    output_path = task["output_path"]
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Results file not found")
    
    return FileResponse(
        output_path,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=os.path.basename(output_path)
    )

@app.get("/api/generate-template")
async def generate_template():
    """Generate and download an Excel template for claims"""
    if not ExcelProcessor:
        raise HTTPException(status_code=503, detail="Excel processing not available")
    
    try:
        template_path = ExcelProcessor.generate_template("claims_template.xlsx")
        
        return FileResponse(
            template_path,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename="claims_template.xlsx"
        )
        
    except Exception as e:
        logger.error(f"Error generating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate-sample-data")
async def generate_sample_data():
    """Generate sample fraud detection data"""
    if not ClaimDataGenerator:
        raise HTTPException(status_code=503, detail="Sample data generation not available")
    
    try:
        # Use the function from synthesized_data module
        df = ClaimDataGenerator.generate_complex_claims("sample_claims.xlsx", num_claims=50)
        
        output_path = "sample_claims.xlsx"
        
        return FileResponse(
            output_path,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename="sample_claims.xlsx"
        )
        
    except Exception as e:
        logger.error(f"Error generating sample data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_system_stats():
    """Get system statistics and metrics"""
    try:
        # Get agent versions and configuration
        stats = {
            "agent_versions": fraud_system.agent_versions,
            "total_processed": len(fraud_system.mcp.history),
            "recent_activity": fraud_system.mcp.history[-10:] if fraud_system.mcp.history else [],
            "system_status": "operational",
            "last_updated": datetime.now().isoformat()
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Serve static files for the frontend (only if the build directory exists)
frontend_build_path = "../frontend/build"
if os.path.exists(frontend_build_path):
    app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        """Serve the React frontend"""
        if os.path.exists(os.path.join(frontend_build_path, path)):
            return FileResponse(os.path.join(frontend_build_path, path))
        else:
            return FileResponse(os.path.join(frontend_build_path, "index.html"))
else:
    @app.get("/frontend-status")
    async def frontend_status():
        return {"message": "Frontend not built yet. Run 'npm run build' in the frontend directory."}

@app.post("/api/upload-documents")
async def upload_supporting_documents(files: List[UploadFile] = File(...)):
    """Upload supporting documents for a claim"""
    try:
        uploaded_files = []
        upload_dir = "uploads/documents"
        os.makedirs(upload_dir, exist_ok=True)
        
        for file in files:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(file.filename)[1]
            safe_filename = f"{file_id}_{file.filename}"
            file_path = os.path.join(upload_dir, safe_filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            uploaded_files.append({
                "filename": file.filename,
                "file_id": file_id,
                "file_path": file_path,
                "size": len(content),
                "content_type": file.content_type
            })
        
        return {
            "message": "Files uploaded successfully",
            "files": uploaded_files
        }
        
    except Exception as e:
        logger.error(f"Error uploading files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download-template")
async def download_template():
    """Download Excel template for batch claims processing"""
    try:
        template_path = "claims_template.xlsx"
        
        # Create template if it doesn't exist
        if not os.path.exists(template_path):
            # Create a basic template
            import pandas as pd
            template_data = {
                'ClaimID': ['CLM-EXAMPLE-001'],
                'Claimant': ['Example Claimant'],
                'ClaimText': ['Sample claim description. Replace with your actual claim details.'],
                'ClaimAmount': [1000.00],
                'IncidentDate': ['2025-01-01'],
                'PolicyNumber': ['POL-EXAMPLE-001'],
                'ClaimType': ['Auto'],
                'SupportingDocs': ['document1.pdf, document2.pdf'],
                'ContactEmail': ['example@email.com'],
                'Location': ['40.7128,-74.0060'],
                'MedicalCodes': ['ICD-10:S72.8X1A'],
                'TransactionHashes': ['0xabc123...']
            }
            
            df = pd.DataFrame(template_data)
            df.to_excel(template_path, index=False)
        
        return FileResponse(
            path=template_path,
            filename="claims_template.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except Exception as e:
        logger.error(f"Error downloading template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

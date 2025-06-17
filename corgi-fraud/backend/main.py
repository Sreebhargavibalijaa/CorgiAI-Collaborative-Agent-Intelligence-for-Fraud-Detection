from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
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
    """Background task to process Excel file"""
    try:
        batch_tasks[task_id]["status"] = "processing"
        
        # Check if fraud system is available
        if not fraud_system:
            raise Exception("Fraud detection system not available. Please check OpenAI API key configuration.")
        
        # Process the Excel file
        output_path = fraud_system.process_excel(file_path)
        
        batch_tasks[task_id].update({
            "status": "completed",
            "output_path": output_path,
            "completed_at": datetime.now().isoformat(),
            "progress": 100
        })
        
    except Exception as e:
        logger.error(f"Error processing Excel file {task_id}: {e}")
        batch_tasks[task_id].update({
            "status": "failed",
            "error": str(e),
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

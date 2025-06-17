# System Design - Corgi Fraud Detection System

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Design](#component-design)
3. [Data Flow](#data-flow)
4. [Agent Architecture](#agent-architecture)
5. [API Design](#api-design)
6. [Security Considerations](#security-considerations)
7. [Scalability & Performance](#scalability--performance)
8. [Technology Stack](#technology-stack)

## Architecture Overview

The Corgi Fraud Detection System is built as a modern microservices architecture with a React frontend and FastAPI backend, featuring a sophisticated multi-agent AI system for comprehensive fraud analysis.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Agents     │
│   (React)       │◄──►│   (FastAPI)     │◄──►│  (Multi-Agent)  │
│   Port: 3000    │    │   Port: 8000    │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   File Storage  │    │   OpenAI API    │
│   Interface     │    │   (Local/Cloud) │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Design

### 1. Frontend Layer (React)
- **Technology**: React 18.x with modern hooks
- **Routing**: React Router for SPA navigation
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks (useState, useEffect)
- **HTTP Client**: Axios for API communication

#### Key Components:
```
src/
├── App.js                 # Main application component
├── components/
│   └── Navbar.js         # Navigation component
└── pages/
    ├── Dashboard.js      # Main dashboard with stats
    ├── SingleClaim.js    # Individual claim analysis
    ├── BatchProcess.js   # Bulk processing interface
    └── Analytics.js      # Analytics and reporting
```

### 2. Backend Layer (FastAPI)
- **Technology**: FastAPI with Python 3.12+
- **ASGI Server**: Uvicorn for high performance
- **Documentation**: Auto-generated OpenAPI/Swagger docs
- **File Handling**: Python-multipart for file uploads
- **CORS**: Configured for frontend communication

#### Key Modules:
```
backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── uploads/            # File storage directory
```

### 3. AI Agent System
- **Framework**: Microsoft AutoGen for multi-agent orchestration
- **LLM Provider**: OpenAI GPT models
- **Agent Coordination**: Chat manager for agent communication
- **Decision Making**: Consensus-based fraud determination

## Data Flow

### Single Claim Analysis Flow
```
1. User Input → Frontend Form
2. Frontend → POST /api/analyze-claim → Backend
3. Backend → Agent System Initialization
4. Multi-Agent Analysis:
   ├── ClaimProcessor (orchestrator)
   ├── SocialAnalystPro (social media/timeline)
   ├── GeospatialAnalyst (location verification)
   ├── MedicalClaimsExpert (medical validation)
   ├── NetworkThreatIntel (security analysis)
   ├── BlockchainForensics (transaction analysis)
   └── DecisionEnginePro (final decision)
5. Agent Consensus → Decision
6. Backend → JSON Response → Frontend
7. Frontend → Display Results
```

### Batch Processing Flow
```
1. File Upload → Frontend
2. Frontend → POST /api/upload-excel → Backend
3. Backend → File Validation & Storage
4. Background Processing:
   ├── Excel File Parsing
   ├── Row-by-Row Agent Analysis
   ├── Results Aggregation
   └── Output File Generation
5. Status Updates via GET /api/batch-status/{task_id}
6. Download via GET /api/download-results/{task_id}
```

## Agent Architecture

### Multi-Agent System Design

The system employs a sophisticated multi-agent architecture using Microsoft AutoGen framework:

```python
# Agent Hierarchy
ChatManager (Orchestrator)
├── ClaimProcessor (Primary Agent)
├── SocialAnalystPro v2.1 (Social Intelligence)
├── GeospatialAnalyst v1.2 (Location Intelligence)
├── MedicalClaimsExpert v1.0 (Medical Intelligence)
├── NetworkThreatIntel v2.1 (Security Intelligence)
├── BlockchainForensics v1.3 (Financial Intelligence)
└── DecisionEnginePro v3.0 (Decision Intelligence)
```

### Agent Responsibilities

| Agent | Version | Primary Function | Key Capabilities |
|-------|---------|------------------|------------------|
| **ClaimProcessor** | - | Orchestration | Request routing, data preparation |
| **SocialAnalystPro** | 2.1 | Social Analysis | Timeline verification, media analysis |
| **GeospatialAnalyst** | 1.2 | Location Intel | GPS verification, weather consistency |
| **MedicalClaimsExpert** | 1.0 | Medical Validation | Procedure consistency, provider risk |
| **NetworkThreatIntel** | 2.1 | Security Analysis | IP reputation, behavioral patterns |
| **BlockchainForensics** | 1.3 | Financial Intel | Transaction analysis, wallet risk |
| **DecisionEnginePro** | 3.0 | Final Decision | Risk aggregation, rule application |

### Agent Communication Protocol

```python
# Agent Message Format
{
    "action": "process_claim",
    "claim_id": "unique_identifier",
    "claim_text": "claim_description",
    "claimant": "claimant_name",
    "metadata": {
        "ClaimAmount": float,
        "DateOfIncident": "YYYY-MM-DD",
        "PolicyNumber": "string",
        "ContactEmail": "email",
        "Location": "string"
    }
}
```

## API Design

### RESTful Endpoints

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/` | API information | None |
| GET | `/health` | Health check | None |
| GET | `/api/stats` | System statistics | None |
| POST | `/api/analyze-claim` | Single claim analysis | ClaimRequest body |
| POST | `/api/upload-excel` | Batch processing | Multipart file |
| GET | `/api/batch-status/{task_id}` | Processing status | task_id |
| GET | `/api/download-results/{task_id}` | Download results | task_id |

### Data Models

```python
# Request Models
class ClaimRequest(BaseModel):
    claimant: str
    claim_text: str
    claim_amount: Optional[float]
    date_of_incident: Optional[str]
    policy_number: Optional[str]
    contact_email: Optional[str]
    supporting_docs: Optional[str]
    medical_codes: Optional[str]
    location: Optional[str]
    transaction_hashes: Optional[str]

# Response Models
class ClaimResponse(BaseModel):
    claim_id: str
    decision: str
    confidence: float
    processing_time: float
    agent_scores: Dict
    risk_factors: List[str]
    recommendations: List[str]
```

## Security Considerations

### 1. API Security
- **CORS**: Configured for specific origins
- **Input Validation**: Pydantic models for request validation
- **File Upload**: Size limits and type validation
- **Environment Variables**: Sensitive data in .env files

### 2. Data Protection
- **API Keys**: Secure storage of OpenAI API keys
- **File Storage**: Local storage with restricted access
- **Logging**: Structured logging without sensitive data
- **Error Handling**: Graceful error responses

### 3. Agent Security
- **Prompt Engineering**: Secure prompts to prevent injection
- **Rate Limiting**: OpenAI API rate management
- **Data Sanitization**: Input cleaning before agent processing

## Scalability & Performance

### Current Architecture
- **Single Instance**: Development setup on localhost
- **In-Memory Storage**: Batch task tracking
- **Local File Storage**: Upload/download files

### Scaling Recommendations
```
Production Scaling Path:
├── Containerization (Docker)
├── Load Balancing (nginx/HAProxy)
├── Database Integration (PostgreSQL/MongoDB)
├── Redis for Caching & Session Management
├── Cloud Storage (AWS S3/Azure Blob)
├── Message Queue (Celery/RQ for background tasks)
├── Monitoring (Prometheus/Grafana)
└── CI/CD Pipeline (GitHub Actions)
```

### Performance Optimizations
- **Async Processing**: FastAPI async endpoints
- **Background Tasks**: Non-blocking batch processing
- **Agent Caching**: Reuse agent instances
- **Connection Pooling**: HTTP client optimization

## Technology Stack

### Frontend
- **React**: 18.2.0
- **React Router**: 6.8.1
- **Axios**: 1.6.2
- **Tailwind CSS**: 3.3.6
- **Lucide React**: 0.294.0 (icons)
- **Recharts**: 2.8.0 (charts)

### Backend
- **FastAPI**: 0.104.1
- **Uvicorn**: 0.24.0
- **Python**: 3.12+
- **Pandas**: 2.0.0+ (Excel processing)
- **OpenPyXL**: 3.1.0+ (Excel handling)
- **Python-multipart**: 0.0.6 (file uploads)

### AI/ML
- **PyAutoGen**: 0.2.0+ (multi-agent framework)
- **OpenAI**: GPT models via API
- **Python-dotenv**: Environment management

### Development Tools
- **npm**: Package management
- **pip**: Python package management
- **VS Code**: Recommended IDE
- **Postman/Insomnia**: API testing

## Deployment Architecture

### Development Setup
```
Development Environment:
├── Frontend: http://localhost:3000
├── Backend: http://localhost:8000
├── API Docs: http://localhost:8000/docs
└── File Storage: ./uploads/
```

### Production Considerations
```
Production Environment:
├── Frontend: CDN + Static Hosting
├── Backend: Container Orchestration
├── Database: Managed Database Service
├── File Storage: Cloud Object Storage
├── Monitoring: Application Performance Monitoring
└── Security: WAF, SSL/TLS, Secret Management
```

---

*This system design provides a robust foundation for enterprise-scale fraud detection with multi-agent AI intelligence.*

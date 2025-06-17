# CorgiAI: Collaborative Agent Intelligence for Fraud Detection

An advanced AI-powered fraud detection system using multi-agent architecture with FastAPI backend and React frontend.

## 📚 Documentation

- **[📋 System Overview](./OVERVIEW.md)** - Complete project overview and features
- **[🏗️ System Design](./SYSTEM_DESIGN.md)** - Technical architecture and design decisions
- **[✅ Implementation Status](./COMPLETE.md)** - Current implementation status

## 🚀 Features

- **Multi-Agent AI System**: Uses specialized AI agents for different types of analysis:
  - Social Media Analysis
  - Network Threat Intelligence
  - Blockchain Forensics
  - Medical Claims Expert
  - Geospatial Analysis
  - Decision Engine

- **Single Claim Analysis**: Analyze individual claims in real-time
- **Batch Processing**: Upload Excel files for bulk analysis
- **Analytics Dashboard**: Comprehensive insights and performance metrics
- **Modern UI**: Beautiful, responsive React frontend with Tailwind CSS
- **RESTful API**: FastAPI backend with automatic documentation

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **AutoGen**: Multi-agent conversation framework
- **Pandas**: Data manipulation and analysis
- **OpenAI GPT**: Language models for analysis
- **Pydantic**: Data validation and settings management

### Frontend
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons
- **Recharts**: Charts and data visualization
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing

## 📦 Installation

### Quick Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd corgi-fraud
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment variables**
   Edit the `.env` file and add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Manual Setup

#### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Frontend Setup
```bash
cd frontend
npm install
```

## 🏃‍♂️ Running the Application

### Start the Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```
The API will be available at `http://localhost:8000`

### Start the Frontend
```bash
cd frontend
npm start
```
The web application will be available at `http://localhost:3000`

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

### Key Endpoints

- `POST /api/analyze-claim` - Analyze a single claim
- `POST /api/upload-excel` - Upload Excel file for batch processing
- `GET /api/batch-status/{task_id}` - Check batch processing status
- `GET /api/download-results/{task_id}` - Download results
- `GET /api/generate-template` - Download Excel template
- `GET /api/stats` - Get system statistics

## 📊 Usage

### Single Claim Analysis
1. Navigate to the "Single Claim" page
2. Fill in the claim information
3. Click "Analyze Claim"
4. View the AI analysis results

### Batch Processing
1. Navigate to the "Batch Process" page
2. Download the Excel template
3. Fill in your claims data
4. Upload the file
5. Monitor processing status
6. Download results when complete

### Analytics
View comprehensive analytics and performance metrics on the Analytics page.

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `FRAUD_THRESHOLD`: Threshold for fraud detection (default: 0.7)
- `CONSENSUS_THRESHOLD`: Number of agents needed for consensus (default: 3)

### Excel File Format
Required columns:
- `ClaimID`: Unique identifier for the claim
- `Claimant`: Name of the person making the claim
- `ClaimText`: Description of the claim

Optional columns:
- `DateOfIncident`: When the incident occurred
- `ClaimAmount`: Monetary amount of the claim
- `PolicyNumber`: Insurance policy number
- `ContactEmail`: Claimant's email
- `SupportingDocs`: List of supporting documents
- `MedicalCodes`: Relevant medical codes
- `Location`: Geographic location (lat,long)
- `TransactionHashes`: Blockchain transaction hashes

## 🎯 Agent Descriptions

1. **Social Analyst Pro**: Analyzes social media patterns and inconsistencies
2. **Network Threat Intel**: Examines network patterns and IP reputation
3. **Blockchain Forensics**: Analyzes cryptocurrency transactions
4. **Medical Claims Expert**: Evaluates medical procedure consistency
5. **Geospatial Analyst**: Verifies location and weather data
6. **Decision Engine Pro**: Makes final determinations based on all agents

## 🔒 Security Considerations

- API keys are stored in environment variables
- CORS is configured for development (configure for production)
- File uploads are validated for type and size
- Results are stored temporarily and can be cleaned up

## 🚀 Deployment

### Production Considerations
1. Set up proper CORS origins
2. Use a production WSGI server (e.g., Gunicorn)
3. Set up SSL/TLS certificates
4. Configure environment variables securely
5. Set up file storage (S3, etc.) for uploads
6. Add database for persistent storage
7. Set up monitoring and logging

### Docker Deployment (Optional)
You can containerize the application using Docker for easier deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Ensure your OpenAI API key is correctly configured
3. Verify all dependencies are installed
4. Check the API documentation at `/docs`

## 🎉 Acknowledgments

- OpenAI for the GPT models
- Microsoft AutoGen for the multi-agent framework
- The open-source community for the amazing tools and libraries

---

Built with ❤️ for the Corgi Hackathon

#!/bin/bash

# Corgi Fraud Detection System Startup Script
echo "🐕 Starting Corgi Fraud Detection System..."

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your OpenAI API key."
    exit 1
fi

# Start backend server in background
echo "🔧 Starting backend server..."
../.venv/bin/python backend/main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend server started successfully on http://localhost:8000"
else
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Corgi Fraud Detection System is now running!"
echo ""
echo "📊 Available endpoints:"
echo "   • Web Interface: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • Health Check: http://localhost:8000/health"
echo "   • Analyze Claim: POST http://localhost:8000/api/analyze-claim"
echo "   • Upload Excel: POST http://localhost:8000/api/upload-excel"
echo "   • Generate Template: GET http://localhost:8000/api/generate-template"
echo "   • Generate Sample Data: GET http://localhost:8000/api/generate-sample-data"
echo ""
echo "🛠️ System Features:"
echo "   • Multi-Agent Fraud Detection"
echo "   • Excel Batch Processing"
echo "   • Real-time Analytics"
echo "   • RESTful API"
echo "   • React Web Interface"
echo ""
echo "Press Ctrl+C to stop the system"

# Keep script running and handle cleanup
trap 'echo ""; echo "🛑 Stopping Corgi Fraud Detection System..."; kill $BACKEND_PID 2>/dev/null; exit 0' INT

# Wait for backend process
wait $BACKEND_PID

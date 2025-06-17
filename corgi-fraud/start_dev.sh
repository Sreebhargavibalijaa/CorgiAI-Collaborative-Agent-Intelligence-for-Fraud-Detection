#!/bin/bash

# Corgi Fraud Detection System - Development Server Starter

echo "🐕 Starting Corgi Fraud Detection System..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend (FastAPI)..."
    cd backend
    source venv/bin/activate
    python main.py &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend (React)..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Check if ports are available
if check_port 8000; then
    echo "⚠️  Port 8000 is already in use. Please stop the existing process or use a different port."
    exit 1
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Please stop the existing process or use a different port."
    exit 1
fi

# Start services
start_backend
sleep 3  # Give backend time to start
start_frontend

echo ""
echo "🎉 Services started successfully!"
echo ""
echo "📋 Access URLs:"
echo "   🌐 Frontend (Web App): http://localhost:3000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "🔑 Important Notes:"
echo "   • Add your OpenAI API key to the .env file for full functionality"
echo "   • Backend: FastAPI running on port 8000"
echo "   • Frontend: React development server on port 3000"
echo "   • Press Ctrl+C to stop both services"
echo ""
echo "✨ Ready to detect fraud with AI! 🕵️‍♂️"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Shutting down services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait

#!/bin/bash

# Corgi Fraud Detection System - Development Server Starter

echo "🐕 Starting Corgi Fraud Detection System..."

# Function to check if a port is in use
check_port() {
    nc -z localhost $1 2>/dev/null
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "🔄 Killing existing processes on port $port..."
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend (FastAPI)..."
    cd backend
    # Use the correct virtual environment path (one level up from corgi-fraud)
    ../../.venv/bin/python main.py &
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

# Check if ports are available and kill existing processes if needed
if check_port 8000; then
    echo "⚠️  Port 8000 is already in use. Attempting to free it..."
    kill_port 8000
    if check_port 8000; then
        echo "❌ Could not free port 8000. Please manually stop the process."
        exit 1
    fi
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Attempting to free it..."
    kill_port 3000
    if check_port 3000; then
        echo "❌ Could not free port 3000. Please manually stop the process."
        exit 1
    fi
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

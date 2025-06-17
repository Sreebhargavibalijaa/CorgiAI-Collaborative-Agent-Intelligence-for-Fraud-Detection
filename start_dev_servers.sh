#!/bin/bash

# Corgi Fraud Detection System - Development Startup Script

echo "🐕 Starting Corgi Fraud Detection System..."

# Start backend server
echo "Starting backend server..."
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle shutdown
trap 'echo "Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID

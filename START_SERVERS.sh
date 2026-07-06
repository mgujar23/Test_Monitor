#!/bin/bash

echo "╔═════════════════════════════════════════════════╗"
echo "║    Test Monitor - Starting Services            ║"
echo "╚═════════════════════════════════════════════════╝"
echo ""

# Kill any existing processes
echo "Stopping any existing services..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Start backend on port 3000
echo "Starting backend on port 3000..."
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 4

# Test backend
if curl -s http://localhost:3000/api/dashboard > /dev/null 2>&1; then
  echo "✓ Backend is responding"
else
  echo "✗ Backend failed to start"
  tail -10 /tmp/backend.log
  exit 1
fi

# Start frontend on port 5173
echo "Starting frontend on port 5173..."
npm run dev:ui > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 6

# Test frontend
if curl -s http://localhost:5173/ > /dev/null 2>&1; then
  echo "✓ Frontend is responding"
else
  echo "✗ Frontend failed to start"
  tail -10 /tmp/frontend.log
  exit 1
fi

echo ""
echo "╔═════════════════════════════════════════════════╗"
echo "║           Services Started Successfully        ║"
echo "╚═════════════════════════════════════════════════╝"
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop services"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID

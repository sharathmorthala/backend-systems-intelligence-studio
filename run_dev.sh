#!/bin/bash

cleanup() {
    echo "Stopping servers..."
    kill $VITE_PID 2>/dev/null
    kill $FASTAPI_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting Vite dev server on port 5173..."
cd "$(dirname "$0")"
npm run vite &
VITE_PID=$!

sleep 2

echo "Starting FastAPI server on port 5000..."
python -m uvicorn api.main:app --host 0.0.0.0 --port 5000 --reload &
FASTAPI_PID=$!

echo "Both servers started. Press Ctrl+C to stop."
echo "  - FastAPI (API + Proxy): http://0.0.0.0:5000"
echo "  - Vite (Frontend): http://127.0.0.1:5173"

wait

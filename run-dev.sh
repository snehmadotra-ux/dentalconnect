#!/usr/bin/env bash
set -e

echo "=========================================="
echo " 🦷 Starting DentalConnect Development "
echo "=========================================="

# 1. Start Docker containers (PostgreSQL, Redis, MinIO, ZITADEL)
DOCKER_CMD="docker"
if ! command -v docker &> /dev/null && command -v flatpak-spawn &> /dev/null; then
    DOCKER_CMD="flatpak-spawn --host docker"
fi

if $DOCKER_CMD --version &> /dev/null; then
    echo "Starting PostgreSQL, Redis, MinIO, and ZITADEL in Docker..."
    $DOCKER_CMD compose up -d db redis minio zitadel 2>/dev/null || echo "Note: Run with sudo if docker group isn't active in current subshell yet."
fi

# 2. Check and start FastAPI backend in background
echo "Starting FastAPI backend on 0.0.0.0:8000..."
cd /home/sneha/sneha/dentalconnect/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 3. Start Next.js frontend
echo "Starting Next.js frontend on port 3000..."
cd /home/sneha/sneha/dentalconnect/frontend
if ! command -v npm &> /dev/null && command -v flatpak-spawn &> /dev/null; then
    flatpak-spawn --host bash -c "cd /home/sneha/sneha/dentalconnect/frontend && npm run dev" &
else
    npm run dev &
fi
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "=========================================="
echo " DentalConnect is running!"
echo " Web Application:  http://localhost:3000"
echo " FastAPI Docs:     http://localhost:8000/docs"
echo " MinIO Console:    http://localhost:9001"
echo " Press Ctrl+C to stop both servers."
echo "=========================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait

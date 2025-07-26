#!/bin/bash
set -e

echo "Starting Wallet Web App..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from template..."
    cp .env.example .env
fi

# Start in development mode
if [ "${NODE_ENV}" = "production" ]; then
    echo "Starting in production mode..."
    npm run build
    npm start
else
    echo "Starting in development mode..."
    echo "Backend will run on port 3001"
    echo "Frontend will run on port 3000"
    echo ""
    echo "Starting mock services first..."
    npm run mocks &
    MOCKS_PID=$!
    
    # Wait for mocks to start
    sleep 3
    
    echo "Starting application..."
    npm run dev
    
    # Cleanup on exit
    trap "echo 'Stopping services...'; kill $MOCKS_PID 2>/dev/null || true" EXIT
fi

#!/bin/bash
set -e

echo "Running Wallet Web App tests..."

# Start mock services for testing
echo "Starting mock services..."
npm run mocks &
MOCKS_PID=$!

# Wait for services to start
sleep 3

# Run tests
echo "Running unit tests..."
npm test

echo "Running integration tests..."
npm run test:integration

echo "Running Postman collection tests..."
npm run postman

# Cleanup
echo "Stopping mock services..."
kill $MOCKS_PID 2>/dev/null || true

echo "✅ All tests completed!"

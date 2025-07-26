#!/bin/bash
set -e

echo "Installing Wallet Web App dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd src/frontend
npm install
cd ../..

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Create data directories
mkdir -p data/logs
mkdir -p test/mocks/data

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Run 'npm run mocks' to start mock services"

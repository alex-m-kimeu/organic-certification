#!/bin/bash

# Test Database Setup Script
# This script sets up a separate test database for the organic certification system

set -e  # Exit on any error

echo "🔧 Setting up separate test database..."

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "⚠️  .env.test file not found. Please create it with test database configuration."
    echo "Example .env.test:"
    echo "DATABASE_URL=postgresql://alex_kimeu:password@localhost:5433/organic_certification_test"
    echo "NODE_ENV=test"
    echo "PORT=8081"
    exit 1
fi

# Load test environment variables
set -a
source .env.test
set +a

echo "� Test Database Configuration:"
echo "  DATABASE_URL: $DATABASE_URL"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to project root to access docker-compose.yml
cd "$(dirname "$0")/../.."

echo "🐳 Starting test database container..."
docker compose up -d test-db

# Wait for test database to be ready
echo "⏳ Waiting for test database to be ready..."
timeout=30
while ! docker compose exec test-db pg_isready -U alex_kimeu -d organic_certification_test > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo "❌ Timeout waiting for test database to be ready"
        exit 1
    fi
    echo "  Waiting... ($timeout seconds remaining)"
    sleep 1
    timeout=$((timeout - 1))
done

echo "✅ Test database is ready!"

# Navigate back to backend directory
cd backend

echo "🔄 Running database migrations on test database..."
NODE_ENV=test npx prisma migrate deploy

echo "🌱 Generating Prisma client for test environment..."
NODE_ENV=test npx prisma generate

echo "📝 Seeding test database with initial data..."
NODE_ENV=test npx ts-node prisma/seed.ts

echo ""
echo "✅ Test database setup complete!"
echo ""
echo "📋 Test Database Information:"
echo "  Container: test-db"
echo "  Port: 5433"
echo "  Database: organic_certification_test"
echo "  Connection: postgresql://alex_kimeu:***@localhost:5433/organic_certification_test"
echo ""
echo "🧪 You can now run tests with:"
echo "  npm test                    # Run all tests"
echo "  npm run test:watch          # Run tests in watch mode"
echo "  npm run test:coverage       # Run tests with coverage"
echo ""
echo "🔧 Useful commands:"
echo "  docker compose logs test-db              # View test database logs"
echo "  docker compose stop test-db              # Stop test database"
echo "  docker compose down test-db              # Stop and remove test database"
echo "  docker compose exec test-db psql -U alex_kimeu -d organic_certification_test  # Connect to test DB"
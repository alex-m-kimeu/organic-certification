#!/bin/bash

# Test Database Setup Script
# This script sets up the test database for the organic certification system

echo "🔧 Setting up test database..."

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "⚠️  .env.test file not found. Copying from .env.test.example..."
    cp .env.test.example .env.test
    echo "📝 Please update the .env.test file with your test database credentials"
fi

# Load test environment variables
export $(cat .env.test | xargs)

echo "🗄️  Creating test database if it doesn't exist..."

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///g' | sed 's/\?.*//g')
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@//g' | sed 's/:.*//g')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*://g' | sed 's/\/.*//g')
DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\///g' | sed 's/:.*//g')
DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/.*://g' | sed 's/@.*//g')

# Create test database (this might fail if it already exists, which is fine)
PGPASSWORD=$DB_PASS createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database might already exist, continuing..."

echo "🔄 Running database migrations on test database..."

# Run migrations
npx prisma migrate deploy

echo "🌱 Generating Prisma client..."

# Generate Prisma client
npx prisma generate

echo "✅ Test database setup complete!"
echo ""
echo "You can now run tests with:"
echo "  npm test"
echo "  npm run test:watch"
echo "  npm run test:coverage"
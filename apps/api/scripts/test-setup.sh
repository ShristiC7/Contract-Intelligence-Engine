#!/bin/bash

# Contract Intelligence Engine - Test Setup Script
# This script sets up the testing environment and runs the test suite

set -e

echo "🚀 Setting up Contract Intelligence Engine Test Environment"

# Check if required tools are installed
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "📋 Checking dependencies..."
check_dependency "node"
check_dependency "pnpm"
check_dependency "docker"
check_dependency "docker-compose"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd apps/api
pnpm prisma:generate

# Start test services
echo "🐳 Starting test services..."
docker-compose -f docker-compose.test.yml up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🏥 Checking service health..."
if ! docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U test -d test_db; then
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

if ! docker-compose -f docker-compose.test.yml exec -T redis redis-cli ping; then
    echo "❌ Redis is not ready"
    exit 1
fi

echo "✅ All services are ready"

# Set environment variables
export NODE_ENV=test
export DATABASE_URL=postgresql://test:test@localhost:5432/test_db
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Run tests
echo "🧪 Running test suite..."

# Unit tests
echo "📝 Running unit tests..."
pnpm test:unit

# Integration tests
echo "🔗 Running integration tests..."
pnpm test:integration

# All tests with coverage
echo "📊 Running all tests with coverage..."
pnpm test:coverage

echo "✅ All tests completed successfully!"

# Optional: Run load tests if k6 is installed
if command -v k6 &> /dev/null; then
    echo "⚡ k6 is available. Would you like to run load tests? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🚀 Starting API server for load tests..."
        pnpm start &
        API_PID=$!
        
        # Wait for API to start
        sleep 5
        
        echo "⚡ Running load tests..."
        pnpm test:load
        
        # Stop API server
        kill $API_PID
        echo "✅ Load tests completed!"
    fi
else
    echo "ℹ️  k6 is not installed. Skipping load tests."
    echo "   To install k6:"
    echo "   - macOS: brew install k6"
    echo "   - Ubuntu: sudo apt-get install k6"
    echo "   - Windows: choco install k6"
fi

echo "🎉 Test setup and execution completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Unit tests: ✅"
echo "   - Integration tests: ✅"
echo "   - Coverage report: ✅"
echo "   - Load tests: $(if command -v k6 &> /dev/null; then echo "✅"; else echo "⏭️  (k6 not installed)"; fi)"
echo ""
echo "📁 Coverage report available at: apps/api/coverage/index.html"
echo "🐳 Test services are still running. To stop them:"
echo "   docker-compose -f docker-compose.test.yml down"

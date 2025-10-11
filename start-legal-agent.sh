#!/bin/bash

# Legal Agent System Startup Script
# This script starts the complete legal document analysis system

set -e

echo "🚀 Starting Legal Document Analysis System"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f "apps/api/src/legal-agent/.env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp apps/api/src/legal-agent/env.example apps/api/src/legal-agent/.env
    echo "📝 Please edit apps/api/src/legal-agent/.env and add your OPENAI_API_KEY"
    echo "   Then run this script again."
    exit 1
fi

# Check if OpenAI API key is set
if ! grep -q "OPENAI_API_KEY=sk-" apps/api/src/legal-agent/.env; then
    echo "❌ OPENAI_API_KEY not set in .env file"
    echo "   Please edit apps/api/src/legal-agent/.env and add your OpenAI API key"
    exit 1
fi

echo "✅ Environment configuration verified"

# Start the complete system
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.legal-agent.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

# Check PostgreSQL (legal DB)
if docker-compose -f docker-compose.legal-agent.yml exec -T postgres-legal pg_isready -U postgres -d legal_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL (legal DB) is ready"
else
    echo "❌ PostgreSQL (legal DB) is not ready"
    exit 1
fi

# Check PostgreSQL (main DB)
if docker-compose -f docker-compose.legal-agent.yml exec -T postgres pg_isready -U postgres -d contract_intelligence > /dev/null 2>&1; then
    echo "✅ PostgreSQL (main DB) is ready"
else
    echo "❌ PostgreSQL (main DB) is not ready"
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.legal-agent.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

# Check Legal Agent API
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Legal Agent API is ready"
else
    echo "⚠️  Legal Agent API is starting up..."
    sleep 5
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Legal Agent API is ready"
    else
        echo "❌ Legal Agent API failed to start"
        exit 1
    fi
fi

# Check Main API
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Main API is ready"
else
    echo "⚠️  Main API is starting up..."
    sleep 5
    if curl -f http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ Main API is ready"
    else
        echo "❌ Main API failed to start"
        exit 1
    fi
fi

# Check Web Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web Frontend is ready"
else
    echo "⚠️  Web Frontend is starting up..."
    sleep 5
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Web Frontend is ready"
    else
        echo "❌ Web Frontend failed to start"
        exit 1
    fi
fi

echo ""
echo "🎉 Legal Document Analysis System is ready!"
echo "=========================================="
echo ""
echo "📊 Service URLs:"
echo "   Web Frontend:    http://localhost:3000"
echo "   Main API:        http://localhost:4000"
echo "   Legal Agent API: http://localhost:8000"
echo "   API Health:      http://localhost:4000/health"
echo "   Legal Health:    http://localhost:8000/health"
echo ""
echo "🧪 Test the system:"
echo "   curl http://localhost:4000/health"
echo "   curl http://localhost:8000/health"
echo ""
echo "📚 API Documentation:"
echo "   Legal Agent API: http://localhost:8000/docs"
echo ""
echo "🛑 To stop the system:"
echo "   docker-compose -f docker-compose.legal-agent.yml down"
echo ""
echo "📋 To view logs:"
echo "   docker-compose -f docker-compose.legal-agent.yml logs -f"
echo ""
echo "✅ System startup complete!"

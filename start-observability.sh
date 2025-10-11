#!/bin/bash

echo "🚀 Starting Contract Intelligence Engine with Full Observability Stack"
echo "=================================================================="

# Check for .env file
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found. Please create one based on .env.example and add your OPENAI_API_KEY."
  exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY not set in .env file"
  exit 1
fi

echo "✅ Environment variables loaded"

# Start the full stack with observability
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.legal-agent.yml up --build -d

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 All services started successfully!"
  echo ""
  echo "📊 Observability Stack:"
  echo "  • Grafana Dashboard:     http://localhost:3001"
  echo "  • Prometheus Metrics:    http://localhost:9090"
  echo "  • Tempo Traces:          http://localhost:3200"
  echo "  • OTEL Collector:        http://localhost:4318"
  echo ""
  echo "🔧 Application Services:"
  echo "  • Node.js API:           http://localhost:4000"
  echo "  • Python Legal Agent:    http://localhost:8000"
  echo "  • PostgreSQL:            localhost:5432"
  echo "  • Redis:                 localhost:6379"
  echo ""
  echo "📈 Monitoring Features:"
  echo "  • Real-time metrics and dashboards"
  echo "  • Distributed tracing across services"
  echo "  • Automated alerting for performance issues"
  echo "  • RAGAS evaluation monitoring"
  echo "  • Contract analysis performance tracking"
  echo ""
  echo "🔍 Quick Health Checks:"
  echo "  curl http://localhost:4000/health"
  echo "  curl http://localhost:8000/health"
  echo ""
  echo "📋 To stop all services:"
  echo "  docker-compose -f docker-compose.legal-agent.yml down"
  echo ""
  echo "📚 For detailed setup instructions, see OBSERVABILITY_SETUP.md"
else
  echo "❌ Failed to start one or more services."
  echo "Check the logs with: docker-compose -f docker-compose.legal-agent.yml logs"
  exit 1
fi

# Contract Intelligence Engine - Observability Setup

This document describes the comprehensive observability stack integrated into the Contract Intelligence Engine, providing monitoring, tracing, and alerting for all components.

## 🎯 Overview

The observability stack includes:
- **OpenTelemetry Collector**: Centralized telemetry collection
- **Prometheus**: Metrics collection and storage
- **Grafana Tempo**: Distributed tracing
- **Grafana**: Visualization and dashboards
- **Custom Metrics**: Application-specific monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Node.js API   │    │  Python Legal    │    │   PostgreSQL    │
│                 │    │     Agent        │    │                 │
│  - Fastify      │    │  - FastAPI       │    │  - Prisma       │
│  - BullMQ       │    │  - LangChain     │    │  - pgvector     │
│  - Prisma       │    │  - RAGAS         │    │                 │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │  OpenTelemetry Collector  │
                    │                           │
                    │  - OTLP gRPC/HTTP         │
                    │  - Batch Processing       │
                    │  - Memory Limiting        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Prometheus           │
                    │                           │
                    │  - Metrics Storage        │
                    │  - Alerting Rules         │
                    │  - Service Discovery      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Grafana Tempo         │
                    │                           │
                    │  - Trace Storage          │
                    │  - Trace Search           │
                    │  - Trace Analysis         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │       Grafana             │
                    │                           │
                    │  - Dashboards             │
                    │  - Alerting               │
                    │  - Visualization          │
                    └───────────────────────────┘
```

## 📊 Metrics Collected

### Application Metrics
- **Request Rate**: HTTP requests per second by route
- **Latency**: P50, P95, P99 response times
- **Error Rate**: HTTP error rates by status code
- **Job Processing**: BullMQ job duration and success rates
- **Database Performance**: Query duration and connection counts

### Legal Agent Metrics
- **RAGAS Scores**: Faithfulness and answer relevancy
- **Clause Extraction**: Processing time and clause counts
- **Risk Scoring**: Risk level distribution
- **Vector Search**: Search performance and result counts

### Infrastructure Metrics
- **Cache Performance**: Hit rates and miss rates
- **Queue Depth**: Waiting, active, and delayed jobs
- **Resource Usage**: CPU, memory, and disk usage

## 🔍 Traces Collected

### Distributed Tracing
- **HTTP Requests**: Complete request lifecycle
- **Database Queries**: Prisma query execution
- **Job Processing**: BullMQ job execution
- **Legal Agent Calls**: Python service interactions
- **External API Calls**: OpenAI and other services

### Custom Spans
- **Contract Analysis**: End-to-end analysis pipeline
- **Clause Extraction**: Document processing steps
- **Risk Assessment**: Risk scoring operations
- **Vector Search**: Similarity search operations

## 🚨 Alerting Rules

### Service Health Alerts
- **High P95 Latency**: > 12 seconds for 5 minutes
- **High Error Rate**: > 10% for 5 minutes
- **Queue Backlog**: > 1000 waiting jobs
- **Database Issues**: High connection count or slow queries

### Legal Agent Alerts
- **RAGAS Score Below Threshold**: Faithfulness < 0.85
- **High Processing Latency**: > 15 seconds
- **Low Cache Hit Rate**: < 50% for 10 minutes

## 🎛️ Dashboards

### Service Observability Dashboard
- **Request Rate**: Real-time traffic visualization
- **P95 Latency**: Performance monitoring with thresholds
- **Queue Depth**: Job processing status
- **RAGAS Evaluation Scores**: Quality metrics
- **Embedding Cache Performance**: Cache efficiency
- **Legal Agent Performance**: Python service metrics
- **Database Performance**: Query and connection metrics
- **Job Processing Metrics**: BullMQ job statistics

## 🚀 Quick Start

### 1. Start the Observability Stack

```bash
# Start all services including observability
docker-compose -f docker-compose.legal-agent.yml up -d

# Or start just the observability stack
docker-compose -f docker-compose.legal-agent.yml up -d otel-collector prometheus tempo grafana
```

### 2. Access the Services

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Tempo**: http://localhost:3200
- **API**: http://localhost:4000
- **Legal Agent**: http://localhost:8000

### 3. View Dashboards

1. Open Grafana at http://localhost:3001
2. Navigate to "Dashboards" → "Contract Intelligence Engine - Service Observability"
3. Explore the various panels and metrics

## 🔧 Configuration

### Environment Variables

```bash
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=contract-intelligence-api
OTEL_SERVICE_VERSION=1.0.0

# Service Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contract_intelligence
REDIS_HOST=localhost
REDIS_PORT=6379
LEGAL_AGENT_URL=http://localhost:8000
OPENAI_API_KEY=sk-...
```

### Custom Metrics

The system exposes custom metrics for:
- Contract analysis performance
- Legal agent operations
- Cache hit rates
- Job processing statistics
- RAGAS evaluation scores

### Alerting Configuration

Alerts are configured in `alerting-rules.yaml` and can be customized for:
- Threshold values
- Alert duration
- Notification channels
- Severity levels

## 📈 Performance Targets

### Latency Targets
- **P95 API Response Time**: < 10 seconds
- **P95 Legal Agent Response**: < 15 seconds
- **P95 Database Queries**: < 5 seconds
- **Job Processing Time**: < 30 seconds

### Reliability Targets
- **Error Rate**: < 1%
- **RAGAS Faithfulness**: > 0.85
- **Cache Hit Rate**: > 50%
- **Queue Processing**: < 1000 waiting jobs

## 🔍 Troubleshooting

### Common Issues

1. **No Metrics in Grafana**
   - Check if OpenTelemetry Collector is running
   - Verify OTLP endpoint configuration
   - Check service health endpoints

2. **Missing Traces**
   - Ensure services are instrumented
   - Check trace sampling configuration
   - Verify Tempo is receiving data

3. **High Alert Noise**
   - Adjust alert thresholds
   - Increase alert duration
   - Review alert conditions

### Debug Commands

```bash
# Check service health
curl http://localhost:4000/health
curl http://localhost:8000/health

# Check metrics endpoints
curl http://localhost:9090/api/v1/targets
curl http://localhost:8889/metrics

# Check traces
curl http://localhost:3200/api/search
```

## 🎯 Best Practices

### Monitoring
- Set up proper alerting thresholds
- Monitor key business metrics
- Track performance trends
- Use dashboards for visualization

### Tracing
- Use meaningful span names
- Add relevant attributes
- Trace critical paths
- Monitor trace sampling rates

### Metrics
- Use appropriate metric types
- Add meaningful labels
- Monitor cardinality
- Set up proper aggregation

## 🔮 Future Enhancements

- **Log Aggregation**: Integrate with Loki or ELK stack
- **Advanced Alerting**: Add PagerDuty/Slack integration
- **Custom Dashboards**: Create business-specific views
- **Performance Testing**: Integrate with load testing tools
- **Cost Monitoring**: Track resource usage and costs

## 📚 Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Grafana Tempo Documentation](https://grafana.com/docs/tempo/)

---

This observability stack provides comprehensive monitoring and alerting for the Contract Intelligence Engine, ensuring reliable operation and performance optimization.



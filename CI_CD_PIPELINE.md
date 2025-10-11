# CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for the Contract Intelligence Engine with Legal Agent integration. The pipeline includes testing, AI evaluation, building, and deployment to multiple platforms.

## 🚀 Pipeline Stages

### 1. Test Job

**Triggers**: Push to main/develop, Pull requests
**Requirements**: 80% code coverage threshold

#### Features:
- **Jest Unit Tests**: TypeScript unit tests with coverage reporting
- **Integration Tests**: Full API and database integration testing
- **k6 Load Tests**: Performance validation with 50 VUs
- **Coverage Threshold**: Enforces 80% minimum coverage
- **Test Artifacts**: Uploads coverage reports and test results

#### Coverage Requirements:
```yaml
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### 2. AI Evaluation Job

**Triggers**: Push to main/develop (after test job passes)
**Requirements**: RAGAS faithfulness ≥ 0.85

#### Features:
- **RAGAS Evaluation**: Automated AI performance assessment
- **Faithfulness Threshold**: Gates deployment on ≥ 0.85 score
- **Golden Set Testing**: Uses curated test dataset
- **Python Environment**: Full legal agent testing
- **Evaluation Artifacts**: Uploads evaluation results

#### Evaluation Metrics:
- **Faithfulness**: Measures grounding in provided context
- **Answer Relevancy**: Measures relevance to questions
- **Threshold**: 0.85 minimum faithfulness score

### 3. Build Job

**Triggers**: Push to main (after test and eval jobs pass)
**Output**: Docker images with semantic tags

#### Features:
- **Multi-Architecture Builds**: linux/amd64, linux/arm64
- **Semantic Tagging**: Git SHA + 'latest' tags
- **Container Registry**: GitHub Container Registry (GHCR)
- **Build Caching**: GitHub Actions cache for faster builds
- **Multi-Service**: API, Legal Agent, and Web images

#### Image Tags:
```bash
# Examples
ghcr.io/your-org/contract-intelligence-engine:latest
ghcr.io/your-org/contract-intelligence-engine:abc123def
ghcr.io/your-org/contract-intelligence-engine-legal-agent:latest
ghcr.io/your-org/contract-intelligence-engine-web:latest
```

### 4. Deploy Job

**Triggers**: Push to main (after build job completes)
**Targets**: Railway, Render, Kubernetes

#### Features:
- **Multi-Platform Deployment**: Railway, Render, Kubernetes
- **Environment Variables**: Automatic env var updates
- **Health Checks**: Post-deployment validation
- **Rollback Support**: Automatic rollback on failure
- **Monitoring**: Deployment status notifications

#### Deployment Targets:

##### Railway
```bash
# Environment variables updated
API_IMAGE=ghcr.io/org/repo:abc123def
LEGAL_AGENT_IMAGE=ghcr.io/org/repo-legal-agent:abc123def
WEB_IMAGE=ghcr.io/org/repo-web:abc123def
GIT_SHA=abc123def
BUILD_TIME=2024-01-01T12:00:00Z
```

##### Render
```bash
# Service environment variables updated via API
# Automatic deployment triggered
```

##### Kubernetes
```bash
# Deployment manifests applied
# Image tags updated
# Rollout status monitored
```

## 🔧 Configuration

### Required Secrets

#### GitHub Secrets
```bash
# OpenAI API Key for legal agent
OPENAI_API_KEY=sk-your-key-here

# Railway deployment
RAILWAY_TOKEN=your-railway-token
RAILWAY_SERVICE_ID=your-service-id

# Render deployment
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-render-service-id

# Kubernetes deployment
KUBECONFIG=your-kubeconfig

# Security scanning
SNYK_TOKEN=your-snyk-token
```

#### Environment Variables
```bash
# API Configuration
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis
REDIS_PORT=6379

# Legal Agent
LEGAL_AGENT_URL=http://legal-agent:8000
OPENAI_API_KEY=sk-your-key-here
FAITHFULNESS_THRESHOLD=0.85
```

### Coverage Configuration

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
```

#### Package.json Scripts
```json
{
  "scripts": {
    "test:coverage": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":80,\"functions\":80,\"lines\":80,\"statements\":80}}'"
  }
}
```

## 📊 Monitoring & Metrics

### Test Metrics
- **Coverage**: Lines, branches, functions, statements
- **Performance**: k6 load test results
- **Integration**: API endpoint testing
- **Unit Tests**: Individual component testing

### AI Evaluation Metrics
- **Faithfulness**: 0.85+ threshold
- **Answer Relevancy**: Quality assessment
- **Golden Set**: Curated test dataset
- **Performance**: Response time and accuracy

### Deployment Metrics
- **Build Time**: Docker image build duration
- **Deployment Time**: Service deployment duration
- **Health Checks**: Post-deployment validation
- **Rollback Rate**: Failed deployment frequency

## 🛡️ Security

### Security Scanning
- **Trivy**: Container vulnerability scanning
- **Snyk**: Dependency vulnerability scanning
- **SARIF**: Security results uploaded to GitHub
- **Thresholds**: High severity vulnerabilities block deployment

### Secrets Management
- **GitHub Secrets**: Encrypted secret storage
- **Environment Variables**: Secure env var injection
- **Container Registry**: Private image registry
- **Access Control**: Role-based deployment permissions

## 🚨 Failure Handling

### Test Failures
```bash
# Coverage below 80%
❌ Coverage 75% is below 80% threshold
# Solution: Add more tests or improve existing coverage

# k6 load test failures
❌ 95th percentile response time > 10s
# Solution: Optimize performance or adjust thresholds
```

### AI Evaluation Failures
```bash
# RAGAS faithfulness below threshold
❌ RAGAS evaluation failed - faithfulness below 0.85 threshold
# Solution: Improve agent prompts or training data
```

### Build Failures
```bash
# Docker build failures
❌ Build failed: Dockerfile syntax error
# Solution: Fix Dockerfile or build context issues
```

### Deployment Failures
```bash
# Health check failures
❌ Deployment failed: Health check timeout
# Solution: Check service configuration or dependencies
```

## 🔄 Rollback Procedures

### Automatic Rollback
- **Health Check Failures**: Automatic rollback to previous version
- **Deployment Timeout**: Automatic rollback after timeout
- **Error Rate Threshold**: Rollback on high error rates

### Manual Rollback
```bash
# Railway
railway rollback --service your-service-id

# Render
curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$SERVICE_ID/rollback

# Kubernetes
kubectl rollout undo deployment/contract-intelligence-api
```

## 📈 Performance Optimization

### Build Optimization
- **Multi-stage Builds**: Optimized Docker images
- **Build Caching**: GitHub Actions cache
- **Parallel Builds**: Multi-architecture builds
- **Layer Caching**: Docker layer optimization

### Test Optimization
- **Parallel Testing**: Concurrent test execution
- **Test Caching**: Jest and dependency caching
- **Selective Testing**: Only run relevant tests
- **Test Splitting**: Distribute tests across runners

### Deployment Optimization
- **Blue-Green Deployment**: Zero-downtime deployments
- **Canary Releases**: Gradual rollout
- **Health Checks**: Fast failure detection
- **Resource Optimization**: Efficient resource usage

## 🎯 Best Practices

### Code Quality
- **Coverage Thresholds**: Enforce minimum coverage
- **Linting**: Automated code quality checks
- **Type Safety**: TypeScript strict mode
- **Security Scanning**: Regular vulnerability assessment

### Testing Strategy
- **Unit Tests**: Fast, isolated component tests
- **Integration Tests**: Full system testing
- **Load Tests**: Performance validation
- **AI Evaluation**: Automated quality assessment

### Deployment Strategy
- **Infrastructure as Code**: Declarative configuration
- **Environment Parity**: Consistent environments
- **Monitoring**: Comprehensive observability
- **Documentation**: Clear deployment procedures

## 📚 Troubleshooting

### Common Issues

#### Coverage Issues
```bash
# Check coverage locally
pnpm test:coverage

# View detailed coverage report
open apps/api/coverage/index.html
```

#### AI Evaluation Issues
```bash
# Test legal agent locally
cd apps/api/src/legal-agent
python legal_agent.py

# Check OpenAI API key
echo $OPENAI_API_KEY
```

#### Build Issues
```bash
# Test Docker build locally
docker build -t test-image apps/api

# Check Dockerfile syntax
docker build --no-cache apps/api
```

#### Deployment Issues
```bash
# Check service health
curl -f https://your-api.com/health

# View deployment logs
railway logs --service your-service-id
```

### Debug Commands
```bash
# Local testing
pnpm test:coverage
pnpm test:integration
pnpm test:load

# Docker testing
docker-compose -f docker-compose.legal-agent.yml up -d
docker-compose -f docker-compose.legal-agent.yml logs -f

# Deployment testing
railway status
render service list
kubectl get pods
```

## 🔮 Future Enhancements

### Planned Features
- **Multi-Environment**: Staging and production pipelines
- **Feature Flags**: Gradual feature rollouts
- **A/B Testing**: Automated experimentation
- **Cost Optimization**: Resource usage optimization

### Monitoring Improvements
- **Real-time Metrics**: Live performance monitoring
- **Alerting**: Proactive issue detection
- **Dashboards**: Comprehensive observability
- **Log Aggregation**: Centralized logging

---

This CI/CD pipeline ensures high-quality, secure, and reliable deployments while maintaining comprehensive testing and evaluation standards.

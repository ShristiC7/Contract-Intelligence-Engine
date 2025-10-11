# Contract Intelligence Engine - Testing Suite

This directory contains comprehensive tests for the Contract Intelligence Engine API, including unit tests, integration tests, and load tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── clause-extraction.test.ts
│   └── risk-scoring.test.ts
├── integration/             # Integration tests
│   └── contracts-api.test.ts
├── load/                    # Load tests (k6)
│   └── contract-analysis.js
├── utils/                   # Test utilities
│   └── test-helpers.ts
├── setup.ts                 # Global test setup
└── README.md               # This file
```

## Test Types

### Unit Tests
- **Clause Extraction**: Tests text processing, OCR functionality, and clause identification with mock embeddings
- **Risk Scoring**: Tests risk calculation logic with comprehensive fixtures and edge cases

### Integration Tests
- **API Endpoints**: Tests full HTTP request/response cycles
- **Database Operations**: Tests Prisma operations with real database
- **Workflow Simulation**: Tests complete contract analysis workflows

### Load Tests
- **Performance Testing**: Uses k6 to simulate realistic load
- **Thresholds**: 95th percentile < 10s, <1% error rate
- **Ramp Pattern**: 0→50 VUs over 2 minutes

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Start required services
docker-compose up -d postgres redis
```

### Unit Tests
```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

### Integration Tests
```bash
# Run integration tests (requires database)
pnpm test:integration
```

### Load Tests
```bash
# Install k6 (if not already installed)
# macOS: brew install k6
# Ubuntu: sudo apt-get install k6
# Windows: choco install k6

# Start the API server
pnpm start

# Run load tests
pnpm test:load
```

### All Tests
```bash
# Run complete test suite
pnpm test
```

## Test Configuration

### Jest Configuration
- **Preset**: ts-jest with ESM support
- **Environment**: Node.js
- **Timeout**: 30 seconds
- **Coverage**: HTML, LCOV, and text reports

### Testcontainers
- **PostgreSQL**: pgvector/pgvector:pg15
- **Redis**: redis:7-alpine
- **Automatic cleanup**: Containers are stopped after tests

### k6 Load Test Configuration
```javascript
stages: [
  { duration: '2m', target: 50 }, // Ramp up
  { duration: '5m', target: 50 }, // Sustained load
  { duration: '2m', target: 0 },  // Ramp down
]
thresholds: {
  http_req_duration: ['p(95)<10000'], // 95th percentile < 10s
  http_req_failed: ['rate<0.01'],     // Error rate < 1%
}
```

## Test Data and Fixtures

### Contract Fixtures
- **Simple Contract**: Basic contract with minimal clauses
- **Complex Contract**: Multi-clause contract with various risk levels
- **High-Risk Contract**: Contract with penalty clauses and high-risk terms

### Clause Fixtures
- **Termination**: Standard termination clause (risk: 3.5)
- **Liability**: Liability limitation clause (risk: 4.2)
- **Indemnification**: Indemnification clause (risk: 7.5)

### Mock Data
- **Embeddings**: 1536-dimensional vectors for testing
- **OCR Text**: Realistic contract text for processing
- **Risk Scores**: Pre-calculated risk scores for validation

## CI/CD Integration

### GitHub Actions
The test suite runs automatically on:
- Push to main/develop branches
- Pull requests to main/develop branches

### Test Stages
1. **Unit Tests**: Fast, isolated tests
2. **Integration Tests**: Database and API tests
3. **Load Tests**: Performance validation (main branch only)
4. **Docker Tests**: Containerized test environment

### Coverage Reporting
- **Codecov**: Automatic coverage reporting
- **Thresholds**: Minimum coverage requirements
- **Reports**: HTML and LCOV formats

## Test Utilities

### TestHelpers Class
```typescript
const helpers = new TestHelpers(prisma);

// Create test data
const contract = await helpers.createTestContract();
const clauses = await helpers.createTestClauses(contract.id);

// Cleanup
await helpers.cleanup();
```

### Mock Redis Client
```typescript
const mockRedis = new MockRedisClient();
// Use in tests that don't require real Redis
```

### Test Fixtures
```typescript
import { testFixtures } from './utils/test-helpers';

const contract = testFixtures.contracts.complex;
const clause = testFixtures.clauses.termination;
```

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Test names should explain what's being tested
3. **Single Responsibility**: One assertion per test concept
4. **Mock External Dependencies**: Use mocks for external services

### Test Data
1. **Use Fixtures**: Consistent test data across tests
2. **Cleanup**: Always clean up test data
3. **Isolation**: Tests should not depend on each other
4. **Realistic Data**: Use realistic test data when possible

### Performance
1. **Parallel Execution**: Tests run in parallel when possible
2. **Fast Feedback**: Unit tests should be fast
3. **Resource Management**: Properly manage database connections
4. **Timeout Handling**: Appropriate timeouts for different test types

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Check connection string
echo $DATABASE_URL
```

#### Redis Connection Errors
```bash
# Ensure Redis is running
docker-compose up -d redis

# Test connection
redis-cli ping
```

#### k6 Load Test Failures
```bash
# Ensure API server is running
pnpm start

# Check API health
curl http://localhost:4000/health
```

#### Test Timeout Issues
- Increase timeout in jest.config.js
- Check for hanging database connections
- Verify proper cleanup in afterAll hooks

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* pnpm test

# Run specific test file
pnpm test clause-extraction.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="risk scoring"
```

## Contributing

When adding new tests:

1. **Follow Naming Conventions**: Use descriptive test names
2. **Add to Appropriate Category**: Unit, integration, or load tests
3. **Update Fixtures**: Add new test data as needed
4. **Document New Utilities**: Update this README
5. **Ensure CI Passes**: All tests must pass in CI

## Performance Benchmarks

### Current Targets
- **API Response Time**: < 2s for most endpoints
- **Contract Analysis**: < 10s for typical contracts
- **Load Test**: 50 concurrent users
- **Error Rate**: < 1% under load
- **Coverage**: > 80% code coverage

### Monitoring
- **k6 Metrics**: Response times, error rates, throughput
- **Jest Coverage**: Line, branch, function, and statement coverage
- **Database Performance**: Query execution times
- **Memory Usage**: Heap and memory leak detection

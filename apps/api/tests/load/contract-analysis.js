import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const contractUploadDuration = new Trend('contract_upload_duration');
const statusCheckDuration = new Trend('status_check_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Ramp up to 50 VUs over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 VUs for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 VUs over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95th percentile < 10 seconds
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    errors: ['rate<0.01'],              // Custom error rate < 1%
    contract_upload_duration: ['p(95)<10000'],
    status_check_duration: ['p(95)<5000'],
  },
};

// Base URL for the API
const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

// Test data
const testContractContent = `This is a test contract for load testing purposes.
It contains various clauses and terms that would typically be found in a legal document.
The contract includes liability clauses, termination terms, and payment conditions.
This content is designed to simulate a real contract for testing the contract analysis system.`;

export function setup() {
  // Setup phase - create a test contract for status polling
  const formData = {
    file: http.file(testContractContent, 'test-contract.pdf', 'application/pdf')
  };
  
  const response = http.post(`${BASE_URL}/contracts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  if (response.status === 201) {
    const contract = JSON.parse(response.body);
    return { contractId: contract.id };
  }
  
  return { contractId: null };
}

export default function (data) {
  const contractId = data.contractId;
  
  // Test 1: Upload a new contract
  const uploadStart = Date.now();
  const formData = {
    file: http.file(testContractContent, `contract-${__VU}-${__ITER}.pdf`, 'application/pdf')
  };
  
  const uploadResponse = http.post(`${BASE_URL}/contracts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  const uploadDuration = Date.now() - uploadStart;
  contractUploadDuration.add(uploadDuration);
  
  const uploadSuccess = check(uploadResponse, {
    'contract upload status is 201': (r) => r.status === 201,
    'contract upload response time < 10s': (r) => r.timings.duration < 10000,
    'contract upload has valid response': (r) => {
      try {
        const contract = JSON.parse(r.body);
        return contract.id && contract.filename && contract.status;
      } catch (e) {
        return false;
      }
    }
  });
  
  if (!uploadSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  
  // Test 2: List contracts
  const listResponse = http.get(`${BASE_URL}/contracts`);
  
  check(listResponse, {
    'contract list status is 200': (r) => r.status === 200,
    'contract list response time < 5s': (r) => r.timings.duration < 5000,
    'contract list has valid structure': (r) => {
      try {
        const result = JSON.parse(r.body);
        return result.items && Array.isArray(result.items) && typeof result.hasMore === 'boolean';
      } catch (e) {
        return false;
      }
    }
  });
  
  // Test 3: Trigger contract analysis (if we have a contract ID)
  if (contractId) {
    const analyzeResponse = http.post(`${BASE_URL}/contracts/${contractId}/analyze`, JSON.stringify({
      filePath: '/test/path/contract.pdf'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    check(analyzeResponse, {
      'contract analysis status is 200': (r) => r.status === 200,
      'contract analysis response time < 5s': (r) => r.timings.duration < 5000,
      'contract analysis has job ID': (r) => {
        try {
          const result = JSON.parse(r.body);
          return result.jobId && result.contractId;
        } catch (e) {
          return false;
        }
      }
    });
  }
  
  // Test 4: Check job status (if we have a contract ID)
  if (contractId) {
    const statusStart = Date.now();
    const statusResponse = http.get(`${BASE_URL}/status/test-job-id`);
    const statusDuration = Date.now() - statusStart;
    statusCheckDuration.add(statusDuration);
    
    // We expect 404 for non-existent job, which is valid behavior
    check(statusResponse, {
      'status check response time < 5s': (r) => r.timings.duration < 5000,
      'status check returns valid response': (r) => r.status === 404 || r.status === 200
    });
  }
  
  // Test 5: Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 1s': (r) => r.timings.duration < 1000,
    'health check returns ok': (r) => {
      try {
        const result = JSON.parse(r.body);
        return result.status === 'ok';
      } catch (e) {
        return false;
      }
    }
  });
  
  // Random sleep between 1-3 seconds to simulate real user behavior
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  // Cleanup phase - could be used to clean up test data
  console.log('Load test completed');
}
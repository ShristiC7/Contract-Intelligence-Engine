/**
 * OpenTelemetry Telemetry Configuration
 * Provides comprehensive observability for the Contract Intelligence Engine
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { trace, metrics, context, SpanStatusCode } from '@opentelemetry/api';

// Initialize SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'contract-intelligence-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'contract-intelligence',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
    }),
    exportIntervalMillis: 10000,
  }),
  instrumentations: [
    new HttpInstrumentation({
      requestHook: (span, request) => {
        span.setAttributes({
          'http.request.body.size': request.headers['content-length'] || 0,
        });
      },
      responseHook: (span, response) => {
        span.setAttributes({
          'http.response.body.size': response.headers['content-length'] || 0,
        });
      },
    }),
    new FastifyInstrumentation({
      requestHook: (span, info) => {
        span.setAttributes({
          'fastify.route': info.route?.path || 'unknown',
          'fastify.method': info.request.method,
        });
      },
    }),
    new PrismaInstrumentation({
      middleware: true,
    }),
  ],
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

// Custom metrics
const meter = metrics.getMeter('contract-intelligence-metrics');

export const jobDurationHistogram = meter.createHistogram('job.duration', {
  description: 'Duration of BullMQ job processing',
  unit: 'ms',
});

export const embeddingCacheHitCounter = meter.createCounter('embedding.cache.hits', {
  description: 'Embedding cache hit count',
});

export const embeddingCacheMissCounter = meter.createCounter('embedding.cache.misses', {
  description: 'Embedding cache miss count',
});

export const contractAnalysisCounter = meter.createCounter('contract.analysis.count', {
  description: 'Total contract analysis requests',
});

export const contractAnalysisDuration = meter.createHistogram('contract.analysis.duration', {
  description: 'Duration of contract analysis',
  unit: 'ms',
});

export const legalAgentRequestCounter = meter.createCounter('legal.agent.requests', {
  description: 'Legal agent API requests',
});

export const legalAgentRequestDuration = meter.createHistogram('legal.agent.request.duration', {
  description: 'Legal agent request duration',
  unit: 'ms',
});

export const ragasEvaluationScore = meter.createHistogram('ragas.evaluation.score', {
  description: 'RAGAS evaluation scores',
  unit: '1',
});

// Calculate cache hit rate
export const embeddingCacheHitRate = meter.createObservableGauge('embedding.cache.hit_rate', {
  description: 'Embedding cache hit rate',
});

let cacheHits = 0;
let cacheMisses = 0;

embeddingCacheHitRate.addCallback((result) => {
  const total = cacheHits + cacheMisses;
  const rate = total > 0 ? cacheHits / total : 0;
  result.observe(rate, { service_name: 'contract-intelligence-api' });
});

export function recordCacheHit() {
  cacheHits++;
  embeddingCacheHitCounter.add(1, { service_name: 'contract-intelligence-api' });
}

export function recordCacheMiss() {
  cacheMisses++;
  embeddingCacheMissCounter.add(1, { service_name: 'contract-intelligence-api' });
}

export function recordContractAnalysis(status: 'success' | 'error', duration: number) {
  contractAnalysisCounter.add(1, { 
    service_name: 'contract-intelligence-api',
    status 
  });
  contractAnalysisDuration.record(duration, { 
    service_name: 'contract-intelligence-api',
    status 
  });
}

export function recordLegalAgentRequest(status: 'success' | 'error', duration: number, endpoint: string) {
  legalAgentRequestCounter.add(1, { 
    service_name: 'contract-intelligence-api',
    status,
    endpoint 
  });
  legalAgentRequestDuration.record(duration, { 
    service_name: 'contract-intelligence-api',
    status,
    endpoint 
  });
}

export function recordRagasScore(scoreType: 'faithfulness' | 'answer_relevancy', score: number) {
  ragasEvaluationScore.record(score, { 
    service_name: 'legal-agent',
    score_type: scoreType 
  });
}

export const tracer = trace.getTracer('contract-intelligence-tracer');

// BullMQ job tracing wrapper
export function traceBullMQJob<T>(jobName: string, processor: (job: any) => Promise<T>) {
  return async (job: any): Promise<T> => {
    const startTime = Date.now();
    
    return tracer.startActiveSpan(`bullmq.job.${jobName}`, async (span) => {
      span.setAttribute('job.id', job.id);
      span.setAttribute('job.name', jobName);
      span.setAttribute('job.data', JSON.stringify(job.data));
      span.setAttribute('service.name', 'contract-intelligence-api');
      
      try {
        const result = await processor(job);
        const duration = Date.now() - startTime;
        
        jobDurationHistogram.record(duration, {
          job_name: jobName,
          status: 'success',
          service_name: 'contract-intelligence-api',
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        jobDurationHistogram.record(duration, {
          job_name: jobName,
          status: 'error',
          service_name: 'contract-intelligence-api',
        });
        
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  };
}

// Legal agent call tracing
export async function traceLegalAgentCall<T>(
  operation: string,
  attributes: Record<string, string | number>,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return tracer.startActiveSpan(`legal.agent.${operation}`, async (span) => {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
    span.setAttribute('service.name', 'contract-intelligence-api');
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      recordLegalAgentRequest('success', duration, operation);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      recordLegalAgentRequest('error', duration, operation);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// Contract analysis tracing
export async function traceContractAnalysis<T>(
  contractId: string,
  analysisType: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return tracer.startActiveSpan('contract.analysis', async (span) => {
    span.setAttribute('contract.id', contractId);
    span.setAttribute('analysis.type', analysisType);
    span.setAttribute('service.name', 'contract-intelligence-api');
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      recordContractAnalysis('success', duration);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      recordContractAnalysis('error', duration);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// Database operation tracing
export async function traceDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(`db.${operation}`, async (span) => {
    span.setAttribute('db.operation', operation);
    span.setAttribute('db.table', table);
    span.setAttribute('service.name', 'contract-intelligence-api');
    
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export default sdk;



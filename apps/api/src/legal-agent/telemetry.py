"""
OpenTelemetry Telemetry Configuration for Legal Agent
Provides comprehensive observability for the Python legal agent service
"""

import os
import time
from typing import Dict, Any, Callable, TypeVar
from functools import wraps

from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.openai import OpenAIInstrumentor
from opentelemetry.semantic_conventions.resource import ResourceAttributes

T = TypeVar('T')

# Initialize OpenTelemetry
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "legal-agent",
    ResourceAttributes.SERVICE_VERSION: "1.0.0",
    ResourceAttributes.SERVICE_NAMESPACE: "contract-intelligence",
    ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.getenv("NODE_ENV", "development"),
})

# Trace provider
trace_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(trace_provider)

# OTLP trace exporter
otlp_trace_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
)
trace_provider.add_span_processor(BatchSpanProcessor(otlp_trace_exporter))

# Metrics provider
metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/metrics")
    ),
    export_interval_millis=10000,
)
metrics_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
metrics.set_meter_provider(metrics_provider)

# Get tracer and meter
tracer = trace.get_tracer("legal-agent-tracer")
meter = metrics.get_meter("legal-agent-metrics")

# Custom metrics
ragas_faithfulness_histogram = meter.create_histogram(
    "ragas.faithfulness.score",
    description="RAGAS faithfulness evaluation scores",
    unit="1"
)

ragas_answer_relevancy_histogram = meter.create_histogram(
    "ragas.answer_relevancy.score", 
    description="RAGAS answer relevancy evaluation scores",
    unit="1"
)

legal_agent_request_counter = meter.create_counter(
    "legal.agent.requests",
    description="Legal agent API request count"
)

legal_agent_request_duration = meter.create_histogram(
    "legal.agent.request.duration",
    description="Legal agent request duration",
    unit="ms"
)

clause_extraction_counter = meter.create_counter(
    "clause.extraction.count",
    description="Clause extraction operations"
)

clause_extraction_duration = meter.create_histogram(
    "clause.extraction.duration",
    description="Clause extraction duration",
    unit="ms"
)

risk_scoring_counter = meter.create_counter(
    "risk.scoring.count",
    description="Risk scoring operations"
)

risk_scoring_duration = meter.create_histogram(
    "risk.scoring.duration",
    description="Risk scoring duration",
    unit="ms"
)

vector_search_counter = meter.create_counter(
    "vector.search.count",
    description="Vector similarity search operations"
)

vector_search_duration = meter.create_histogram(
    "vector.search.duration",
    description="Vector search duration",
    unit="ms"
)

# Initialize instrumentations
RequestsInstrumentor().instrument()
Psycopg2Instrumentor().instrument()
OpenAIInstrumentor().instrument()

def instrument_fastapi(app):
    """Instrument FastAPI application"""
    FastAPIInstrumentor.instrument_app(app)

def record_ragas_score(score_type: str, score: float):
    """Record RAGAS evaluation score"""
    if score_type == "faithfulness":
        ragas_faithfulness_histogram.record(score, {"service_name": "legal-agent"})
    elif score_type == "answer_relevancy":
        ragas_answer_relevancy_histogram.record(score, {"service_name": "legal-agent"})

def record_legal_agent_request(status: str, duration: float, endpoint: str):
    """Record legal agent request metrics"""
    legal_agent_request_counter.add(1, {
        "service_name": "legal-agent",
        "status": status,
        "endpoint": endpoint
    })
    legal_agent_request_duration.record(duration, {
        "service_name": "legal-agent", 
        "status": status,
        "endpoint": endpoint
    })

def record_clause_extraction(status: str, duration: float, clause_count: int):
    """Record clause extraction metrics"""
    clause_extraction_counter.add(1, {
        "service_name": "legal-agent",
        "status": status
    })
    clause_extraction_duration.record(duration, {
        "service_name": "legal-agent",
        "status": status,
        "clause_count": clause_count
    })

def record_risk_scoring(status: str, duration: float, risk_level: str):
    """Record risk scoring metrics"""
    risk_scoring_counter.add(1, {
        "service_name": "legal-agent",
        "status": status,
        "risk_level": risk_level
    })
    risk_scoring_duration.record(duration, {
        "service_name": "legal-agent",
        "status": status,
        "risk_level": risk_level
    })

def record_vector_search(status: str, duration: float, result_count: int):
    """Record vector search metrics"""
    vector_search_counter.add(1, {
        "service_name": "legal-agent",
        "status": status
    })
    vector_search_duration.record(duration, {
        "service_name": "legal-agent",
        "status": status,
        "result_count": result_count
    })

def trace_legal_agent_call(operation: str):
    """Decorator for tracing legal agent operations"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            start_time = time.time()
            
            with tracer.start_as_current_span(f"legal.agent.{operation}") as span:
                span.set_attribute("operation", operation)
                span.set_attribute("service.name", "legal-agent")
                
                try:
                    result = func(*args, **kwargs)
                    duration = (time.time() - start_time) * 1000  # Convert to ms
                    
                    record_legal_agent_request("success", duration, operation)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as error:
                    duration = (time.time() - start_time) * 1000
                    
                    record_legal_agent_request("error", duration, operation)
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
                    span.record_exception(error)
                    raise
                    
        return wrapper
    return decorator

def trace_clause_extraction(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator for tracing clause extraction operations"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> T:
        start_time = time.time()
        
        with tracer.start_as_current_span("clause.extraction") as span:
            span.set_attribute("service.name", "legal-agent")
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                # Extract clause count from result if possible
                clause_count = 0
                if isinstance(result, dict) and "num_clauses" in result:
                    clause_count = result["num_clauses"]
                elif isinstance(result, str):
                    try:
                        import json
                        data = json.loads(result)
                        clause_count = data.get("num_clauses", 0)
                    except:
                        pass
                
                record_clause_extraction("success", duration, clause_count)
                span.set_attribute("clause.count", clause_count)
                span.set_status(trace.Status(trace.StatusCode.OK))
                return result
            except Exception as error:
                duration = (time.time() - start_time) * 1000
                
                record_clause_extraction("error", duration, 0)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
                span.record_exception(error)
                raise
                
    return wrapper

def trace_risk_scoring(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator for tracing risk scoring operations"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> T:
        start_time = time.time()
        
        with tracer.start_as_current_span("risk.scoring") as span:
            span.set_attribute("service.name", "legal-agent")
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                # Extract risk level from result if possible
                risk_level = "unknown"
                if isinstance(result, dict) and "risk_level" in result:
                    risk_level = result["risk_level"]
                elif isinstance(result, str):
                    try:
                        import json
                        data = json.loads(result)
                        risk_level = data.get("risk_level", "unknown")
                    except:
                        pass
                
                record_risk_scoring("success", duration, risk_level)
                span.set_attribute("risk.level", risk_level)
                span.set_status(trace.Status(trace.StatusCode.OK))
                return result
            except Exception as error:
                duration = (time.time() - start_time) * 1000
                
                record_risk_scoring("error", duration, "error")
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
                span.record_exception(error)
                raise
                
    return wrapper

def trace_vector_search(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator for tracing vector search operations"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> T:
        start_time = time.time()
        
        with tracer.start_as_current_span("vector.search") as span:
            span.set_attribute("service.name", "legal-agent")
            
            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000
                
                # Extract result count from result if possible
                result_count = 0
                if isinstance(result, dict) and "num_results" in result:
                    result_count = result["num_results"]
                elif isinstance(result, str):
                    try:
                        import json
                        data = json.loads(result)
                        result_count = data.get("num_results", 0)
                    except:
                        pass
                elif isinstance(result, list):
                    result_count = len(result)
                
                record_vector_search("success", duration, result_count)
                span.set_attribute("result.count", result_count)
                span.set_status(trace.Status(trace.StatusCode.OK))
                return result
            except Exception as error:
                duration = (time.time() - start_time) * 1000
                
                record_vector_search("error", duration, 0)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
                span.record_exception(error)
                raise
                
    return wrapper

def trace_ragas_evaluation(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator for tracing RAGAS evaluation operations"""
    @wraps(func)
    def wrapper(*args, **kwargs) -> T:
        with tracer.start_as_current_span("ragas.evaluation") as span:
            span.set_attribute("service.name", "legal-agent")
            
            try:
                result = func(*args, **kwargs)
                
                # Record RAGAS scores if available
                if isinstance(result, dict):
                    if "faithfulness" in result:
                        record_ragas_score("faithfulness", result["faithfulness"])
                        span.set_attribute("ragas.faithfulness", result["faithfulness"])
                    
                    if "answer_relevancy" in result:
                        record_ragas_score("answer_relevancy", result["answer_relevancy"])
                        span.set_attribute("ragas.answer_relevancy", result["answer_relevancy"])
                
                span.set_status(trace.Status(trace.StatusCode.OK))
                return result
            except Exception as error:
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
                span.record_exception(error)
                raise
                
    return wrapper



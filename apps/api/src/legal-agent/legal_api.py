"""
FastAPI integration for the legal agent system
Provides REST API endpoints for the Node.js application
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
from legal_agent import Config, PgVectorStore, LegalReActAgent, LegalTools
from telemetry import instrument_fastapi

# Initialize FastAPI app
app = FastAPI(
    title="Legal Agent API",
    description="REST API for legal document analysis with ReAct agent",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for agent components
config = None
vector_store = None
agent = None
tools = None


class DocumentAnalysisRequest(BaseModel):
    document_text: str
    analysis_type: str = "comprehensive"  # comprehensive, clauses_only, risk_only


class ClauseSearchRequest(BaseModel):
    query: str
    limit: int = 5


class RiskScoreRequest(BaseModel):
    clause_text: str


class AnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize the legal agent system on startup"""
    global config, vector_store, agent, tools
    
    try:
        config = Config()
        if not config.openai_api_key:
            raise ValueError("OPENAI_API_KEY not set")
        
        vector_store = PgVectorStore(config)
        agent = LegalReActAgent(config, vector_store)
        tools = LegalTools(vector_store)
        
    # Instrument FastAPI for telemetry
    instrument_fastapi(app)
    
    print("✅ Legal agent system initialized successfully")
  except Exception as e:
    print(f"❌ Failed to initialize legal agent system: {e}")
    raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global vector_store
    if vector_store:
        vector_store.close()
        print("✅ Legal agent system shutdown complete")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "legal-agent-api",
        "version": "1.0.0"
    }


@app.post("/analyze/document", response_model=AnalysisResponse)
async def analyze_document(request: DocumentAnalysisRequest):
    """Analyze a legal document using the ReAct agent"""
    try:
        if not agent:
            raise HTTPException(status_code=500, detail="Agent not initialized")
        
        # Create analysis query based on type
        if request.analysis_type == "comprehensive":
            query = f"Analyze this legal document comprehensively: {request.document_text[:500]}..."
        elif request.analysis_type == "clauses_only":
            query = f"Extract and classify all clauses from this document: {request.document_text[:500]}..."
        elif request.analysis_type == "risk_only":
            query = f"Assess the risk level of clauses in this document: {request.document_text[:500]}..."
        else:
            query = f"Analyze this legal document: {request.document_text[:500]}..."
        
        # Run agent analysis
        result = agent.run(query)
        
        return AnalysisResponse(
            success=True,
            data={
                "analysis": result.get("output", ""),
                "analysis_type": request.analysis_type,
                "document_length": len(request.document_text)
            }
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


@app.post("/extract/clauses", response_model=AnalysisResponse)
async def extract_clauses(request: DocumentAnalysisRequest):
    """Extract clauses from a document"""
    try:
        if not tools:
            raise HTTPException(status_code=500, detail="Tools not initialized")
        
        result = tools.extract_clauses(request.document_text)
        data = json.loads(result)
        
        return AnalysisResponse(
            success=True,
            data=data
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


@app.post("/search/clauses", response_model=AnalysisResponse)
async def search_clauses(request: ClauseSearchRequest):
    """Search for similar clauses in the database"""
    try:
        if not tools:
            raise HTTPException(status_code=500, detail="Tools not initialized")
        
        result = tools.search_legal_db(request.query)
        data = json.loads(result)
        
        return AnalysisResponse(
            success=True,
            data=data
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


@app.post("/score/risk", response_model=AnalysisResponse)
async def score_risk(request: RiskScoreRequest):
    """Score the risk level of a clause"""
    try:
        if not tools:
            raise HTTPException(status_code=500, detail="Tools not initialized")
        
        result = tools.score_risk(request.clause_text)
        data = json.loads(result)
        
        return AnalysisResponse(
            success=True,
            data=data
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


@app.post("/clauses/add", response_model=AnalysisResponse)
async def add_clauses(clauses: List[Dict[str, Any]]):
    """Add clauses to the vector database"""
    try:
        if not vector_store:
            raise HTTPException(status_code=500, detail="Vector store not initialized")
        
        vector_store.add_clauses(clauses)
        
        return AnalysisResponse(
            success=True,
            data={
                "message": f"Added {len(clauses)} clauses to database",
                "count": len(clauses)
            }
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


@app.get("/clauses/search")
async def search_clauses_get(query: str, limit: int = 5):
    """Search clauses via GET request"""
    try:
        if not vector_store:
            raise HTTPException(status_code=500, detail="Vector store not initialized")
        
        results = vector_store.similarity_search(query, k=limit)
        
        return AnalysisResponse(
            success=True,
            data={
                "query": query,
                "results": results,
                "count": len(results)
            }
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


@app.get("/stats")
async def get_stats():
    """Get system statistics"""
    try:
        if not vector_store:
            raise HTTPException(status_code=500, detail="Vector store not initialized")
        
        # Get basic stats from database
        with vector_store.conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM legal_clauses")
            clause_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(DISTINCT document_id) FROM legal_clauses")
            document_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(DISTINCT clause_type) FROM legal_clauses")
            clause_type_count = cur.fetchone()[0]
        
        return AnalysisResponse(
            success=True,
            data={
                "total_clauses": clause_count,
                "total_documents": document_count,
                "clause_types": clause_type_count,
                "system_status": "operational"
            }
        )
    
    except Exception as e:
        return AnalysisResponse(
            success=False,
            data={},
            error=str(e)
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

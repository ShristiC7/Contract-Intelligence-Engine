/**
 * Legal Agent Service - Integration with Python ReAct Agent
 * Provides TypeScript interface to the Python legal analysis system
 */

import axios, { AxiosInstance } from 'axios';
import { traceLegalAgentCall, recordLegalAgentRequest } from '../telemetry';

export interface DocumentAnalysisRequest {
  document_text: string;
  analysis_type?: 'comprehensive' | 'clauses_only' | 'risk_only';
}

export interface ClauseSearchRequest {
  query: string;
  limit?: number;
}

export interface RiskScoreRequest {
  clause_text: string;
}

export interface AnalysisResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ExtractedClause {
  text: string;
  type: string;
  length: number;
}

export interface ClauseExtractionResult {
  num_clauses: number;
  clauses: ExtractedClause[];
  total_length: number;
}

export interface RiskAssessment {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  high_risk_indicators: number;
  medium_risk_indicators: number;
  low_risk_indicators: number;
  additional_risk_score: number;
  clause_preview: string;
  recommendation: string;
}

export interface SearchResult {
  clause: string;
  type: string;
  similarity: number;
  document_id: string;
}

export interface ClauseSearchResult {
  query: string;
  num_results: number;
  results: SearchResult[];
}

export class LegalAgentService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = process.env.LEGAL_AGENT_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if the legal agent service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Legal agent health check failed:', error);
      return false;
    }
  }

  /**
   * Analyze a legal document using the ReAct agent
   */
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<AnalysisResponse> {
    return traceLegalAgentCall('analyze-document', {
      analysis_type: request.analysis_type || 'comprehensive',
      document_length: request.document_text.length
    }, async () => {
      try {
        const response = await this.client.post('/analyze/document', request);
        return response.data;
      } catch (error) {
        console.error('Document analysis failed:', error);
        return {
          success: false,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Extract clauses from a document
   */
  async extractClauses(documentText: string): Promise<AnalysisResponse<ClauseExtractionResult>> {
    try {
      const response = await this.client.post('/extract/clauses', {
        document_text: documentText,
        analysis_type: 'clauses_only',
      });
      return response.data;
    } catch (error) {
      console.error('Clause extraction failed:', error);
      return {
        success: false,
        data: { num_clauses: 0, clauses: [], total_length: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for similar clauses in the database
   */
  async searchClauses(request: ClauseSearchRequest): Promise<AnalysisResponse<ClauseSearchResult>> {
    try {
      const response = await this.client.post('/search/clauses', request);
      return response.data;
    } catch (error) {
      console.error('Clause search failed:', error);
      return {
        success: false,
        data: { query: request.query, num_results: 0, results: [] },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Score the risk level of a clause
   */
  async scoreRisk(clauseText: string): Promise<AnalysisResponse<RiskAssessment>> {
    try {
      const response = await this.client.post('/score/risk', {
        clause_text: clauseText,
      });
      return response.data;
    } catch (error) {
      console.error('Risk scoring failed:', error);
      return {
        success: false,
        data: {
          risk_level: 'LOW',
          risk_score: 0,
          high_risk_indicators: 0,
          medium_risk_indicators: 0,
          low_risk_indicators: 0,
          additional_risk_score: 0,
          clause_preview: clauseText.substring(0, 150),
          recommendation: 'Unable to assess risk',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add clauses to the vector database
   */
  async addClauses(clauses: Array<{
    clause_text: string;
    document_id?: string;
    clause_type?: string;
    metadata?: Record<string, any>;
  }>): Promise<AnalysisResponse> {
    try {
      const response = await this.client.post('/clauses/add', clauses);
      return response.data;
    } catch (error) {
      console.error('Add clauses failed:', error);
      return {
        success: false,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get system statistics
   */
  async getStats(): Promise<AnalysisResponse<{
    total_clauses: number;
    total_documents: number;
    clause_types: number;
    system_status: string;
  }>> {
    try {
      const response = await this.client.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Get stats failed:', error);
      return {
        success: false,
        data: {
          total_clauses: 0,
          total_documents: 0,
          clause_types: 0,
          system_status: 'unknown',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Comprehensive document analysis with all features
   */
  async comprehensiveAnalysis(documentText: string): Promise<{
    extraction: AnalysisResponse<ClauseExtractionResult>;
    analysis: AnalysisResponse;
    riskScores: RiskAssessment[];
  }> {
    // Extract clauses first
    const extraction = await this.extractClauses(documentText);
    
    if (!extraction.success || !extraction.data.clauses.length) {
      return {
        extraction,
        analysis: { success: false, data: {}, error: 'No clauses extracted' },
        riskScores: [],
      };
    }

    // Get comprehensive analysis
    const analysis = await this.analyzeDocument({
      document_text: documentText,
      analysis_type: 'comprehensive',
    });

    // Score risk for each clause
    const riskScores: RiskAssessment[] = [];
    for (const clause of extraction.data.clauses) {
      const riskResult = await this.scoreRisk(clause.text);
      if (riskResult.success) {
        riskScores.push(riskResult.data);
      }
    }

    return {
      extraction,
      analysis,
      riskScores,
    };
  }
}

// Export singleton instance
export const legalAgentService = new LegalAgentService();

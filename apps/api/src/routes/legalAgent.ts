import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { legalAgentService } from '../services/legalAgentService';

const routes: FastifyPluginCallback = (app: FastifyInstance, _opts, done) => {
  // Health check for legal agent
  app.get('/legal-agent/health', async function handler() {
    try {
      const isHealthy = await legalAgentService.healthCheck();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'legal-agent',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'legal-agent',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });

  // Analyze document with legal agent
  app.post('/legal-agent/analyze', async function handler(req) {
    try {
      const { document_text, analysis_type = 'comprehensive' } = req.body as {
        document_text: string;
        analysis_type?: 'comprehensive' | 'clauses_only' | 'risk_only';
      };

      if (!document_text) {
        return this.httpErrors.badRequest('document_text is required');
      }

      const result = await legalAgentService.analyzeDocument({
        document_text,
        analysis_type
      });

      return result;
    } catch (error) {
      this.log.error('Legal agent analysis error:', error);
      return this.httpErrors.internalServerError('Analysis failed');
    }
  });

  // Extract clauses from document
  app.post('/legal-agent/extract-clauses', async function handler(req) {
    try {
      const { document_text } = req.body as { document_text: string };

      if (!document_text) {
        return this.httpErrors.badRequest('document_text is required');
      }

      const result = await legalAgentService.extractClauses(document_text);
      return result;
    } catch (error) {
      this.log.error('Clause extraction error:', error);
      return this.httpErrors.internalServerError('Clause extraction failed');
    }
  });

  // Search for similar clauses
  app.post('/legal-agent/search-clauses', async function handler(req) {
    try {
      const { query, limit = 5 } = req.body as {
        query: string;
        limit?: number;
      };

      if (!query) {
        return this.httpErrors.badRequest('query is required');
      }

      const result = await legalAgentService.searchClauses({ query, limit });
      return result;
    } catch (error) {
      this.log.error('Clause search error:', error);
      return this.httpErrors.internalServerError('Clause search failed');
    }
  });

  // Score risk of a clause
  app.post('/legal-agent/score-risk', async function handler(req) {
    try {
      const { clause_text } = req.body as { clause_text: string };

      if (!clause_text) {
        return this.httpErrors.badRequest('clause_text is required');
      }

      const result = await legalAgentService.scoreRisk(clause_text);
      return result;
    } catch (error) {
      this.log.error('Risk scoring error:', error);
      return this.httpErrors.internalServerError('Risk scoring failed');
    }
  });

  // Get system statistics
  app.get('/legal-agent/stats', async function handler() {
    try {
      const result = await legalAgentService.getStats();
      return result;
    } catch (error) {
      this.log.error('Stats retrieval error:', error);
      return this.httpErrors.internalServerError('Stats retrieval failed');
    }
  });

  // Comprehensive analysis endpoint
  app.post('/legal-agent/comprehensive-analysis', async function handler(req) {
    try {
      const { document_text } = req.body as { document_text: string };

      if (!document_text) {
        return this.httpErrors.badRequest('document_text is required');
      }

      const result = await legalAgentService.comprehensiveAnalysis(document_text);
      return result;
    } catch (error) {
      this.log.error('Comprehensive analysis error:', error);
      return this.httpErrors.internalServerError('Comprehensive analysis failed');
    }
  });

  done();
};

export default fp(routes, { name: 'legal-agent-routes' });

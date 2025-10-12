// Simple test server without Redis dependencies
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma';

const server = Fastify({ logger: true });

// Default route
server.get('/', async () => {
  return { message: 'Contract Intelligence Engine Backend Active' };
});

server.get('/health', async () => ({ status: 'ok' }));

// Basic contract routes without job queue
server.post('/contracts', async function handler(req, reply) {
  const mp = await (req as any).file?.();
  const filename: string = mp?.filename ?? 'unknown';
  
  const contract = {
    id: 'test-' + Date.now(),
    filename,
    uploadDate: new Date().toISOString(),
    status: 'uploaded'
  };
  
  return reply.code(201).send(contract);
});

server.get('/contracts', async function handler() {
  return {
    items: [],
    cursor: null,
    hasMore: false
  };
});

// Legal agent routes
server.get('/legal-agent/health', async function handler() {
  return {
    status: 'healthy',
    service: 'legal-agent',
    timestamp: new Date().toISOString()
  };
});

server.post('/legal-agent/analyze', async function handler(req) {
  const { document_text } = req.body as { document_text: string };
  
  if (!document_text) {
    return this.httpErrors.badRequest('document_text is required');
  }
  
  return {
    analysis: {
      summary: 'Test analysis completed',
      clauses: [],
      risks: [],
      confidence: 0.95
    }
  };
});

server.post('/legal-agent/extract-clauses', async function handler(req) {
  const { document_text } = req.body as { document_text: string };
  
  if (!document_text) {
    return this.httpErrors.badRequest('document_text is required');
  }
  
  return {
    clauses: [
      {
        type: 'liability',
        text: 'Sample liability clause',
        confidence: 0.9
      }
    ]
  };
});

server.post('/legal-agent/score-risk', async function handler(req) {
  const { clause_text } = req.body as { clause_text: string };
  
  if (!clause_text) {
    return this.httpErrors.badRequest('clause_text is required');
  }
  
  return {
    risk_score: 0.3,
    risk_level: 'LOW',
    factors: ['Standard language'],
    recommendations: ['No action required']
  };
});

server.get('/legal-agent/stats', async function handler() {
  return {
    total_documents: 0,
    total_clauses: 0,
    average_risk_score: 0.0,
    last_analysis: new Date().toISOString()
  };
});

// plugins
void server.register(cors, { origin: true });
void server.register(multipart);
void server.register(prismaPlugin);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

async function start() {
  try {
    await server.listen({ port, host });
    console.log(`Test server listening at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void start();

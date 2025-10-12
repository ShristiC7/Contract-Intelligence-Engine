import Fastify from 'fastify';
import cors from '@fastify/cors';

const server = Fastify({ logger: true });

// Register CORS
await server.register(cors, { origin: true });

// Default route
server.get('/', async () => {
  return { message: 'Contract Intelligence Engine Backend Active' };
});

server.get('/health', async () => ({ status: 'ok' }));

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

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

async function start() {
  try {
    await server.listen({ port, host });
    console.log(`Simple server listening at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void start();



// Initialize OpenTelemetry first
import './telemetry';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import contractsRoutes from './routes/contracts';
import legalAgentRoutes from './routes/legalAgent';
import { registerGraphQL } from './graphql';
import prismaPlugin from './plugins/prisma';

const server = Fastify({ logger: true });

// Register CORS
await server.register(cors, { origin: true });

// Default route
server.get('/', async () => {
  return { message: 'Contract Intelligence Engine Backend Active' };
});

server.get('/health', async () => ({ status: 'ok' }));

// plugins
void server.register(multipart);
void server.register(prismaPlugin);
void server.register(contractsRoutes);
void server.register(legalAgentRoutes);
registerGraphQL(server);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

async function start() {
  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void start();


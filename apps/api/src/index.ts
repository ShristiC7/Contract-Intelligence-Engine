import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));

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


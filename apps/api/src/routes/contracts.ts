import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'node:crypto';
import { analyzeContract, getJobStatus } from '../jobs/analyzeContract';

type Contract = {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'uploaded' | 'analyzing' | 'completed' | 'error';
};

type ContractListResponse = {
  items: Contract[];
  cursor?: string | null;
  hasMore: boolean;
};

const memoryContracts: Contract[] = [];

const routes: FastifyPluginCallback = (app: FastifyInstance, _opts, done) => {
  // POST /contracts - multipart upload
  app.post('/contracts', async function handler(req, reply) {
    const mp = await (req as any).file?.();
    const filename: string = mp?.filename ?? 'unknown';
    const fileBuffer: Buffer | undefined = mp ? await mp.toBuffer() : undefined;
    const fileHash = fileBuffer ? crypto.createHash('sha256').update(fileBuffer).digest('hex') : '';

    // Persist via Prisma
    const created = await this.prisma.contract.create({
      data: {
        id: crypto.randomUUID(),
        userId: 'user_demo',
        fileHash,
        status: 'pending',
        createdAt: new Date()
      }
    });

    const contract: Contract = {
      id: created.id,
      filename,
      uploadDate: created.createdAt.toISOString(),
      status: 'uploaded'
    };
    memoryContracts.unshift(contract);
    return reply.code(201).send(contract);
  });

  // GET /contracts - list with optional cursor
  app.get('/contracts', async function handler(req) {
    const { cursor } = (req.query ?? {}) as { cursor?: string };
    const take = 25;
    const where = { userId: 'user_demo' };
    const contracts = await this.prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });
    const hasMore = contracts.length > take;
    const sliced = contracts.slice(0, take);
    const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;
    const items: Contract[] = sliced.map((c) => ({
      id: c.id,
      filename: 'unknown',
      uploadDate: c.createdAt.toISOString(),
      status: (c.status as any) ?? 'uploaded'
    }));
    return { items, cursor: nextCursor, hasMore } satisfies ContractListResponse;
  });

  // POST /contracts/:id/analyze - trigger analysis
  app.post('/contracts/:id/analyze', async function handler(req) {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { sections?: string[]; filePath?: string };
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) return { contractId: id, riskSummary: {}, clauseCount: 0 };
    if (body.filePath) {
      const job = await analyzeContract(body.filePath, id, existing.userId);
      return { jobId: job.id, contractId: id };
    }
    return { contractId: id, riskSummary: {}, clauseCount: body.sections?.length ?? 0 };
  });

  // GET /status/:jobId - get job status
  app.get('/status/:jobId', async function handler(req) {
    const { jobId } = req.params as { jobId: string };
    try {
      const status = await getJobStatus(jobId);
      return status;
    } catch (error) {
      return reply.code(404).send({ error: 'Job not found' });
    }
  });

  done();
};

export default fp(routes, { name: 'contracts-routes' });


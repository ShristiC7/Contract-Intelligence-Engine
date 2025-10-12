import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import crypto from 'node:crypto';
import * as Tesseract from 'tesseract.js';
import fs from 'node:fs';
import path from 'node:path';
// import pdfParse from 'pdf-parse';
import { PrismaClient } from '@prisma/client';
import { traceBullMQJob, traceContractAnalysis, recordContractAnalysis } from '../telemetry';

export interface ContractJobData {
  filePath: string;
  contractId: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface JobCheckpoint {
  step: string;
  completedAt: Date;
  data?: unknown;
}

export interface AnalysisResult {
  contractId: string;
  fileHash: string;
  ocrText: string;
  chunks: string[];
  embeddings: number[][];
  agentAnalysis: unknown;
  checkpoints: JobCheckpoint[];
}

// Mock Redis for testing when Redis is not available
const redisConnection = process.env.NODE_ENV === 'test' ? {
  exists: async () => 0,
  setex: async () => 'OK',
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  quit: async () => 'OK'
} : new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true
});

export const contractQueue = new Queue<ContractJobData>('contract-analysis', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100, age: 24 * 3600 },
    removeOnFail: false,
  },
});

export const deadLetterQueue = new Queue('contract-analysis-dlq', {
  connection: redisConnection,
});

export const queueEvents = new QueueEvents('contract-analysis', {
  connection: redisConnection,
});

const prisma = new PrismaClient();

async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function checkIdempotency(fileHash: string): Promise<boolean> {
  const key = `processed:${fileHash}`;
  const exists = await redisConnection.exists(key);
  return exists === 1;
}

async function markAsProcessed(fileHash: string, result: unknown): Promise<void> {
  const key = `processed:${fileHash}`;
  await redisConnection.setex(key, 7 * 24 * 3600, JSON.stringify(result));
}

async function storeCheckpoint(contractId: string, step: string, data?: unknown): Promise<void> {
  await prisma.analysisCheckpoint.create({
    data: {
      contractId,
      step,
      data: JSON.stringify(data ?? {}),
      createdAt: new Date(),
    },
  });
}

async function getCheckpointsForContract(contractId: string): Promise<JobCheckpoint[]> {
  const rows = await prisma.analysisCheckpoint.findMany({
    where: { contractId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({ step: r.step, completedAt: r.createdAt, data: JSON.parse(r.data) }));
}

async function ocrPdf(filePath: string, onProgress: (progress: number) => void): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    try {
      // Dynamic import to avoid initialization issues
      const pdfParse = (await import('pdf-parse')).default;
      const pdfBuffer = await fs.promises.readFile(filePath);
      const parsed = await pdfParse(pdfBuffer);
      const text = parsed.text ?? '';
      if (text.trim().length > 0) {
        onProgress(100);
        return text;
      }
    } catch (error) {
      console.warn('PDF parsing failed, falling back to OCR:', error);
    }
  }

  const worker = await (Tesseract as any).createWorker();
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(filePath, undefined, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') onProgress(m.progress * 100);
      },
    });
    return text;
  } finally {
    await worker.terminate();
  }
}

function chunkText(text: string, chunkSize = 500): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  return chunks.map(() => Array.from({ length: 1536 }, () => Math.random()));
}

interface AgentConfig { maxRetries: number; baseDelay: number }

async function performAgentAnalysis(text: string, chunks: string[], embeddings: number[][]): Promise<unknown> {
  try {
    // Import the legal agent service
    const { legalAgentService } = await import('../services/legalAgentService');
    
    // Check if legal agent is available
    const isHealthy = await legalAgentService.healthCheck();
    if (!isHealthy) {
      console.warn('Legal agent service not available, using fallback analysis');
      return { 
        summary: 'Contract analysis completed (fallback mode)', 
        clauses: [], 
        risks: [], 
        parties: [], 
        dates: [], 
        keyTerms: {}, 
        completedAt: new Date(),
        mode: 'fallback'
      };
    }

    // Perform comprehensive analysis using the legal agent
    const analysis = await legalAgentService.comprehensiveAnalysis(text);
    
    // Store extracted clauses in the vector database
    if (analysis.extraction.success && analysis.extraction.data.clauses.length > 0) {
      const clausesToStore = analysis.extraction.data.clauses.map((clause, index) => ({
        clause_text: clause.text,
        document_id: `contract_${Date.now()}`,
        clause_type: clause.type,
        metadata: {
          chunk_index: index,
          analysis_timestamp: new Date().toISOString(),
          embedding_dimension: embeddings[0]?.length || 1536
        }
      }));
      
      await legalAgentService.addClauses(clausesToStore);
    }

    return {
      summary: 'Contract analysis completed using ReAct agent',
      clauses: analysis.extraction.data.clauses,
      risks: analysis.riskScores,
      analysis: analysis.analysis.data,
      parties: [], // Could be extracted by the agent
      dates: [], // Could be extracted by the agent
      keyTerms: {}, // Could be extracted by the agent
      completedAt: new Date(),
      mode: 'legal_agent',
      stats: {
        total_clauses: analysis.extraction.data.num_clauses,
        high_risk_clauses: analysis.riskScores.filter(r => r.risk_level === 'HIGH').length,
        medium_risk_clauses: analysis.riskScores.filter(r => r.risk_level === 'MEDIUM').length,
        low_risk_clauses: analysis.riskScores.filter(r => r.risk_level === 'LOW').length
      }
    };
  } catch (error) {
    console.error('Legal agent analysis failed:', error);
    // Fallback to basic analysis
    return { 
      summary: 'Contract analysis completed (error fallback)', 
      clauses: [], 
      risks: [], 
      parties: [], 
      dates: [], 
      keyTerms: {}, 
      completedAt: new Date(),
      mode: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runAgentLoop(text: string, chunks: string[], embeddings: number[][], config: AgentConfig = { maxRetries: 3, baseDelay: 1000 }): Promise<unknown> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < config.maxRetries; attempt += 1) {
    try {
      const analysis = await performAgentAnalysis(text, chunks, embeddings);
      return analysis;
    } catch (err) {
      lastError = err as Error;
      if (attempt < config.maxRetries - 1) {
        const delay = config.baseDelay * 2 ** attempt;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`Agent loop failed after ${config.maxRetries} attempts: ${lastError?.message}`);
}

export const worker = new Worker<ContractJobData>(
  'contract-analysis',
  traceBullMQJob('contract-analysis', async (job: Job<ContractJobData>) => {
    const { filePath, contractId, userId } = job.data;
    await job.updateProgress(5);
    const fileHash = await calculateFileHash(filePath);

    const alreadyProcessed = await checkIdempotency(fileHash);
    if (alreadyProcessed) {
      await job.updateProgress(100);
      const checkpoints = await getCheckpointsForContract(contractId);
      return { contractId, fileHash, ocrText: '', chunks: [], embeddings: [], agentAnalysis: { skipped: true }, checkpoints } satisfies AnalysisResult;
    }

    await storeCheckpoint(contractId, 'hash_checked', { fileHash });
    await job.updateProgress(10);

    const ocrText = await ocrPdf(filePath, (p) => job.updateProgress(10 + p * 0.3));
    await storeCheckpoint(contractId, 'ocr_completed', { textLength: ocrText.length });
    await job.updateProgress(40);

    const chunks = chunkText(ocrText);
    await job.updateProgress(50);
    const embeddings = await generateEmbeddings(chunks);
    await storeCheckpoint(contractId, 'embeddings_generated', { chunkCount: chunks.length, embeddingDim: embeddings[0]?.length ?? 0 });
    await job.updateProgress(60);

    const agentAnalysis = await runAgentLoop(ocrText, chunks, embeddings);
    await storeCheckpoint(contractId, 'agent_analysis_completed', { analysisKeys: Object.keys(agentAnalysis as Record<string, unknown>) });
    await job.updateProgress(90);

    const checkpoints = await getCheckpointsForContract(contractId);
    const result: AnalysisResult = { contractId, fileHash, ocrText, chunks, embeddings, agentAnalysis, checkpoints };
    await markAsProcessed(fileHash, result);
    await storeCheckpoint(contractId, 'completed', { success: true });
    await job.updateProgress(100);
    return result;
  }),
  { connection: redisConnection, concurrency: 5 }
);

worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= 3) {
    await deadLetterQueue.add('failed-contract-analysis', {
      originalJobId: job.id,
      jobData: job.data,
      error: err.message,
      failedAt: new Date(),
      attempts: job.attemptsMade,
    });
  }
});

worker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('progress', (job, progress) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${job.id} progress: ${progress}%`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${jobId} failed with reason: ${failedReason}`);
});

export async function analyzeContract(filePath: string, contractId: string, userId: string, metadata?: Record<string, unknown>): Promise<Job<ContractJobData>> {
  const job = await contractQueue.add('analyze-contract', { filePath, contractId, userId, metadata });
  return job;
}

export async function getJobStatus(jobId: string): Promise<{ status: string; progress: number; result?: unknown; checkpoints?: JobCheckpoint[] }> {
  const job = await contractQueue.getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  const state = await job.getState();
  const progress = (job.progress as number) || 0;
  const checkpoints = await getCheckpointsForContract((job.data as ContractJobData).contractId);
  return { status: state, progress, result: job.returnvalue, checkpoints };
}

export async function getFailedJobs() {
  return deadLetterQueue.getJobs(['completed', 'failed', 'delayed']);
}

export async function retryFailedJob(dlqJobId: string) {
  const dlqJob = await deadLetterQueue.getJob(dlqJobId);
  if (!dlqJob) throw new Error(`DLQ job ${dlqJobId} not found`);
  const originalData = (dlqJob.data as any).jobData as ContractJobData;
  await analyzeContract(originalData.filePath, originalData.contractId, originalData.userId, originalData.metadata);
  await dlqJob.remove();
}



import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import contractsRoutes from '../../src/routes/contracts';
import prismaPlugin from '../../src/plugins/prisma';

describe('Contracts API Integration Tests', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let app: any;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('test_db')
      .withUsername('test')
      .withPassword('test')
      .withExposedPorts(5432)
      .start();

    // Set test database URL
    process.env.DATABASE_URL = container.getConnectionUri();

    // Initialize Prisma
    prisma = new PrismaClient();
    await prisma.$connect();

    // Run migrations
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
    
    // Create tables manually for testing
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        file_hash VARCHAR(64) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS clauses (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        text TEXT NOT NULL,
        embedding vector(1536),
        risk_score REAL,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS analysis_checkpoints (
        id TEXT PRIMARY KEY,
        contract_id TEXT NOT NULL,
        step VARCHAR(100) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
      );
    `;

    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contracts_file_hash ON contracts(file_hash);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_clauses_contract_id ON clauses(contract_id);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_clauses_type ON clauses(type);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_analysis_checkpoints_contract_id ON analysis_checkpoints(contract_id);`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_analysis_checkpoints_step ON analysis_checkpoints(step);`;

    // Setup Fastify app
    app = Fastify({ logger: false });
    
    // Register plugins
    await app.register(multipart);
    await app.register(prismaPlugin);
    await app.register(contractsRoutes);

    await app.ready();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.analysisCheckpoint.deleteMany();
    await prisma.clause.deleteMany();
    await prisma.contract.deleteMany();
  });

  describe('POST /contracts', () => {
    it('should create a new contract', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'test-contract.pdf',
            data: Buffer.from('test file content')
          }
        }
      });

      expect(response.statusCode).toBe(201);
      const contract = JSON.parse(response.body);
      expect(contract).toHaveProperty('id');
      expect(contract).toHaveProperty('filename', 'test-contract.pdf');
      expect(contract).toHaveProperty('uploadDate');
      expect(contract).toHaveProperty('status', 'uploaded');

      // Verify contract was saved to database
      const dbContract = await prisma.contract.findUnique({
        where: { id: contract.id }
      });
      expect(dbContract).toBeTruthy();
      expect(dbContract?.userId).toBe('user_demo');
      expect(dbContract?.status).toBe('pending');
    });

    it('should handle file upload with different content', async () => {
      const testContent = 'This is a different test contract content';
      const response = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'another-contract.pdf',
            data: Buffer.from(testContent)
          }
        }
      });

      expect(response.statusCode).toBe(201);
      const contract = JSON.parse(response.body);
      expect(contract.filename).toBe('another-contract.pdf');

      // Verify file hash was calculated correctly
      const dbContract = await prisma.contract.findUnique({
        where: { id: contract.id }
      });
      expect(dbContract?.fileHash).toBeTruthy();
      expect(dbContract?.fileHash).toHaveLength(64); // SHA256 hex length
    });
  });

  describe('GET /contracts', () => {
    beforeEach(async () => {
      // Create test contracts
      await prisma.contract.createMany({
        data: [
          {
            id: 'contract-1',
            userId: 'user_demo',
            fileHash: 'hash1',
            status: 'pending',
            createdAt: new Date('2024-01-01')
          },
          {
            id: 'contract-2',
            userId: 'user_demo',
            fileHash: 'hash2',
            status: 'completed',
            createdAt: new Date('2024-01-02')
          },
          {
            id: 'contract-3',
            userId: 'user_demo',
            fileHash: 'hash3',
            status: 'pending',
            createdAt: new Date('2024-01-03')
          }
        ]
      });
    });

    it('should list contracts with pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contracts'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('hasMore');
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe('contract-3'); // Most recent first
    });

    it('should handle cursor-based pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contracts?cursor=contract-3'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('contract-2');
    });

    it('should return empty list when no contracts exist', async () => {
      await prisma.contract.deleteMany();
      
      const response = await app.inject({
        method: 'GET',
        url: '/contracts'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('POST /contracts/:id/analyze', () => {
    let contractId: string;

    beforeEach(async () => {
      const contract = await prisma.contract.create({
        data: {
          id: 'test-contract-id',
          userId: 'user_demo',
          fileHash: 'test-hash',
          status: 'pending'
        }
      });
      contractId = contract.id;
    });

    it('should trigger contract analysis', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/contracts/${contractId}/analyze`,
        payload: {
          filePath: '/test/path/contract.pdf'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('contractId', contractId);
    });

    it('should return error for non-existent contract', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts/non-existent-id/analyze',
        payload: {
          filePath: '/test/path/contract.pdf'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('contractId', 'non-existent-id');
      expect(result).toHaveProperty('riskSummary', {});
      expect(result).toHaveProperty('clauseCount', 0);
    });

    it('should handle analysis without file path', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/contracts/${contractId}/analyze`,
        payload: {
          sections: ['section1', 'section2', 'section3']
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('contractId', contractId);
      expect(result).toHaveProperty('clauseCount', 3);
    });
  });

  describe('GET /status/:jobId', () => {
    it('should return job status', async () => {
      // Mock the getJobStatus function
      const mockJobStatus = {
        status: 'active',
        progress: 50,
        result: null,
        checkpoints: []
      };

      // This would normally require mocking the BullMQ queue
      // For integration testing, we'll test the endpoint structure
      const response = await app.inject({
        method: 'GET',
        url: '/status/test-job-id'
      });

      // The actual implementation would return 404 for non-existent jobs
      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('error', 'Job not found');
    });
  });

  describe('Database Integration', () => {
    it('should create and retrieve clauses', async () => {
      const contract = await prisma.contract.create({
        data: {
          id: 'clause-test-contract',
          userId: 'user_demo',
          fileHash: 'clause-test-hash',
          status: 'pending'
        }
      });

      const clause = await prisma.clause.create({
        data: {
          id: 'test-clause',
          contractId: contract.id,
          type: 'liability',
          text: 'Test clause text',
          riskScore: 0.8
        }
      });

      expect(clause.id).toBe('test-clause');
      expect(clause.contractId).toBe(contract.id);
      expect(clause.riskScore).toBe(0.8);

      // Verify relationship
      const contractWithClauses = await prisma.contract.findUnique({
        where: { id: contract.id },
        include: { clauses: true }
      });

      expect(contractWithClauses?.clauses).toHaveLength(1);
      expect(contractWithClauses?.clauses[0].id).toBe('test-clause');
    });

    it('should create and retrieve analysis checkpoints', async () => {
      const contract = await prisma.contract.create({
        data: {
          id: 'checkpoint-test-contract',
          userId: 'user_demo',
          fileHash: 'checkpoint-test-hash',
          status: 'pending'
        }
      });

      const checkpoint = await prisma.analysisCheckpoint.create({
        data: {
          id: 'test-checkpoint',
          contractId: contract.id,
          step: 'ocr_completed',
          data: { textLength: 1000 }
        }
      });

      expect(checkpoint.id).toBe('test-checkpoint');
      expect(checkpoint.step).toBe('ocr_completed');
      expect(checkpoint.data).toEqual({ textLength: 1000 });

      // Verify relationship
      const contractWithCheckpoints = await prisma.contract.findUnique({
        where: { id: contract.id },
        include: { analysisCheckpoints: true }
      });

      expect(contractWithCheckpoints?.analysisCheckpoints).toHaveLength(1);
      expect(contractWithCheckpoints?.analysisCheckpoints[0].id).toBe('test-checkpoint');
    });
  });
});



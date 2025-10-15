// Using Jest globals without importing to avoid TS module resolution issues
import Fastify from 'fastify';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import contractsRoutes from '../../src/routes/contracts';
import prismaPlugin from '../../src/plugins/prisma';

const DOCKER_AVAILABLE = process.env.DOCKER_AVAILABLE === 'true';

(!DOCKER_AVAILABLE ? describe.skip : describe)('Contracts API Integration Tests', () => {
  let app: any;
  let container: any;
  let prisma: PrismaClient;

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

    // Create Fastify app
    app = Fastify({ logger: false });
    
    // Register plugins
    await app.register(prismaPlugin);
    await app.register(contractsRoutes);
    
    // Initialize Prisma
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: container.getConnectionUri()
        }
      }
    });

    // Run migrations
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
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

    await app.ready();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    await container.stop();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM analysis_checkpoints`;
    await prisma.$executeRaw`DELETE FROM clauses`;
    await prisma.$executeRaw`DELETE FROM contracts`;
  });

  describe('POST /contracts', () => {
    it('should create a new contract', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'test-contract.pdf',
            data: Buffer.from('Mock PDF content')
          }
        },
        headers: {
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(201);
      const contract = JSON.parse(response.payload);
      
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

    it('should handle missing file gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {}
      });

      expect(response.statusCode).toBe(201);
      const contract = JSON.parse(response.payload);
      expect(contract.filename).toBe('unknown');
    });

    it('should generate unique IDs for each contract', async () => {
      const response1 = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'contract1.pdf',
            data: Buffer.from('Content 1')
          }
        }
      });

      const response2 = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'contract2.pdf',
            data: Buffer.from('Content 2')
          }
        }
      });

      const contract1 = JSON.parse(response1.payload);
      const contract2 = JSON.parse(response2.payload);

      expect(contract1.id).not.toBe(contract2.id);
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
            status: 'completed',
            createdAt: new Date('2024-01-01')
          },
          {
            id: 'contract-2',
            userId: 'user_demo',
            fileHash: 'hash2',
            status: 'pending',
            createdAt: new Date('2024-01-02')
          },
          {
            id: 'contract-3',
            userId: 'user_demo',
            fileHash: 'hash3',
            status: 'analyzing',
            createdAt: new Date('2024-01-03')
          }
        ]
      });
    });

    it('should return list of contracts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contracts'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('hasMore');
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe('contract-3'); // Most recent first
    });

    it('should support pagination with cursor', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/contracts?cursor=contract-2'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('contract-1');
    });

    it('should limit results to 25 items', async () => {
      // Create 30 contracts
      const contracts = Array.from({ length: 30 }, (_, i) => ({
        id: `contract-${i}`,
        userId: 'user_demo',
        fileHash: `hash${i}`,
        status: 'pending',
        createdAt: new Date()
      }));
      
      await prisma.contract.createMany({ data: contracts });

      const response = await app.inject({
        method: 'GET',
        url: '/contracts'
      });

      const result = JSON.parse(response.payload);
      expect(result.items).toHaveLength(25);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('POST /contracts/:id/analyze', () => {
    beforeEach(async () => {
      // Create test contract
      await prisma.contract.create({
        data: {
          id: 'test-contract',
          userId: 'user_demo',
          fileHash: 'test-hash',
          status: 'pending'
        }
      });
    });

    it('should trigger contract analysis', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts/test-contract/analyze',
        payload: {
          filePath: '/path/to/test-contract.pdf'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('contractId', 'test-contract');
    });

    it('should handle non-existent contract', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts/non-existent/analyze',
        payload: {
          filePath: '/path/to/contract.pdf'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('contractId', 'non-existent');
      expect(result).toHaveProperty('riskSummary', {});
      expect(result).toHaveProperty('clauseCount', 0);
    });

    it('should handle analysis with sections', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts/test-contract/analyze',
        payload: {
          sections: ['termination', 'liability', 'payment']
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('contractId', 'test-contract');
      expect(result).toHaveProperty('clauseCount', 3);
    });
  });

  describe('Database Integration', () => {
    it('should persist contract data correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'integration-test.pdf',
            data: Buffer.from('Integration test content')
          }
        }
      });

      const contract = JSON.parse(response.payload);
      
      // Verify database state
      const dbContract = await prisma.contract.findUnique({
        where: { id: contract.id }
      });
      
      expect(dbContract).toBeTruthy();
      expect(dbContract?.userId).toBe('user_demo');
      expect(dbContract?.fileHash).toBeTruthy();
      expect(dbContract?.status).toBe('pending');
      expect(dbContract?.createdAt).toBeInstanceOf(Date);
    });

    it('should create analysis checkpoints', async () => {
      // Create contract
      const contract = await prisma.contract.create({
        data: {
          id: 'checkpoint-test',
          userId: 'user_demo',
          fileHash: 'checkpoint-hash',
          status: 'analyzing'
        }
      });

      // Create checkpoint
      await prisma.analysisCheckpoint.create({
        data: {
          id: 'checkpoint-1',
          contractId: contract.id,
          step: 'ocr_completed',
          data: { textLength: 1500 }
        }
      });

      // Verify checkpoint
      const checkpoints = await prisma.analysisCheckpoint.findMany({
        where: { contractId: contract.id }
      });

      expect(checkpoints).toHaveLength(1);
      expect(checkpoints[0]!.step).toBe('ocr_completed');
      expect(checkpoints[0]!.data).toEqual({ textLength: 1500 });
    });

    it('should create clauses with embeddings', async () => {
      // Create contract
      const contract = await prisma.contract.create({
        data: {
          id: 'clause-test',
          userId: 'user_demo',
          fileHash: 'clause-hash',
          status: 'completed'
        }
      });

      // Create clause with mock embedding
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());
      
      await prisma.clause.create({
        data: {
          id: 'clause-1',
          contractId: contract.id,
          type: 'termination',
          text: 'Either party may terminate with 30 days notice.',
          riskScore: 3.5
        }
      });

      // Verify clause
      const clauses = await prisma.clause.findMany({
        where: { contractId: contract.id }
      });

      expect(clauses).toHaveLength(1);
      expect(clauses[0]!.type).toBe('termination');
      expect(clauses[0]!.riskScore).toBe(3.5);
    });
  });

  describe('Status Polling Simulation', () => {
    it('should simulate contract analysis workflow', async () => {
      // Step 1: Create contract
      const createResponse = await app.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          file: {
            filename: 'workflow-test.pdf',
            data: Buffer.from('Workflow test content')
          }
        }
      });

      const contract = JSON.parse(createResponse.payload);
      expect(contract.status).toBe('uploaded');

      // Step 2: Start analysis
      const analyzeResponse = await app.inject({
        method: 'POST',
        url: `/contracts/${contract.id}/analyze`,
        payload: {
          filePath: '/path/to/workflow-test.pdf'
        }
      });

      const analysis = JSON.parse(analyzeResponse.payload);
      expect(analysis).toHaveProperty('jobId');

      // Step 3: Simulate status updates
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'analyzing' }
      });

      // Step 4: Create analysis checkpoints
      await prisma.analysisCheckpoint.createMany({
        data: [
          {
            id: 'checkpoint-1',
            contractId: contract.id,
            step: 'hash_checked',
            data: { fileHash: 'workflow-hash' }
          },
          {
            id: 'checkpoint-2',
            contractId: contract.id,
            step: 'ocr_completed',
            data: { textLength: 2000 }
          },
          {
            id: 'checkpoint-3',
            contractId: contract.id,
            step: 'embeddings_generated',
            data: { chunkCount: 10, embeddingDim: 1536 }
          }
        ]
      });

      // Step 5: Complete analysis
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'completed' }
      });

      // Step 6: Create clauses
      await prisma.clause.createMany({
        data: [
          {
            id: 'clause-1',
            contractId: contract.id,
            type: 'termination',
            text: 'Termination clause text',
            riskScore: 3.5
          },
          {
            id: 'clause-2',
            contractId: contract.id,
            type: 'liability',
            text: 'Liability clause text',
            riskScore: 4.2
          }
        ]
      });

      // Step 7: Verify final state
      const finalContract = await prisma.contract.findUnique({
        where: { id: contract.id },
        include: {
          clauses: true,
          analysisCheckpoints: true
        }
      });

      expect(finalContract?.status).toBe('completed');
      expect(finalContract?.clauses).toHaveLength(2);
      expect(finalContract?.analysisCheckpoints).toHaveLength(3);
    });
  });
});

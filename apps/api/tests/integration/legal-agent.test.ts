// Using Jest globals without importing to avoid TS module resolution issues
import Fastify from 'fastify';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import contractsRoutes from '../../src/routes/contracts';
import legalAgentRoutes from '../../src/routes/legalAgent';
import prismaPlugin from '../../src/plugins/prisma';

const DOCKER_AVAILABLE = process.env.DOCKER_AVAILABLE === 'true';

(!DOCKER_AVAILABLE ? describe.skip : describe)('Legal Agent Integration Tests', () => {
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
    process.env.LEGAL_AGENT_URL = 'http://localhost:8000'; // Mock URL for testing

    // Create Fastify app
    app = Fastify({ logger: false });
    
    // Register plugins
    await app.register(prismaPlugin);
    await app.register(contractsRoutes);
    await app.register(legalAgentRoutes);
    
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

  describe('Legal Agent Health Check', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/legal-agent/health'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('service', 'legal-agent');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Legal Agent Analysis Endpoints', () => {
    const testDocument = `
      LIABILITY CLAUSE: The Company shall have unlimited liability for any damages arising from gross negligence or willful misconduct.
      
      PAYMENT CLAUSE: Payment shall be made within 30 days of invoice receipt.
      
      TERMINATION CLAUSE: Either party may terminate this agreement with 30 days written notice.
      
      CONFIDENTIALITY CLAUSE: All confidential information shall be kept secret for a period of 5 years.
    `;

    it('should handle document analysis request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/analyze',
        payload: {
          document_text: testDocument,
          analysis_type: 'comprehensive'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle clause extraction request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/extract-clauses',
        payload: {
          document_text: testDocument
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle clause search request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/search-clauses',
        payload: {
          query: 'liability clause',
          limit: 5
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle risk scoring request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/score-risk',
        payload: {
          clause_text: 'The Company shall have unlimited liability for any damages.'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle comprehensive analysis request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/comprehensive-analysis',
        payload: {
          document_text: testDocument
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('extraction');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('riskScores');
    });

    it('should return stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/legal-agent/stats'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing document_text in analysis', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/analyze',
        payload: {
          analysis_type: 'comprehensive'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing document_text in clause extraction', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/extract-clauses',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing query in clause search', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/search-clauses',
        payload: {
          limit: 5
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing clause_text in risk scoring', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/legal-agent/score-risk',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Contract Analysis Integration', () => {
    it('should integrate legal agent with contract analysis', async () => {
      // Create a test contract
      const contract = await prisma.contract.create({
        data: {
          id: 'test-contract-legal',
          userId: 'user_demo',
          fileHash: 'test-hash-legal',
          status: 'pending'
        }
      });

      // Create analysis checkpoints
      await prisma.analysisCheckpoint.createMany({
        data: [
          {
            id: 'checkpoint-1',
            contractId: contract.id,
            step: 'hash_checked',
            data: { fileHash: 'test-hash-legal' }
          },
          {
            id: 'checkpoint-2',
            contractId: contract.id,
            step: 'ocr_completed',
            data: { textLength: 1000 }
          },
          {
            id: 'checkpoint-3',
            contractId: contract.id,
            step: 'embeddings_generated',
            data: { chunkCount: 5, embeddingDim: 1536 }
          }
        ]
      });

      // Create clauses with risk scores
      await prisma.clause.createMany({
        data: [
          {
            id: 'clause-1',
            contractId: contract.id,
            type: 'liability',
            text: 'The Company shall have unlimited liability for any damages.',
            riskScore: 8.5
          },
          {
            id: 'clause-2',
            contractId: contract.id,
            type: 'payment',
            text: 'Payment shall be made within 30 days of invoice receipt.',
            riskScore: 2.1
          }
        ]
      });

      // Verify the integration
      const finalContract = await prisma.contract.findUnique({
        where: { id: contract.id },
        include: {
          clauses: true,
          analysisCheckpoints: true
        }
      });

      expect(finalContract?.clauses).toHaveLength(2);
      expect(finalContract?.analysisCheckpoints).toHaveLength(3);
      
      // Check risk scores
      const highRiskClause = finalContract?.clauses.find((c: any) => c.riskScore && c.riskScore > 7);
      const lowRiskClause = finalContract?.clauses.find((c: any) => c.riskScore && c.riskScore < 5);
      
      expect(highRiskClause).toBeTruthy();
      expect(lowRiskClause).toBeTruthy();
      expect(highRiskClause?.type).toBe('liability');
      expect(lowRiskClause?.type).toBe('payment');
    });
  });
});

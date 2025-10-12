import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedGenericContainer } from '@testcontainers/generic';
import { PrismaClient } from '@prisma/client';

export interface TestContainers {
  postgres: StartedPostgreSqlContainer;
  redis: StartedGenericContainer;
  prisma: PrismaClient;
}

export async function setupTestContainers(): Promise<TestContainers> {
  console.log('Starting test containers...');

  // Start PostgreSQL container
  const postgres = await new PostgreSqlContainer('postgres:15')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_DB: 'test_db',
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test'
    })
    .start();

  // Start Redis container
  const redis = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withEnvironment({
      REDIS_PASSWORD: ''
    })
    .start();

  // Set environment variables
  process.env.DATABASE_URL = postgres.getConnectionUri();
  process.env.REDIS_HOST = redis.getHost();
  process.env.REDIS_PORT = redis.getMappedPort(6379).toString();
  process.env.NODE_ENV = 'test';

  console.log('PostgreSQL URL:', postgres.getConnectionUri());
  console.log('Redis URL:', `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`);

  // Initialize Prisma
  const prisma = new PrismaClient();
  await prisma.$connect();

  // Create database schema
  await setupDatabaseSchema(prisma);

  return { postgres, redis, prisma };
}

export async function teardownTestContainers(containers: TestContainers): Promise<void> {
  console.log('Stopping test containers...');
  
  await containers.prisma.$disconnect();
  await containers.redis.stop();
  await containers.postgres.stop();
  
  console.log('Test containers stopped');
}

async function setupDatabaseSchema(prisma: PrismaClient): Promise<void> {
  console.log('Setting up database schema...');

  // Enable vector extension
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;

  // Create contracts table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_hash VARCHAR(64) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Create clauses table
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

  // Create analysis_checkpoints table
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

  console.log('Database schema setup complete');
}

export async function cleanupTestData(prisma: PrismaClient): Promise<void> {
  console.log('Cleaning up test data...');
  
  await prisma.analysisCheckpoint.deleteMany();
  await prisma.clause.deleteMany();
  await prisma.contract.deleteMany();
  
  console.log('Test data cleanup complete');
}






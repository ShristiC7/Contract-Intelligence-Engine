import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class TestHelpers {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a test contract with optional data
   */
  async createTestContract(overrides: Partial<any> = {}) {
    const defaultData = {
      id: faker.string.uuid(),
      userId: 'test_user',
      fileHash: faker.string.alphanumeric(64),
      status: 'pending',
      createdAt: new Date()
    };

    return await this.prisma.contract.create({
      data: { ...defaultData, ...overrides }
    });
  }

  /**
   * Create test clauses for a contract
   */
  async createTestClauses(contractId: string, count: number = 3) {
    const clauseTypes = ['termination', 'liability', 'payment', 'indemnification', 'confidentiality'];
    const clauses = [];

    for (let i = 0; i < count; i++) {
      const clause = await this.prisma.clause.create({
        data: {
          id: faker.string.uuid(),
          contractId,
          type: faker.helpers.arrayElement(clauseTypes),
          text: faker.lorem.paragraph(),
          riskScore: faker.number.float({ min: 0, max: 10, fractionDigits: 1 })
        }
      });
      clauses.push(clause);
    }

    return clauses;
  }

  /**
   * Create test analysis checkpoints
   */
  async createTestCheckpoints(contractId: string, steps: string[] = ['hash_checked', 'ocr_completed', 'embeddings_generated']) {
    const checkpoints = [];

    for (const step of steps) {
      const checkpoint = await this.prisma.analysisCheckpoint.create({
        data: {
          id: faker.string.uuid(),
          contractId,
          step,
          data: { timestamp: new Date().toISOString(), stepData: faker.lorem.sentence() },
          createdAt: new Date()
        }
      });
      checkpoints.push(checkpoint);
    }

    return checkpoints;
  }

  /**
   * Create a complete test contract with clauses and checkpoints
   */
  async createCompleteTestContract() {
    const contract = await this.createTestContract({ status: 'completed' });
    const clauses = await this.createTestClauses(contract.id, 5);
    const checkpoints = await this.createTestCheckpoints(contract.id);

    return {
      contract,
      clauses,
      checkpoints
    };
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    await this.prisma.analysisCheckpoint.deleteMany();
    await this.prisma.clause.deleteMany();
    await this.prisma.contract.deleteMany();
  }

  /**
   * Generate mock contract text with various clause types
   */
  generateMockContractText(): string {
    return `
      TERMINATION CLAUSE: Either party may terminate this agreement with 30 days written notice.
      
      LIABILITY CLAUSE: The company's liability shall not exceed the total contract value.
      
      PAYMENT CLAUSE: Payment shall be made within 30 days of invoice receipt.
      
      INDEMNIFICATION CLAUSE: Party A shall indemnify and hold harmless Party B from all claims, damages, and expenses.
      
      CONFIDENTIALITY CLAUSE: All information shared shall remain confidential for a period of 5 years.
      
      FORCE MAJEURE CLAUSE: Neither party shall be liable for delays due to circumstances beyond their control.
      
      GOVERNING LAW CLAUSE: This agreement shall be governed by the laws of the State of California.
      
      INTELLECTUAL PROPERTY CLAUSE: All intellectual property developed under this agreement shall belong to Party A.
    `;
  }

  /**
   * Generate mock embeddings for testing
   */
  generateMockEmbeddings(count: number = 5, dimensions: number = 1536): number[][] {
    return Array.from({ length: count }, () =>
      Array.from({ length: dimensions }, () => Math.random())
    );
  }

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition: () => Promise<boolean>, timeout: number = 5000, interval: number = 100): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Create a test file buffer
   */
  createTestFileBuffer(filename: string = 'test-contract.pdf'): Buffer {
    const content = this.generateMockContractText();
    return Buffer.from(content);
  }

  /**
   * Generate test multipart form data
   */
  createMultipartFormData(filename: string, content: string): { body: string; headers: Record<string, string> } {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="' + filename + '"',
      'Content-Type: application/pdf',
      '',
      content,
      `--${boundary}--`,
      ''
    ].join('\r\n');
    
    return {
      body,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    };
  }
}

/**
 * Mock Redis client for testing
 */
export class MockRedisClient {
  private data: Map<string, string> = new Map();

  async exists(key: string): Promise<number> {
    return this.data.has(key) ? 1 : 0;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.data.set(key, value);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async del(key: string): Promise<number> {
    return this.data.delete(key) ? 1 : 0;
  }

  clear(): void {
    this.data.clear();
  }
}

/**
 * Test fixtures for common test scenarios
 */
export const testFixtures = {
  contracts: {
    simple: {
      filename: 'simple-contract.pdf',
      content: 'This is a simple contract between two parties.'
    },
    complex: {
      filename: 'complex-contract.pdf',
      content: `
        TERMINATION CLAUSE: Either party may terminate this agreement with 30 days notice.
        LIABILITY CLAUSE: The company's liability shall not exceed the contract value.
        PAYMENT CLAUSE: Payment shall be made within 30 days of invoice receipt.
        INDEMNIFICATION CLAUSE: Party A shall indemnify and hold harmless Party B.
        CONFIDENTIALITY CLAUSE: All information shall remain confidential for 5 years.
      `
    },
    highRisk: {
      filename: 'high-risk-contract.pdf',
      content: `
        PENALTY CLAUSE: Failure to deliver on time shall result in a penalty of $10,000 per day.
        EXCLUSIVE CLAUSE: Party B shall not work with competitors for 2 years.
        LIQUIDATED DAMAGES: Liquidated damages shall be 150% of contract value.
        UNLIMITED INDEMNIFICATION: Party A shall indemnify Party B for all claims without limit.
      `
    }
  },

  clauses: {
    termination: {
      type: 'termination',
      text: 'Either party may terminate this agreement with 30 days notice.',
      expectedRiskScore: 3.5
    },
    liability: {
      type: 'liability',
      text: 'The company\'s liability shall not exceed the contract value.',
      expectedRiskScore: 4.2
    },
    indemnification: {
      type: 'indemnification',
      text: 'Party A shall indemnify and hold harmless Party B from all claims.',
      expectedRiskScore: 7.5
    }
  }
};

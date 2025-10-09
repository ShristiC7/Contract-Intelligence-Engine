import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const CLAUSE_TYPES = [
  'payment_terms',
  'termination',
  'confidentiality',
  'indemnification',
  'limitation_of_liability',
  'intellectual_property',
  'dispute_resolution',
  'force_majeure',
  'warranty',
  'non_compete',
  'jurisdiction',
  'assignment'
];

const LEGAL_TEXT_TEMPLATES: Record<string, string[]> = {
  payment_terms: [
    'The Client shall pay the Contractor a sum of ${amount} within ${days} days of invoice date. Payment shall be made via wire transfer to the account specified in Exhibit A. Late payments shall accrue interest at a rate of ${rate}% per annum.',
    'Payment obligations hereunder shall commence on ${date} and continue for a period of ${duration}. All fees are non-refundable except as expressly provided in Section ${section}.',
    'The total contract value shall not exceed ${amount} unless mutually agreed in writing. Invoices shall be submitted monthly and payment terms are Net ${days}.'
  ],
  termination: [
    'Either party may terminate this Agreement upon ${days} days written notice. Upon termination, all outstanding fees become immediately due and payable.',
    'This Agreement may be terminated immediately by either party for material breach, provided the breaching party fails to cure within ${days} days of written notice.',
    'Termination for convenience requires ${months} months prior written notice. The terminating party shall compensate for all work performed through the effective termination date.'
  ],
  confidentiality: [
    'Recipient agrees to maintain in strict confidence all Confidential Information disclosed by Discloser. Such information shall not be disclosed to third parties without prior written consent.',
    'The receiving party shall use Confidential Information solely for the purpose of ${purpose} and shall protect such information using the same degree of care used for its own confidential information, but no less than reasonable care.',
    'Confidential Information excludes information that: (a) is publicly available, (b) was rightfully possessed prior to disclosure, (c) is independently developed, or (d) is required to be disclosed by law.'
  ],
  indemnification: [
    "The Contractor shall indemnify, defend, and hold harmless Client from any claims, damages, or liabilities arising from Contractor's negligent acts or omissions in performance of services hereunder.",
    'Each party agrees to indemnify the other against third-party claims resulting from: (i) breach of this Agreement, (ii) violation of applicable law, or (iii) infringement of intellectual property rights.',
    'Indemnification obligations shall survive termination of this Agreement. The indemnified party shall provide prompt notice of any claim and reasonable cooperation in defense thereof.'
  ],
  limitation_of_liability: [
    'In no event shall either party be liable for indirect, incidental, consequential, or punitive damages, including lost profits, even if advised of the possibility thereof.',
    'Total liability under this Agreement shall not exceed the fees paid in the ${period} months preceding the claim. This limitation applies regardless of the form of action.',
    'The limitations herein shall not apply to: (a) breaches of confidentiality, (b) indemnification obligations, (c) gross negligence or willful misconduct, or (d) violation of intellectual property rights.'
  ],
  intellectual_property: [
    'All intellectual property created in the course of this engagement shall be deemed "work made for hire" and shall be the exclusive property of Client.',
    'Contractor hereby assigns to Client all right, title, and interest in deliverables, including all copyrights, patents, and trade secrets embodied therein.',
    "Each party retains ownership of its pre-existing intellectual property. Client receives a non-exclusive, perpetual license to use Contractor's pre-existing materials incorporated into deliverables."
  ],
  dispute_resolution: [
    'Any dispute arising under this Agreement shall be resolved through binding arbitration in ${city} under the rules of the American Arbitration Association.',
    'The parties agree to attempt good faith negotiation for ${days} days before pursuing formal dispute resolution. If unsuccessful, disputes shall be submitted to mediation.',
    "Arbitration shall be conducted by a single arbitrator mutually agreed upon. The arbitrator's decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction."
  ],
  force_majeure: [
    'Neither party shall be liable for delays or failures in performance resulting from acts beyond reasonable control, including acts of God, war, terrorism, pandemic, or government action.',
    'In the event of force majeure, the affected party shall promptly notify the other party and use reasonable efforts to minimize the impact. Performance shall be suspended during the force majeure event.',
    'If force majeure continues for more than ${days} days, either party may terminate this Agreement without liability upon written notice.'
  ],
  warranty: [
    'Contractor warrants that services shall be performed in a professional and workmanlike manner consistent with industry standards.',
    'Client warrants it has the authority to enter into this Agreement and that materials provided to Contractor do not infringe third-party rights.',
    'EXCEPT AS EXPRESSLY PROVIDED HEREIN, ALL SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.'
  ],
  non_compete: [
    'During the term and for ${months} months thereafter, Contractor shall not engage in any business competitive with Client within ${radius} miles of ${location}.',
    'The parties acknowledge this restriction is reasonable and necessary to protect Client\'s legitimate business interests. Any breach shall entitle Client to injunctive relief.',
    "Non-compete obligations shall apply only to services substantially similar to those provided hereunder and shall not restrict Contractor's general employment rights."
  ],
  jurisdiction: [
    'This Agreement shall be governed by and construed in accordance with the laws of ${state}, without regard to conflicts of law principles.',
    'The parties consent to exclusive jurisdiction in the state and federal courts located in ${county}, ${state} for any legal proceedings arising from this Agreement.',
    'Any action must be commenced within ${years} years of the claim arising, or be forever barred.'
  ],
  assignment: [
    'Neither party may assign this Agreement without the prior written consent of the other party, which consent shall not be unreasonably withheld.',
    'This Agreement shall bind and inure to the benefit of the parties and their respective successors and permitted assigns.',
    'Any attempted assignment in violation of this provision shall be void. Notwithstanding the foregoing, either party may assign to a successor in a merger or acquisition.'
  ]
};

const CONTRACT_STATUSES = ['pending', 'analyzing', 'completed', 'flagged', 'archived'] as const;

function generateRandomEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

function calculateRiskScore(type: string, text: string): number {
  const highRiskTypes = ['limitation_of_liability', 'indemnification', 'non_compete', 'termination'];
  const baseRisk = highRiskTypes.includes(type) ? 0.6 : 0.3;

  const hasHighAmount = /\$[1-9]\d{5,}/.test(text);
  const hasShortTimeframe = /\b([1-9]|1[0-5])\s+days?\b/.test(text);
  const hasUnlimited = /unlimited|perpetual|indefinite/i.test(text);

  let adjustment = 0;
  if (hasHighAmount) adjustment += 0.15;
  if (hasShortTimeframe) adjustment += 0.1;
  if (hasUnlimited) adjustment += 0.2;

  return Math.min(0.95, Math.max(0.05, baseRisk + adjustment + (Math.random() * 0.2 - 0.1)));
}

function generateLegalText(type: string): string {
  const templates = LEGAL_TEXT_TEMPLATES[type] ?? [];
  const template = faker.helpers.arrayElement(templates);
  return template
    .replace(/\${amount}/g, `$${faker.finance.amount({ min: 5000, max: 500000, dec: 0 })}`)
    .replace(/\${days}/g, String(faker.helpers.arrayElement([7, 10, 14, 15, 21, 30, 45, 60, 90])))
    .replace(/\${months}/g, String(faker.helpers.arrayElement([1, 2, 3, 6, 12, 18, 24])))
    .replace(/\${years}/g, String(faker.helpers.arrayElement([1, 2, 3, 5])))
    .replace(/\${rate}/g, String(faker.helpers.arrayElement([1.5, 2.0, 2.5, 3.0, 5.0, 8.0])))
    .replace(/\${duration}/g, `${faker.number.int({ min: 6, max: 36 })} months`)
    .replace(/\${date}/g, faker.date.future().toISOString().split('T')[0])
    .replace(/\${section}/g, `${faker.number.int({ min: 1, max: 20 })}`)
    .replace(/\${period}/g, String(faker.helpers.arrayElement([3, 6, 12])))
    .replace(/\${city}/g, faker.location.city())
    .replace(/\${state}/g, faker.location.state())
    .replace(/\${county}/g, `${faker.location.county()} County`)
    .replace(/\${location}/g, faker.location.city())
    .replace(/\${radius}/g, String(faker.helpers.arrayElement([25, 50, 100, 250])))
    .replace(/\${purpose}/g, faker.helpers.arrayElement([
      'performing services under this Agreement',
      'evaluating potential business opportunities',
      'fulfilling contractual obligations'
    ]));
}

async function main(): Promise<void> {
  console.log('Starting seed...');

  const userIds = Array.from({ length: 10 }, () => `user_${faker.string.alphanumeric(16)}`);

  type NewContract = { id: string; userId: string; fileHash: string; status: string; createdAt: Date };
  type NewClause = { id: string; contractId: string; type: string; text: string; embedding: number[]; riskScore: number };
  type NewCheckpoint = { id: string; contractId: string; step: string; data: unknown; createdAt: Date };

  const contracts: NewContract[] = [];
  const clauses: NewClause[] = [];
  const checkpoints: NewCheckpoint[] = [];

  for (let i = 0; i < 100; i += 1) {
    const userId = faker.helpers.arrayElement(userIds);
    const contractId = `contract_${faker.string.alphanumeric(20)}`;
    const fileHash = crypto.createHash('sha256').update(faker.string.alphanumeric(32)).digest('hex');
    const status = faker.helpers.arrayElement([...CONTRACT_STATUSES]);
    const createdAt = faker.date.past({ years: 2 });

    contracts.push({ id: contractId, userId, fileHash, status, createdAt });

    const numClauses = faker.number.int({ min: 3, max: 7 });
    const usedTypes = new Set<string>();
    for (let j = 0; j < numClauses; j += 1) {
      let clauseType: string;
      do {
        clauseType = faker.helpers.arrayElement(CLAUSE_TYPES);
      } while (usedTypes.has(clauseType));
      usedTypes.add(clauseType);

      const text = generateLegalText(clauseType);
      const riskScore = calculateRiskScore(clauseType, text);
      const embedding = generateRandomEmbedding();

      clauses.push({
        id: `clause_${faker.string.alphanumeric(20)}`,
        contractId,
        type: clauseType,
        text,
        embedding,
        riskScore
      });
    }

    const numCheckpoints = faker.number.int({ min: 2, max: 4 });
    const steps = ['extraction', 'classification', 'risk_analysis', 'review_complete'];
    for (let k = 0; k < numCheckpoints; k += 1) {
      checkpoints.push({
        id: `checkpoint_${faker.string.alphanumeric(20)}`,
        contractId,
        step: steps[k],
        data: {
          timestamp: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
          status: 'completed',
          details: {
            processedClauses: numClauses,
            duration: faker.number.int({ min: 500, max: 5000 }),
            confidence: faker.number.float({ min: 0.7, max: 0.99, multipleOf: 0.01 })
          }
        },
        createdAt: faker.date.between({ from: createdAt, to: new Date() })
      });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Generated ${i + 1}/100 contracts...`);
    }
  }

  console.log('Inserting contracts...');
  await prisma.contract.createMany({ data: contracts });

  console.log('Inserting clauses...');
  const batchSize = 50;
  for (let i = 0; i < clauses.length; i += batchSize) {
    const batch = clauses.slice(i, i + batchSize);
    // Use $transaction with createMany on a mapped shape that matches Prisma schema
    await prisma.$transaction(
      batch.map((c) =>
        prisma.clause.create({
          data: {
            id: c.id,
            contractId: c.contractId,
            type: c.type,
            text: c.text,
            // embedding is unsupported type in Prisma; store as JSON in separate column if needed.
            riskScore: c.riskScore
          }
        })
      )
    );
    console.log(`Inserted ${Math.min(i + batchSize, clauses.length)}/${clauses.length} clauses...`);
  }

  console.log('Inserting analysis checkpoints...');
  await prisma.analysisCheckpoint.createMany({ data: checkpoints });

  const stats = {
    totalContracts: contracts.length,
    totalClauses: clauses.length,
    totalCheckpoints: checkpoints.length,
    avgClausesPerContract: Number((clauses.length / contracts.length).toFixed(2)),
    avgCheckpointsPerContract: Number((checkpoints.length / contracts.length).toFixed(2)),
    clausesByType: CLAUSE_TYPES.reduce<Record<string, number>>((acc, type) => {
      acc[type] = clauses.filter((c) => c.type === type).length;
      return acc;
    }, {}),
    avgRiskScore: Number(
      (clauses.reduce((sum, c) => sum + c.riskScore, 0) / Math.max(1, clauses.length)).toFixed(3)
    )
  };

  console.log('\n=== Seed Statistics ===');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



import mercurius from 'mercurius';
import type { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerGraphQL(app: FastifyInstance) {
  const schemaPath = join(__dirname, '..', 'graphql', 'schema.graphql');
  const schema = readFileSync(schemaPath, 'utf8');

  const resolvers = {
    Contract: {
      // placeholder nested resolvers if needed later
    },
    Clause: {},
    Risk: {},
    RiskAssessment: {},
    Query: {},
    Mutation: {}
  } as const;

  app.register(mercurius, {
    schema,
    resolvers: resolvers as any,
    graphiql: true
  });
}


-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable Row Level Security on tables
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts table
-- Users can only see their own contracts
CREATE POLICY "Users can view their own contracts"
  ON contracts
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own contracts
CREATE POLICY "Users can insert their own contracts"
  ON contracts
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own contracts
CREATE POLICY "Users can update their own contracts"
  ON contracts
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own contracts
CREATE POLICY "Users can delete their own contracts"
  ON contracts
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for clauses table
-- Users can view clauses of their own contracts
CREATE POLICY "Users can view clauses of their own contracts"
  ON clauses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = clauses.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Users can insert clauses for their own contracts
CREATE POLICY "Users can insert clauses for their own contracts"
  ON clauses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = clauses.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Users can update clauses of their own contracts
CREATE POLICY "Users can update clauses of their own contracts"
  ON clauses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = clauses.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = clauses.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Users can delete clauses of their own contracts
CREATE POLICY "Users can delete clauses of their own contracts"
  ON clauses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = clauses.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- RLS Policies for analysis_checkpoints table
-- Users can view checkpoints of their own contracts
CREATE POLICY "Users can view checkpoints of their own contracts"
  ON analysis_checkpoints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = analysis_checkpoints.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Users can insert checkpoints for their own contracts
CREATE POLICY "Users can insert checkpoints for their own contracts"
  ON analysis_checkpoints
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = analysis_checkpoints.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Users can update checkpoints of their own contracts
CREATE POLICY "Users can update checkpoints of their own contracts"
  ON analysis_checkpoints
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = analysis_checkpoints.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = analysis_checkpoints.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Users can delete checkpoints of their own contracts
CREATE POLICY "Users can delete checkpoints of their own contracts"
  ON analysis_checkpoints
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = analysis_checkpoints.contract_id
      AND contracts.user_id = auth.uid()::text
    )
  );

-- Create indexes for vector similarity search
CREATE INDEX ON clauses USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Add helpful indexes for query performance
CREATE INDEX idx_contracts_user_status ON contracts(user_id, status);
CREATE INDEX idx_clauses_contract_type ON clauses(contract_id, type);
CREATE INDEX idx_checkpoints_contract_step ON analysis_checkpoints(contract_id, step);


-- Migration: Create Access Control Tables
-- Purpose: Support JWT-based access tokens with logging and revocation
-- Date: 2026-01-31

-- Table for logging all token access attempts
-- Used for security auditing and customer support
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  accessed_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

-- Table for manually revoked tokens (edge cases only)
-- Used when customer reports stolen link or requests refund
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT NOT NULL UNIQUE,
  revoked_at TIMESTAMP DEFAULT NOW(),
  reason TEXT
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_access_logs_order_id ON access_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash);

-- Enable Row Level Security (RLS) - admin only access
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revoked_tokens ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin can view access logs"
  ON access_logs
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage revoked tokens"
  ON revoked_tokens
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

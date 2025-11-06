import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🔧 Creating database tables...\n');

  // Note: We'll need to run these SQL commands via Supabase Dashboard
  // since the anon key doesn't have DDL permissions
  const sqlCommands = `
-- Table for logging searches
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  session_id TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('doi', 'title')),
  search_query TEXT NOT NULL,
  doi TEXT,
  paper_title TEXT,
  analysis_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_doi ON search_logs(doi);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_session_id ON search_logs(session_id);

-- Table for storing legal acceptance
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  session_id TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  disclaimer_version TEXT DEFAULT '1.0',
  UNIQUE(user_id, disclaimer_version)
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_id ON legal_acceptances(user_id);

-- Table for caching paper analysis results
CREATE TABLE IF NOT EXISTS paper_cache (
  doi TEXT PRIMARY KEY,
  analysis_data JSONB NOT NULL,
  paper_title TEXT,
  journal_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_paper_cache_updated_at ON paper_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_paper_cache_hit_count ON paper_cache(hit_count DESC);

-- Enable Row Level Security
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_logs
CREATE POLICY "Users can view their own search logs"
  ON search_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search logs"
  ON search_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for legal_acceptances
CREATE POLICY "Users can view their own legal acceptances"
  ON legal_acceptances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own legal acceptances"
  ON legal_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for paper_cache (read-only for all authenticated users)
CREATE POLICY "Anyone can read paper cache"
  ON paper_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage paper cache"
  ON paper_cache FOR ALL
  TO service_role
  USING (true);
`;

  console.log('📋 SQL commands to run in Supabase Dashboard:\n');
  console.log(sqlCommands);
  console.log('\n✅ Copy the SQL above and run it in Supabase Dashboard > SQL Editor\n');
  console.log('🔗 Dashboard URL:', supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql'));
}

createTables();

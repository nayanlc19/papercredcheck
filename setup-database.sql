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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own search logs" ON search_logs;
DROP POLICY IF EXISTS "Users can insert their own search logs" ON search_logs;
DROP POLICY IF EXISTS "Users can view their own legal acceptances" ON legal_acceptances;
DROP POLICY IF EXISTS "Users can insert their own legal acceptances" ON legal_acceptances;
DROP POLICY IF EXISTS "Anyone can read paper cache" ON paper_cache;
DROP POLICY IF EXISTS "Service role can manage paper cache" ON paper_cache;

-- RLS Policies for search_logs
CREATE POLICY "Users can view their own search logs"
  ON search_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search logs"
  ON search_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

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

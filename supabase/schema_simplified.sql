-- Simplified Supabase Schema - No Profiles Table
-- Uses auth.users directly for user management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User integrations table for OAuth tokens (Direct reference to auth.users)
CREATE TABLE public.user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'google', 'trello', 'asana')),
  
  -- Encrypted token storage (use Supabase Vault in production)
  access_token TEXT NOT NULL, -- Will be encrypted
  refresh_token TEXT,         -- Will be encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Provider-specific metadata
  provider_user_id TEXT,      -- External user ID from provider
  provider_email TEXT,        -- Email from provider
  scopes TEXT[],             -- Granted scopes array
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active integration per provider per user
  UNIQUE(user_id, provider)
);

-- Workflows table (Direct reference to auth.users)
CREATE TABLE public.workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  
  -- Enhanced workflow features
  validation_result JSONB, -- ValidationResult from workflowValidation.ts
  quality_score INTEGER, -- 0-100 quality score
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  node_count INTEGER, -- Cached count for performance
  edge_count INTEGER, -- Cached count for performance
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Execution logs table
CREATE TABLE public.execution_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  trigger_data JSONB,
  result JSONB,
  error TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER -- in milliseconds
);

-- Row Level Security (RLS) - DISABLED FOR MVP DEVELOPMENT
-- Uncomment these lines when ready for production security:
-- ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - COMMENTED OUT FOR MVP DEVELOPMENT
-- Uncomment these when ready for production security:

-- -- User integrations policies
-- CREATE POLICY "Users can view own integrations" ON public.user_integrations
--   FOR SELECT USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert own integrations" ON public.user_integrations
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update own integrations" ON public.user_integrations
--   FOR UPDATE USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete own integrations" ON public.user_integrations
--   FOR DELETE USING (auth.uid() = user_id);
-- 
-- -- Workflows policies
-- CREATE POLICY "Users can view own workflows" ON public.workflows
--   FOR SELECT USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can insert own workflows" ON public.workflows
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update own workflows" ON public.workflows
--   FOR UPDATE USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete own workflows" ON public.workflows
--   FOR DELETE USING (auth.uid() = user_id);
-- 
-- -- Execution logs policies
-- CREATE POLICY "Users can view own execution logs" ON public.execution_logs
--   FOR SELECT USING (
--     auth.uid() IN (
--       SELECT user_id FROM public.workflows WHERE id = workflow_id
--     )
--   );
-- 
-- CREATE POLICY "System can insert execution logs" ON public.execution_logs
--   FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON public.user_integrations(provider);
CREATE INDEX idx_user_integrations_active ON public.user_integrations(user_id, provider, is_active);
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_is_active ON public.workflows(is_active);
CREATE INDEX idx_execution_logs_workflow_id ON public.execution_logs(workflow_id);
CREATE INDEX idx_execution_logs_executed_at ON public.execution_logs(executed_at);

-- Enhanced indexes for analytics and performance
CREATE INDEX idx_workflows_quality_score ON public.workflows(quality_score DESC) WHERE quality_score IS NOT NULL;
CREATE INDEX idx_workflows_last_executed ON public.workflows(last_executed_at DESC) WHERE last_executed_at IS NOT NULL;
CREATE INDEX idx_workflows_execution_count ON public.workflows(execution_count DESC);
CREATE INDEX idx_execution_logs_status ON public.execution_logs(status, executed_at DESC);
CREATE INDEX idx_execution_logs_duration ON public.execution_logs(duration) WHERE duration IS NOT NULL;

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

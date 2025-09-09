-- =============================================================================
-- Workflow Execution Manager - MVP Database Schema
-- =============================================================================
-- This migration creates the complete database schema for the workflow system
-- Designed for rapid MVP development with manual saves and simplified execution

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. WORKFLOWS TABLE
-- =============================================================================
-- Stores workflow definitions with manual save functionality

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workflows
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflows_last_modified ON workflows(last_modified_at);

-- =============================================================================
-- 2. NODES TABLE
-- =============================================================================
-- Basic node information with references to specific configuration tables

CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('trigger', 'trello-action', 'asana-action', 'logic', 'ai-tagging', 'ai-classification')),
  name TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for nodes
CREATE INDEX idx_nodes_workflow_id ON nodes(workflow_id);
CREATE INDEX idx_nodes_node_type ON nodes(node_type);

-- =============================================================================
-- 3. NODE CONNECTIONS
-- =============================================================================
-- Simple DAG connections without complex conditions

CREATE TABLE node_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id)
);

-- Indexes for node connections
CREATE INDEX idx_node_connections_workflow_id ON node_connections(workflow_id);
CREATE INDEX idx_node_connections_source ON node_connections(source_node_id);
CREATE INDEX idx_node_connections_target ON node_connections(target_node_id);

-- =============================================================================
-- 4. USER CREDENTIALS
-- =============================================================================
-- Simple OAuth token storage per user per service

CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('trello', 'asana', 'gmail')),
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_type) -- One credential per service per user
);

-- Indexes for credentials
CREATE INDEX idx_credentials_user_service ON user_credentials(user_id, service_type);
CREATE INDEX idx_credentials_expires_at ON user_credentials(expires_at);

-- =============================================================================
-- 5. TRELLO NODE CONFIGURATIONS
-- =============================================================================

CREATE TABLE trello_node_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('create_card', 'get_cards', 'update_card', 'delete_card')),
  board_id TEXT,
  list_id TEXT,
  card_name TEXT,
  description TEXT,
  due_date TEXT, -- Store as template string
  labels TEXT[], -- Array of label names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. ASANA NODE CONFIGURATIONS
-- =============================================================================

CREATE TABLE asana_node_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('create_task', 'get_tasks', 'update_task', 'delete_task')),
  project_gid TEXT,
  task_name TEXT,
  notes TEXT,
  assignee_email TEXT,
  due_date TEXT, -- Store as template string
  tags TEXT[], -- Array of tag names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 7. GMAIL NODE CONFIGURATIONS
-- =============================================================================

CREATE TABLE gmail_node_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('send_email', 'get_emails', 'create_draft', 'reply_to_email')),
  to_email TEXT,
  cc_email TEXT,
  subject TEXT,
  body TEXT,
  attachments TEXT[], -- File paths or URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 8. AI NODE CONFIGURATIONS
-- =============================================================================

CREATE TABLE ai_node_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('generate_text', 'analyze_content', 'summarize', 'classify', 'tag')),
  prompt_template TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-3.5-turbo',
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 9. LOGIC NODE CONFIGURATIONS
-- =============================================================================

CREATE TABLE logic_node_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE,
  logic_type TEXT NOT NULL CHECK (logic_type IN ('condition', 'filter', 'delay', 'split')),
  field TEXT,
  operator TEXT CHECK (operator IN ('contains', 'equals', 'startsWith', 'endsWith', 'greaterThan', 'lessThan')),
  value TEXT,
  delay_seconds INTEGER, -- For delay type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 10. TRIGGER NODE CONFIGURATIONS
-- =============================================================================

CREATE TABLE trigger_node_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE UNIQUE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('email', 'webhook', 'schedule')),
  email_filters JSONB DEFAULT '{}'::jsonb, -- Store email filter configuration
  webhook_url TEXT,
  schedule_cron TEXT, -- Cron expression for scheduled triggers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 11. WORKFLOW EXECUTIONS
-- =============================================================================
-- Simple execution tracking without partial execution support

CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  final_output JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  total_execution_time_ms INTEGER
);

-- Indexes for executions
CREATE INDEX idx_executions_user_started ON workflow_executions(user_id, started_at);
CREATE INDEX idx_executions_started_at ON workflow_executions(started_at);
CREATE INDEX idx_executions_status ON workflow_executions(status);

-- =============================================================================
-- 12. NODE EXECUTION RESULTS
-- =============================================================================
-- Store results from each node execution for debugging

CREATE TABLE node_execution_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES nodes(id),
  execution_order INTEGER NOT NULL,
  output_data JSONB DEFAULT '{}'::jsonb,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for node execution results
CREATE INDEX idx_node_results_execution ON node_execution_results(workflow_execution_id);
CREATE INDEX idx_node_results_node ON node_execution_results(node_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_node_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asana_node_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_node_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_node_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logic_node_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_node_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_execution_results ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can manage their own workflows" ON workflows
  FOR ALL USING (auth.uid() = user_id);

-- Nodes policies (through workflow ownership)
CREATE POLICY "Users can manage nodes in their workflows" ON nodes
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  );

-- Node connections policies (through workflow ownership)
CREATE POLICY "Users can manage connections in their workflows" ON node_connections
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.uid()
    )
  );

-- Credentials policies
CREATE POLICY "Users can manage their own credentials" ON user_credentials
  FOR ALL USING (auth.uid() = user_id);

-- Node config policies (through node ownership)
CREATE POLICY "Users can manage trello configs in their nodes" ON trello_node_configs
  FOR ALL USING (
    node_id IN (
      SELECT n.id FROM nodes n
      JOIN workflows w ON n.workflow_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage asana configs in their nodes" ON asana_node_configs
  FOR ALL USING (
    node_id IN (
      SELECT n.id FROM nodes n
      JOIN workflows w ON n.workflow_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage gmail configs in their nodes" ON gmail_node_configs
  FOR ALL USING (
    node_id IN (
      SELECT n.id FROM nodes n
      JOIN workflows w ON n.workflow_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage ai configs in their nodes" ON ai_node_configs
  FOR ALL USING (
    node_id IN (
      SELECT n.id FROM nodes n
      JOIN workflows w ON n.workflow_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage logic configs in their nodes" ON logic_node_configs
  FOR ALL USING (
    node_id IN (
      SELECT n.id FROM nodes n
      JOIN workflows w ON n.workflow_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage trigger configs in their nodes" ON trigger_node_configs
  FOR ALL USING (
    node_id IN (
      SELECT n.id FROM nodes n
      JOIN workflows w ON n.workflow_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

-- Execution policies
CREATE POLICY "Users can manage their own executions" ON workflow_executions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their execution results" ON node_execution_results
  FOR ALL USING (
    workflow_execution_id IN (
      SELECT id FROM workflow_executions WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to clean old executions (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_executions()
RETURNS void AS $$
BEGIN
  -- Delete executions older than 30 days
  DELETE FROM workflow_executions 
  WHERE started_at < NOW() - INTERVAL '30 days';
  
  -- Log cleanup activity
  RAISE NOTICE 'Cleaned up old workflow executions older than 30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has running execution (enforce single execution limit)
CREATE OR REPLACE FUNCTION has_running_execution(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workflow_executions 
    WHERE user_id = user_uuid AND status = 'running'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get execution order for a workflow (topological sort)
CREATE OR REPLACE FUNCTION get_workflow_execution_order(workflow_uuid UUID)
RETURNS TABLE(node_id UUID, execution_level INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE execution_order AS (
    -- Start with nodes that have no dependencies (root nodes)
    SELECT 
      n.id,
      0 as execution_level
    FROM nodes n
    WHERE n.workflow_id = workflow_uuid
      AND n.id NOT IN (
        SELECT target_node_id 
        FROM node_connections 
        WHERE workflow_id = workflow_uuid
      )
    
    UNION ALL
    
    -- Add nodes whose dependencies are satisfied
    SELECT 
      n.id,
      eo.execution_level + 1
    FROM nodes n
    JOIN node_connections nc ON n.id = nc.target_node_id
    JOIN execution_order eo ON nc.source_node_id = eo.id
    WHERE n.workflow_id = workflow_uuid
  )
  SELECT eo.id, eo.execution_level
  FROM execution_order eo
  ORDER BY eo.execution_level, eo.id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update last_modified_at when workflow is updated
CREATE OR REPLACE FUNCTION update_workflow_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_modified_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_modified_at();

-- Update credentials updated_at timestamp
CREATE OR REPLACE FUNCTION update_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credentials_updated_at
  BEFORE UPDATE ON user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_credentials_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE workflows IS 'Stores workflow definitions with manual save functionality';
COMMENT ON TABLE nodes IS 'Basic node information with references to specific configuration tables';
COMMENT ON TABLE node_connections IS 'Simple DAG connections between nodes';
COMMENT ON TABLE user_credentials IS 'OAuth token storage per user per service';
COMMENT ON TABLE trello_node_configs IS 'Configuration for Trello action nodes';
COMMENT ON TABLE asana_node_configs IS 'Configuration for Asana action nodes';
COMMENT ON TABLE gmail_node_configs IS 'Configuration for Gmail action nodes';
COMMENT ON TABLE ai_node_configs IS 'Configuration for AI processing nodes';
COMMENT ON TABLE logic_node_configs IS 'Configuration for logic/condition nodes';
COMMENT ON TABLE trigger_node_configs IS 'Configuration for trigger nodes';
COMMENT ON TABLE workflow_executions IS 'Simple execution tracking without partial execution support';
COMMENT ON TABLE node_execution_results IS 'Results from each node execution for debugging';

COMMENT ON FUNCTION cleanup_old_executions() IS 'Cleans up workflow executions older than 30 days';
COMMENT ON FUNCTION has_running_execution(UUID) IS 'Checks if user has a running workflow execution';
COMMENT ON FUNCTION get_workflow_execution_order(UUID) IS 'Returns topological sort of nodes for execution order';

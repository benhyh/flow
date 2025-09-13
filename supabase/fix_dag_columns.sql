-- Fix DAG columns in workflows table
-- The execution_order should be TEXT[] not UUID[] since we use client-generated IDs

-- Drop the existing columns if they exist
ALTER TABLE workflows DROP COLUMN IF EXISTS dag_structure;
ALTER TABLE workflows DROP COLUMN IF EXISTS execution_order;

-- Add the correct columns with proper types
ALTER TABLE workflows
  ADD COLUMN dag_structure JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN execution_order TEXT[] DEFAULT ARRAY[]::text[];

-- Add comments
COMMENT ON COLUMN workflows.dag_structure IS 'Array of levels, each level an array of node IDs (can be client-generated)';
COMMENT ON COLUMN workflows.execution_order IS 'Topologically sorted array of node IDs (can be client-generated)';

-- Grant permissions
GRANT ALL ON workflows TO anon, authenticated, service_role;

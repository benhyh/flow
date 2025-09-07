-- SIMPLE RESET - Clean Database for Fresh Start
-- This script safely removes existing schema without errors

-- Step 1: Drop tables if they exist (CASCADE removes dependent objects automatically)
DROP TABLE IF EXISTS public.execution_logs CASCADE;
DROP TABLE IF EXISTS public.workflows CASCADE; 
DROP TABLE IF EXISTS public.user_integrations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Drop functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 3: Clean up any remaining triggers (auth table triggers)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        DROP TRIGGER on_auth_user_created ON auth.users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_updated') THEN
        DROP TRIGGER on_auth_user_updated ON auth.users;
    END IF;
END $$;

-- Step 4: Verify cleanup (should show no results)
SELECT '=== VERIFICATION ===' as status;

SELECT 'Custom Tables:' as check_type, COUNT(*) as remaining_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'workflows', 'user_integrations', 'execution_logs');

SELECT 'Custom Functions:' as check_type, COUNT(*) as remaining_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('handle_new_user', 'handle_user_update', 'update_updated_at_column');

SELECT 'Custom Policies:' as check_type, COUNT(*) as remaining_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Success message
SELECT '🎉 Database reset complete! Now run schema.sql' as final_status;

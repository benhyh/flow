/**
 * Debug Authentication Flow
 * Comprehensive debugging for authentication and user data flow
 */

import { supabase } from './supabase-client'

export async function debugAuthFlow() {
  console.log('🔍 ===== AUTHENTICATION FLOW DEBUG =====')
  
  try {
    // 1. Check Supabase client configuration
    console.log('\n📋 1. Supabase Client Configuration:')
    console.log('URL:', supabase.supabaseUrl)
    console.log('Anon Key exists:', !!supabase.supabaseKey)
    console.log('Anon Key length:', supabase.supabaseKey?.length || 0)
    
    // 2. Check current session
    console.log('\n📋 2. Current Session:')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session error:', sessionError)
    console.log('Session exists:', !!sessionData.session)
    
    if (sessionData.session) {
      console.log('Session user ID:', sessionData.session.user?.id)
      console.log('Session user email:', sessionData.session.user?.email)
      console.log('Session expires at:', sessionData.session.expires_at)
      console.log('Session access token exists:', !!sessionData.session.access_token)
      console.log('Session access token length:', sessionData.session.access_token?.length || 0)
      console.log('Session refresh token exists:', !!sessionData.session.refresh_token)
    }
    
    // 3. Check current user
    console.log('\n📋 3. Current User:')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('User error:', userError)
    console.log('User exists:', !!userData.user)
    
    if (userData.user) {
      console.log('User ID:', userData.user.id)
      console.log('User email:', userData.user.email)
      console.log('User email confirmed:', userData.user.email_confirmed_at)
      console.log('User created at:', userData.user.created_at)
      console.log('User metadata:', userData.user.user_metadata)
      console.log('User app metadata:', userData.user.app_metadata)
    }
    
    // 4. Test a simple database query with explicit auth
    console.log('\n📋 4. Testing Database Query with Explicit Auth:')
    
    // Test 1: Simple count query
    console.log('Test 1: Simple count query...')
    const { data: countData, error: countError } = await supabase
      .from('workflows')
      .select('count', { count: 'exact', head: true })
    
    console.log('Count query error:', countError)
    console.log('Count query result:', countData)
    
    // Test 2: Query with user filter
    if (userData.user) {
      console.log('\nTest 2: Query with user filter...')
      const { data: userWorkflows, error: userError } = await supabase
        .from('workflows')
        .select('id, name, created_at')
        .eq('user_id', userData.user.id)
        .limit(5)
      
      console.log('User workflows error:', userError)
      console.log('User workflows result:', userWorkflows)
    }
    
    // Test 3: Test RLS policies
    console.log('\nTest 3: Testing RLS policies...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('workflows')
      .select('id, name, user_id')
      .limit(1)
    
    console.log('RLS test error:', rlsError)
    console.log('RLS test result:', rlsTest)
    
    // 5. Check if we can access auth functions
    console.log('\n📋 5. Auth Function Access:')
    try {
      const { data: authTest, error: authTestError } = await supabase.rpc('auth.uid')
      console.log('Auth UID function error:', authTestError)
      console.log('Auth UID function result:', authTest)
    } catch (error) {
      console.log('Auth UID function not available:', error)
    }
    
    // 6. Check environment variables
    console.log('\n📋 6. Environment Variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    // 7. Test manual JWT token
    if (sessionData.session?.access_token) {
      console.log('\n📋 7. Manual JWT Token Test:')
      try {
        // Decode JWT token (basic decode, not verification)
        const tokenParts = sessionData.session.access_token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          console.log('JWT payload:', payload)
          console.log('JWT user ID:', payload.sub)
          console.log('JWT expires:', new Date(payload.exp * 1000))
          console.log('JWT issued at:', new Date(payload.iat * 1000))
        }
      } catch (error) {
        console.log('JWT decode error:', error)
      }
    }
    
    console.log('\n✅ ===== AUTHENTICATION FLOW DEBUG COMPLETE =====')
    
    return {
      session: sessionData.session,
      user: userData.user,
      sessionError,
      userError,
      countError,
      userError,
      rlsError
    }
    
  } catch (error) {
    console.error('❌ Authentication flow debug failed:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuthFlow = debugAuthFlow
}

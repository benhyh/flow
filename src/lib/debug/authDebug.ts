/**
 * Authentication Debug Utility
 * 
 * Helps troubleshoot authentication and RLS policy issues
 * Use this to debug 403 permission errors
 */

import { supabase } from '@/lib/supabase-client'

export interface AuthDebugInfo {
  isAuthenticated: boolean
  userId: string | null
  userEmail: string | null
  hasProfile: boolean
  profileData: any
  sessionData: any
  error: string | null
}

/**
 * Get comprehensive authentication debug information
 */
export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasProfile: false,
        profileData: null,
        sessionData: null,
        error: `Session error: ${sessionError.message}`
      }
    }

    const user = sessionData.session?.user
    const isAuthenticated = !!user
    const userId = user?.id || null
    const userEmail = user?.email || null

    if (!isAuthenticated) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasProfile: false,
        profileData: null,
        sessionData,
        error: 'User not authenticated'
      }
    }

    // Check if user has a profile
    let hasProfile = false
    let profileData = null
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn('Profile check error:', profileError)
      } else {
        hasProfile = !!profile
        profileData = profile
      }
    } catch (profileError) {
      console.warn('Profile lookup failed:', profileError)
    }

    return {
      isAuthenticated,
      userId,
      userEmail,
      hasProfile,
      profileData,
      sessionData,
      error: null
    }

  } catch (error) {
    return {
      isAuthenticated: false,
      userId: null,
      userEmail: null,
      hasProfile: false,
      profileData: null,
      sessionData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test database permissions
 */
export async function testDatabasePermissions() {
  const debugInfo = await getAuthDebugInfo()
  
  console.log('🔍 Authentication Debug Info:')
  console.log('============================')
  console.log('Authenticated:', debugInfo.isAuthenticated)
  console.log('User ID:', debugInfo.userId)
  console.log('User Email:', debugInfo.userEmail)
  console.log('Has Profile:', debugInfo.hasProfile)
  console.log('Profile Data:', debugInfo.profileData)
  console.log('Error:', debugInfo.error)
  
  if (!debugInfo.isAuthenticated) {
    console.log('❌ User not authenticated - please sign in first')
    return debugInfo
  }

  if (!debugInfo.hasProfile) {
    console.log('⚠️ User has no profile record - this may cause 403 errors')
    console.log('💡 Try signing out and back in to trigger profile creation')
  }

  // Test workflows table access
  try {
    console.log('\n📋 Testing workflows table access...')
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select('id, name, created_at')
      .limit(1)

    if (workflowError) {
      console.log('❌ Workflows access error:', workflowError.message)
      console.log('💡 This might be due to RLS policies - run fix_rls_policies.sql')
    } else {
      console.log('✅ Workflows table accessible')
      console.log('Found workflows:', workflows?.length || 0)
    }
  } catch (error) {
    console.log('❌ Workflows test failed:', error)
  }

  // Test user_integrations table access
  try {
    console.log('\n🔗 Testing user_integrations table access...')
    const { data: integrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select('id, provider, created_at')
      .limit(1)

    if (integrationsError) {
      console.log('❌ User integrations access error:', integrationsError.message)
    } else {
      console.log('✅ User integrations table accessible')
      console.log('Found integrations:', integrations?.length || 0)
    }
  } catch (error) {
    console.log('❌ User integrations test failed:', error)
  }

  return debugInfo
}

/**
 * Create a profile if one doesn't exist
 */
export async function ensureProfile() {
  const debugInfo = await getAuthDebugInfo()
  
  if (!debugInfo.isAuthenticated) {
    throw new Error('User not authenticated')
  }

  if (debugInfo.hasProfile) {
    console.log('✅ Profile already exists')
    return debugInfo.profileData
  }

  console.log('🔄 Creating profile...')
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([{
        id: debugInfo.userId,
        email: debugInfo.userEmail,
        last_active_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create profile:', error.message)
      throw error
    }

    console.log('✅ Profile created successfully')
    return profile
  } catch (error) {
    console.error('❌ Profile creation failed:', error)
    throw error
  }
}

/**
 * Authentication Refresh Utility
 * Forces a fresh authentication session to resolve token issues
 */

import { supabase } from '@/lib/supabase-client'

export async function forceAuthRefresh() {
  console.log('🔄 Forcing authentication refresh...')
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
      return false
    }
    
    if (!session) {
      console.log('❌ No active session')
      return false
    }
    
    console.log('Current session token (first 20 chars):', session.access_token.substring(0, 20) + '...')
    
    // Force refresh the token
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.log('❌ Refresh error:', refreshError.message)
      return false
    }
    
    if (refreshData.session) {
      console.log('✅ Token refreshed successfully')
      console.log('New session token (first 20 chars):', refreshData.session.access_token.substring(0, 20) + '...')
      return true
    }
    
    return false
    
  } catch (error) {
    console.log('❌ Auth refresh failed:', error)
    return false
  }
}

export async function signOutAndBackIn() {
  console.log('🔄 Signing out and back in...')
  
  try {
    // Sign out
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message)
      return false
    }
    
    console.log('✅ Signed out successfully')
    console.log('💡 Please sign back in manually to complete the refresh')
    
    // Reload the page to clear any cached state
    window.location.reload()
    
    return true
    
  } catch (error) {
    console.log('❌ Sign out failed:', error)
    return false
  }
}

export default { forceAuthRefresh, signOutAndBackIn }

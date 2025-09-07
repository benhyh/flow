/**
 * Test Authentication
 * Simple test to verify if authentication is working properly
 */

import { supabase } from './supabase-client'

/**
 * Test authentication status
 */
export async function testAuthentication() {
  console.log('🔍 Testing Authentication...')
  
  try {
    // Test 1: Check current session
    console.log('📝 Test 1: Checking current session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return false
    }
    
    console.log('✅ Session check successful')
    console.log('Session exists:', !!sessionData.session)
    
    if (sessionData.session) {
      console.log('User ID:', sessionData.session.user.id)
      console.log('Access token exists:', !!sessionData.session.access_token)
      console.log('Token expires at:', new Date(sessionData.session.expires_at * 1000))
      console.log('Is expired:', Date.now() > sessionData.session.expires_at * 1000)
    } else {
      console.log('❌ No active session found')
      return false
    }
    
    // Test 2: Check current user
    console.log('📝 Test 2: Checking current user...')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User error:', userError.message)
      return false
    }
    
    console.log('✅ User check successful')
    console.log('User exists:', !!userData.user)
    
    if (userData.user) {
      console.log('User ID:', userData.user.id)
      console.log('Email:', userData.user.email)
      console.log('Email confirmed:', userData.user.email_confirmed_at)
    } else {
      console.log('❌ No user found')
      return false
    }
    
    // Test 3: Test a simple database request with authentication
    console.log('📝 Test 3: Testing authenticated database request...')
    const { data: testData, error: testError } = await supabase
      .from('workflows')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database request error:', testError.message)
      console.error('Error details:', testError)
      return false
    }
    
    console.log('✅ Authenticated database request successful')
    console.log('Test data:', testData)
    
    return true
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error)
    return false
  }
}

/**
 * Test if we can make a request with explicit headers
 */
export async function testExplicitAuth() {
  console.log('🔍 Testing Explicit Authentication...')
  
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('❌ No valid session for explicit auth test')
      return false
    }
    
    console.log('📝 Making request with explicit Authorization header...')
    
    // Make a request with explicit headers
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/workflows?select=count&limit=1`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Explicit auth request successful:', data)
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Explicit auth request failed:', response.status, errorText)
      return false
    }
    
  } catch (error) {
    console.error('❌ Explicit auth test failed:', error)
    return false
  }
}

/**
 * Run all authentication tests
 */
export async function runAllAuthTests() {
  console.log('🚀 Running All Authentication Tests...')
  console.log('=' .repeat(50))
  
  const results = {
    authentication: false,
    explicitAuth: false
  }
  
  // Test basic authentication
  results.authentication = await testAuthentication()
  
  if (results.authentication) {
    // Test explicit auth
    results.explicitAuth = await testExplicitAuth()
  }
  
  console.log('=' .repeat(50))
  console.log('📊 Test Results:')
  console.log('- Authentication:', results.authentication ? '✅ PASS' : '❌ FAIL')
  console.log('- Explicit Auth:', results.explicitAuth ? '✅ PASS' : '❌ FAIL')
  
  const allPassed = Object.values(results).every(result => result === true)
  console.log('=' .repeat(50))
  console.log(allPassed ? '🎉 All authentication tests passed!' : '❌ Some authentication tests failed')
  
  if (!allPassed) {
    console.log('')
    console.log('💡 Troubleshooting:')
    if (!results.authentication) {
      console.log('- User needs to be logged in')
      console.log('- Check if session is expired')
      console.log('- Try logging out and back in')
    }
    if (!results.explicitAuth) {
      console.log('- Check Supabase environment variables')
      console.log('- Verify the API key is correct')
    }
  }
  
  return allPassed
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testAuth = runAllAuthTests
}

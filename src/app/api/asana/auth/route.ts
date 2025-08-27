import { NextRequest, NextResponse } from 'next/server'
import { createAsanaClient } from '@/lib/asana-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const returnUrl = searchParams.get('return_url') || `${request.nextUrl.origin}/auth/asana/callback`
    
    // Generate PKCE parameters
    const { generatePKCE, generateOAuthState } = await import('@/lib/asana-api')
    const { codeVerifier, codeChallenge } = await generatePKCE()
    const state = generateOAuthState()
    
    // Store PKCE parameters in session (we'll need to implement session storage)
    // For now, we'll return them in the response and handle storage on the client
    const asanaClient = createAsanaClient()
    const authUrl = asanaClient.generateAuthUrl(returnUrl, ['users:read', 'projects:read', 'tasks:read', 'tasks:write'], state, codeChallenge)
    
    return NextResponse.json({ 
      authUrl,
      codeVerifier,
      state
    })
  } catch (error) {
    console.error('Asana auth URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Asana authorization URL' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }
    
    // Test the token by making a request to Asana API
    const asanaClient = createAsanaClient(accessToken, refreshToken)
    const isValid = await asanaClient.testConnection()
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Asana token' },
        { status: 401 }
      )
    }
    
    // Get user info to confirm connection
    const userInfo = await asanaClient.getCurrentUser()
    
    return NextResponse.json({ 
      success: true, 
      user: {
        gid: userInfo.gid,
        name: userInfo.name,
        email: userInfo.email
      }
    })
  } catch (error) {
    console.error('Asana token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate Asana token' },
      { status: 500 }
    )
  }
}

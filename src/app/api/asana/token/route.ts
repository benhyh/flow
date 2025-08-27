import { NextRequest, NextResponse } from 'next/server'
import { createAsanaClient } from '@/lib/asana-api'

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri, codeVerifier } = await request.json()
    
    if (!code || !redirectUri || !codeVerifier) {
      return NextResponse.json(
        { error: 'Code, redirect URI, and code verifier are required' },
        { status: 400 }
      )
    }
    
    // Exchange authorization code for tokens
    const asanaClient = createAsanaClient()
    const tokens = await asanaClient.exchangeCodeForTokens(code, redirectUri, codeVerifier)
    
    return NextResponse.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      user: tokens.data
    })
  } catch (error) {
    console.error('Asana token exchange error:', error)
    return NextResponse.json(
      { error: 'Failed to exchange authorization code for tokens' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }
    
    // Refresh the access token
    const asanaClient = createAsanaClient()
    const tokens = await asanaClient.refreshAccessToken(refreshToken)
    
    return NextResponse.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in
    })
  } catch (error) {
    console.error('Asana token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh access token' },
      { status: 500 }
    )
  }
}

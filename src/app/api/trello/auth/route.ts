import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const returnUrl = searchParams.get('return_url') || `${request.nextUrl.origin}/auth/trello/callback`
    
    const trelloClient = createTrelloClient()
    const authUrl = trelloClient.generateAuthUrl(returnUrl, 'read,write', '30days')
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Trello auth URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Trello authorization URL' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }
    
    // Test the token by making a request to Trello API
    const trelloClient = createTrelloClient(token)
    const isValid = await trelloClient.testConnection()
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Trello token' },
        { status: 401 }
      )
    }
    
    // Get user info to confirm connection
    const userInfo = await trelloClient.getCurrentUser()
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: userInfo.id,
        username: userInfo.username,
        fullName: userInfo.fullName,
        email: userInfo.email
      }
    })
  } catch (error) {
    console.error('Trello token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate Trello token' },
      { status: 500 }
    )
  }
}

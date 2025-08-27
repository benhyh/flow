import { NextRequest, NextResponse } from 'next/server'
import { createAsanaClient } from '@/lib/asana-api'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or query parameter
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('accessToken')
    const refreshToken = request.nextUrl.searchParams.get('refreshToken')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Asana access token not found. Please provide token in Authorization header or as query parameter.' },
        { status: 401 }
      )
    }

    // Create Asana client with token
    const asanaClient = createAsanaClient(accessToken, refreshToken)
    
    // Test connection first
    const isConnected = await asanaClient.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Invalid or expired Asana token. Please re-authorize.' },
        { status: 401 }
      )
    }
    
    // Fetch workspaces using the client
    const workspaces = await asanaClient.getWorkspaces()
    
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Asana workspaces fetch error:', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Access denied. Please check your Asana authorization.' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch workspaces: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching workspaces' },
      { status: 500 }
    )
  }
}

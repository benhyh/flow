import { NextRequest, NextResponse } from 'next/server'
import { createAsanaClient } from '@/lib/asana-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')
    
    // Get token from Authorization header or query parameter
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') || searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    
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
    
    // Fetch projects using the client
    const projects = await asanaClient.getProjects(workspaceId || undefined)
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Asana projects fetch error:', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Workspace not found. Please check the Workspace ID.' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Access denied. Please check your Asana authorization.' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch projects: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching projects' },
      { status: 500 }
    )
  }
}

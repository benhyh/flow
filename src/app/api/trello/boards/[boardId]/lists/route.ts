import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const { boardId } = params

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      )
    }

    // Get token from Authorization header or query parameter
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Trello token not found. Please provide token in Authorization header or as query parameter.' },
        { status: 401 }
      )
    }

    // Create Trello client with token
    const trelloClient = createTrelloClient(token)
    
    // Fetch board lists using the client
    const lists = await trelloClient.getBoardLists(boardId)
    
    return NextResponse.json(lists)
  } catch (error) {
    console.error('Trello board lists fetch error:', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Board not found. Please check the Board ID.' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Access denied. Please check your Trello authorization.' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch board lists: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching board lists' },
      { status: 500 }
    )
  }
}

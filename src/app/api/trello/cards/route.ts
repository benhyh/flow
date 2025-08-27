import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient, type TrelloCreateCardRequest } from '@/lib/trello-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, cardData } = body as {
      token: string
      cardData: TrelloCreateCardRequest
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Trello token is required' },
        { status: 401 }
      )
    }
    
    if (!cardData) {
      return NextResponse.json(
        { error: 'Card data is required' },
        { status: 400 }
      )
    }
    
    if (!cardData.idList) {
      return NextResponse.json(
        { error: 'Board List ID (idList) is required to create a card' },
        { status: 400 }
      )
    }
    
    if (!cardData.name) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }
    
    const trelloClient = createTrelloClient(token)
    
    // Test connection first
    const isConnected = await trelloClient.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Invalid or expired Trello token. Please re-authorize.' },
        { status: 401 }
      )
    }
    
    // Create the card
    const newCard = await trelloClient.createCard(cardData)
    
    return NextResponse.json({
      success: true,
      card: newCard
    })
  } catch (error) {
    console.error('Trello card creation error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('invalid token')) {
        return NextResponse.json(
          { error: 'Invalid or expired Trello token. Please re-authorize.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        return NextResponse.json(
          { error: `Invalid request: ${error.message}` },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create Trello card' },
      { status: 500 }
    )
  }
}

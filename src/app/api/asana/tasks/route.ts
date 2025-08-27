import { NextRequest, NextResponse } from 'next/server'
import { createAsanaClient, type AsanaCreateTaskRequest } from '@/lib/asana-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, refreshToken, taskData } = body as {
      accessToken: string
      refreshToken?: string
      taskData: AsanaCreateTaskRequest
    }
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Asana access token is required' },
        { status: 401 }
      )
    }
    
    if (!taskData) {
      return NextResponse.json(
        { error: 'Task data is required' },
        { status: 400 }
      )
    }
    
    if (!taskData.name) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 }
      )
    }
    
    const asanaClient = createAsanaClient(accessToken, refreshToken)
    
    // Test connection first
    const isConnected = await asanaClient.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Invalid or expired Asana token. Please re-authorize.' },
        { status: 401 }
      )
    }
    
    // Create the task
    const newTask = await asanaClient.createTask(taskData)
    
    return NextResponse.json({
      success: true,
      task: newTask
    })
  } catch (error) {
    console.error('Asana task creation error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('invalid token')) {
        return NextResponse.json(
          { error: 'Invalid or expired Asana token. Please re-authorize.' },
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
      { error: 'Failed to create Asana task' },
      { status: 500 }
    )
  }
}

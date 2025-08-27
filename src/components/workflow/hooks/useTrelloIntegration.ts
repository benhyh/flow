import { useState, useEffect, useCallback } from 'react'
import { getTrelloTokenFromStorage, saveTrelloTokenToStorage, clearTrelloTokenFromStorage, type TrelloCreateCardRequest } from '@/lib/trello-api'

export interface TrelloExecutionResult {
  success: boolean
  duration: number
  error?: string
  cardId?: string
  cardUrl?: string
  cardName?: string
}

export interface TrelloUser {
  id: string
  username: string
  fullName: string
  email?: string
}

export function useTrelloIntegration() {
  const [hasTrelloAccess, setHasTrelloAccess] = useState(false)
  const [trelloUser, setTrelloUser] = useState<TrelloUser | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const checkTrelloAuth = useCallback(async () => {
    setIsCheckingAuth(true)
    try {
      const token = getTrelloTokenFromStorage()
      if (!token) {
        setHasTrelloAccess(false)
        setTrelloUser(null)
        setIsCheckingAuth(false)
        return
      }

      // Validate token by making API call
      const response = await fetch('/api/trello/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        setHasTrelloAccess(true)
        setTrelloUser(data.user)
      } else {
        // Token is invalid, clear it
        clearTrelloTokenFromStorage()
        setHasTrelloAccess(false)
        setTrelloUser(null)
      }
    } catch (error) {
      console.error('Trello auth check failed:', error)
      setHasTrelloAccess(false)
      setTrelloUser(null)
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  // Check Trello authentication status on mount
  useEffect(() => {
    checkTrelloAuth()
  }, [checkTrelloAuth])

  // Listen for Trello OAuth success messages from popup
  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'TRELLO_OAUTH_SUCCESS') {
        // Refresh auth state when popup completes successfully
        checkTrelloAuth()
      }
    }

    window.addEventListener('message', messageListener)
    return () => window.removeEventListener('message', messageListener)
  }, [checkTrelloAuth])

  const generateTrelloAuthUrl = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/trello/auth')
      if (!response.ok) {
        throw new Error('Failed to generate Trello auth URL')
      }
      
      const data = await response.json()
      return data.authUrl
    } catch (error) {
      console.error('Failed to generate Trello auth URL:', error)
      throw error
    }
  }, [])

  const handleTrelloAuthCallback = useCallback(async (token: string) => {
    try {
      // Validate the token
      const response = await fetch('/api/trello/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        saveTrelloTokenToStorage(token)
        setHasTrelloAccess(true)
        setTrelloUser(data.user)
        return true
      } else {
        throw new Error('Invalid Trello token')
      }
    } catch (error) {
      console.error('Trello auth callback failed:', error)
      return false
    }
  }, [])

  const signOutTrello = useCallback(() => {
    clearTrelloTokenFromStorage()
    setHasTrelloAccess(false)
    setTrelloUser(null)
  }, [])

  const createTrelloCard = useCallback(async (cardData: TrelloCreateCardRequest): Promise<TrelloExecutionResult> => {
    const startTime = Date.now()
    
    try {
      const token = getTrelloTokenFromStorage()
      if (!token) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'No Trello access token available. Please authorize Trello first.'
        }
      }

      if (!cardData.idList) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'Board List ID is required to create a Trello card'
        }
      }

      if (!cardData.name) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'Card name is required'
        }
      }

      const response = await fetch('/api/trello/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          cardData
        })
      })

      const duration = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          duration,
          cardId: data.card.id,
          cardUrl: data.card.url,
          cardName: data.card.name
        }
      } else {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid, clear it
          clearTrelloTokenFromStorage()
          setHasTrelloAccess(false)
          setTrelloUser(null)
        }
        
        return {
          success: false,
          duration,
          error: errorData.error || 'Failed to create Trello card'
        }
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unexpected error creating Trello card'
      }
    }
  }, [])

  return {
    hasTrelloAccess,
    trelloUser,
    isCheckingAuth,
    checkTrelloAuth,
    generateTrelloAuthUrl,
    handleTrelloAuthCallback,
    signOutTrello,
    createTrelloCard
  }
}

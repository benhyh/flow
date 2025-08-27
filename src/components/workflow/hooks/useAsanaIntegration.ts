import { useState, useCallback, useEffect } from 'react'
import { 
  getAsanaTokensFromStorage, 
  saveAsanaTokensToStorage, 
  clearAsanaTokensFromStorage,
  type AsanaCreateTaskRequest,
  type AsanaExecutionResult
} from '@/lib/asana-api'

export interface AsanaUser {
  gid: string
  name: string
  email: string
}

export function useAsanaIntegration() {
  const [hasAsanaAccess, setHasAsanaAccess] = useState(false)
  const [asanaUser, setAsanaUser] = useState<AsanaUser | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const checkAsanaAuth = useCallback(async () => {
    setIsCheckingAuth(true)
    try {
      const tokens = getAsanaTokensFromStorage()
      if (!tokens) {
        setHasAsanaAccess(false)
        setAsanaUser(null)
        setIsCheckingAuth(false)
        return
      }

      // Validate token by making API call
      const response = await fetch('/api/asana/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        })
      })

      if (response.ok) {
        const data = await response.json()
        setHasAsanaAccess(true)
        setAsanaUser(data.user)
      } else {
        // Token is invalid, clear it
        clearAsanaTokensFromStorage()
        setHasAsanaAccess(false)
        setAsanaUser(null)
      }
    } catch (error) {
      console.error('Asana auth check failed:', error)
      setHasAsanaAccess(false)
      setAsanaUser(null)
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  // Check Asana authentication status on mount
  useEffect(() => {
    checkAsanaAuth()
  }, [checkAsanaAuth])

  // Listen for Asana OAuth success messages from popup
  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'ASANA_OAUTH_SUCCESS') {
        // Refresh auth state when popup completes successfully
        checkAsanaAuth()
      }
    }

    window.addEventListener('message', messageListener)
    return () => window.removeEventListener('message', messageListener)
  }, [checkAsanaAuth])

  const generateAsanaAuthUrl = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/asana/auth')
      if (!response.ok) {
        throw new Error('Failed to generate Asana auth URL')
      }
      
      const data = await response.json()
      
      // Store PKCE parameters in sessionStorage for the callback
      sessionStorage.setItem('asana_code_verifier', data.codeVerifier)
      sessionStorage.setItem('asana_oauth_state', data.state)
      sessionStorage.setItem('asana_redirect_uri', `${window.location.origin}/auth/asana/callback`)
      
      return data.authUrl
    } catch (error) {
      console.error('Failed to generate Asana auth URL:', error)
      throw error
    }
  }, [])

  const handleAsanaAuthCallback = useCallback(async (
    code: string, 
    redirectUri: string, 
    codeVerifier: string
  ): Promise<boolean> => {
    try {
      // Exchange authorization code for tokens
      const response = await fetch('/api/asana/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          code, 
          redirectUri, 
          codeVerifier 
        })
      })

      if (response.ok) {
        const data = await response.json()
        saveAsanaTokensToStorage(data.accessToken, data.refreshToken)
        setHasAsanaAccess(true)
        setAsanaUser(data.user)
        return true
      } else {
        throw new Error('Invalid authorization code')
      }
    } catch (error) {
      console.error('Asana auth callback failed:', error)
      return false
    }
  }, [])

  const signOutAsana = useCallback(() => {
    clearAsanaTokensFromStorage()
    setHasAsanaAccess(false)
    setAsanaUser(null)
  }, [])

  const createAsanaTask = useCallback(async (taskData: AsanaCreateTaskRequest): Promise<AsanaExecutionResult> => {
    const startTime = Date.now()
    
    try {
      const tokens = getAsanaTokensFromStorage()
      if (!tokens) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'No Asana access token available. Please authorize Asana first.'
        }
      }

      if (!taskData.name) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'Task name is required'
        }
      }

      const response = await fetch('/api/asana/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          taskData
        })
      })

      const duration = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          duration,
          taskId: data.task.gid,
          taskUrl: data.task.permalink_url,
          taskName: data.task.name
        }
      } else {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid, clear it
          clearAsanaTokensFromStorage()
          setHasAsanaAccess(false)
          setAsanaUser(null)
        }
        
        return {
          success: false,
          duration,
          error: errorData.error || 'Failed to create Asana task'
        }
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }, [])

  return {
    hasAsanaAccess,
    asanaUser,
    isCheckingAuth,
    generateAsanaAuthUrl,
    handleAsanaAuthCallback,
    createAsanaTask,
    signOutAsana,
    checkAsanaAuth
  }
}

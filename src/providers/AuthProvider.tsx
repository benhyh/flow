'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface AuthUser {
  id: string
  email?: string
  email_confirmed_at?: string
  created_at?: string
  updated_at?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    preferred_username?: string
    provider?: string
    [key: string]: unknown
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
    [key: string]: unknown
  }
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  initializing: boolean
  error: string | null
  isAuthenticated: boolean
  isEmailConfirmed: boolean
}

export interface AuthResult {
  success: boolean
  data?: unknown
  error?: string
  user?: AuthUser | null
  session?: Session | null
  isInformational?: boolean // Flag to distinguish informational messages from errors
}

export interface AuthMethods {
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
  clearError: () => void
}

export interface AuthContextType extends AuthState, AuthMethods {}

// =============================================================================
// AUTH CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initializing: true,
    error: null,
    isAuthenticated: false,
    isEmailConfirmed: false,
  })

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const setError = useCallback(
    (error: string | null) => {
      updateState({ error, loading: false })
    },
    [updateState]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const handleAuthError = useCallback(
    (error: AuthError | Error | unknown): string => {
      let errorMessage = 'An unexpected error occurred'

      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        // Map common Supabase errors to user-friendly messages
        const errorMappings: Record<string, string> = {
          'Invalid login credentials':
            'Invalid email or password. Please check your credentials and try again.',
          'Email not confirmed':
            'Please check your email and click the confirmation link before signing in.',
          'User not found': 'No account found with this email address.',
          'Password should be at least 6 characters':
            'Password must be at least 6 characters long.',
          'Unable to validate email address':
            'Please enter a valid email address.',
          'Email rate limit exceeded':
            'Too many requests. Please wait a moment and try again.',
          'Token has expired':
            'Your session has expired. Please sign in again.',
          'Invalid refresh token':
            'Your session has expired. Please sign in again.',
        }

        errorMessage = errorMappings[error.message] || error.message
      }

      return errorMessage
    },
    []
  )

  const transformUser = useCallback((user: User | null): AuthUser | null => {
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
    }
  }, [])

  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================

  const handleAuthStateChange = useCallback(
    async (session: Session | null) => {
      const user = transformUser(session?.user || null)

      updateState({
        user,
        session,
        loading: false,
        initializing: false,
        isAuthenticated: !!user,
        isEmailConfirmed: !!user?.email_confirmed_at,
        error: null,
      })
    },
    [transformUser, updateState]
  )

  const initializeAuth = useCallback(async () => {
    try {
      updateState({ loading: true, initializing: true, error: null })

      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      await handleAuthStateChange(session)
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)

      updateState({
        loading: false,
        initializing: false,
        user: null,
        session: null,
        isAuthenticated: false,
        isEmailConfirmed: false,
      })
    }
  }, [handleAuthStateChange, handleAuthError, setError, updateState])

  // =============================================================================
  // AUTHENTICATION METHODS
  // =============================================================================

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        updateState({ loading: true, error: null })

        console.log('[AuthProvider] Attempting sign in with email:', email)

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          console.error('[AuthProvider] Sign in error:', error)
          const errorMessage = handleAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        console.log('[AuthProvider] Sign in successful:', data.user?.email)

        return {
          success: true,
          data,
          user: transformUser(data?.user || null),
          session: data?.session || null,
        }
      } catch (error) {
        console.error('[AuthProvider] Sign in exception:', error)
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [updateState, setError, handleAuthError, transformUser]
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        updateState({ loading: true, error: null })

        console.log('[AuthProvider] Attempting sign up with email:', email)

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) {
          console.error('[AuthProvider] Sign up error:', error)
          const errorMessage = handleAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        console.log('[AuthProvider] Sign up response:', {
          user: data.user?.email,
          session: !!data.session,
          needsConfirmation: !data.session && data.user,
        })

        // Check if email confirmation is required
        if (data.user && !data.session) {
          const message =
            'Please check your email and click the confirmation link to complete registration.'
          setError(message)
          return {
            success: true,
            error: message,
            user: transformUser(data.user),
            session: null,
            isInformational: true, // Mark as informational, not an error
          }
        }

        return {
          success: true,
          data,
          user: transformUser(data?.user || null),
          session: data?.session || null,
        }
      } catch (error) {
        console.error('[AuthProvider] Sign up exception:', error)
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [updateState, setError, handleAuthError, transformUser]
  )

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      updateState({ loading: true, error: null })

      const { error } = await supabase.auth.signOut()

      if (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [updateState, setError, handleAuthError])

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      updateState({ loading: true, error: null })

      // Get the OAuth URL first
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true, // This prevents the redirect and gives us the URL
        },
      })

      if (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      if (!data.url) {
        const errorMessage = 'Failed to get OAuth URL'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Open popup with the OAuth URL
      const popup = window.open(
        data.url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
      )

      if (!popup) {
        const errorMessage = 'Popup blocked. Please allow popups for this site.'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Return a promise that resolves when authentication completes
      return new Promise(resolve => {
        // Listen for messages from the popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'OAUTH_SUCCESS') {
            popup.close()
            window.removeEventListener('message', messageListener)
            updateState({ loading: false })
            resolve({ success: true })
          } else if (event.data.type === 'OAUTH_ERROR') {
            popup.close()
            window.removeEventListener('message', messageListener)
            const errorMessage =
              event.data.error || 'OAuth authentication failed'
            setError(errorMessage)
            resolve({ success: false, error: errorMessage })
          }
        }

        window.addEventListener('message', messageListener)

        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            updateState({ loading: false })
            // Don't treat manual close as an error, user might have cancelled
            resolve({ success: false, error: 'Authentication cancelled' })
          }
        }, 1000)

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          if (!popup.closed) {
            popup.close()
          }
          updateState({ loading: false })
          setError('Authentication timed out')
          resolve({ success: false, error: 'Authentication timed out' })
        }, 300000) // 5 minutes
      })
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [updateState, setError, handleAuthError])

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        updateState({ loading: true, error: null })

        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        )

        if (error) {
          const errorMessage = handleAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        const message =
          'Password reset instructions have been sent to your email.'
        setError(message)
        return {
          success: true,
          error: message,
          isInformational: true,
        }
      } catch (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [updateState, setError, handleAuthError]
  )

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth event:', event, session?.user?.email)
      await handleAuthStateChange(session)
    })

    return () => subscription.unsubscribe()
  }, [handleAuthStateChange])

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: AuthContextType = {
    // State
    ...state,

    // Authentication methods
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,

    // Utilities
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export default AuthProvider

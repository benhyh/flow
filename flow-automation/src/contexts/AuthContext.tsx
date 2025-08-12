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
    [key: string]: any
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
    [key: string]: any
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
  data?: any
  error?: string
  user?: AuthUser | null
  session?: Session | null
}

export interface AuthMethods {
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
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
    (error: AuthError | Error | any): string => {
      let errorMessage = 'An unexpected error occurred'

      if (error?.message) {
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

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          const errorMessage = handleAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        return {
          success: true,
          data,
          user: transformUser(data?.user || null),
          session: data?.session || null,
        }
      } catch (error) {
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

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) {
          const errorMessage = handleAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        return {
          success: true,
          data,
          user: transformUser(data?.user || null),
          session: data?.session || null,
        }
      } catch (error) {
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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [updateState, setError, handleAuthError])

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

    // Utilities
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export default AuthProvider

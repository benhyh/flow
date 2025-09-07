'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: error.message
            }, window.location.origin)
          }
          window.close()
          return
        }

        if (data.session) {
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              session: data.session
            }, window.location.origin)
          }
          window.close()
        } else {
          // No session yet, wait for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_SUCCESS',
                  session: session
                }, window.location.origin)
              }
              subscription.unsubscribe()
              window.close()
            } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
              // Handle other events if needed
            }
          })

          // Cleanup subscription after 30 seconds if nothing happens
          setTimeout(() => {
            subscription.unsubscribe()
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: 'Authentication timed out'
              }, window.location.origin)
            }
            window.close()
          }, 30000)
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: 'Authentication failed'
          }, window.location.origin)
        }
        window.close()
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1D1D1D]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
        <p className="text-[rgba(250,250,250,0.6)]">Completing authentication...</p>
      </div>
    </div>
  )
}
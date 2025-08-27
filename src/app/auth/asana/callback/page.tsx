'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAsanaIntegration } from '@/components/workflow/hooks/useAsanaIntegration'

export default function AsanaAuthCallback() {
  const router = useRouter()
  const { handleAsanaAuthCallback } = useAsanaIntegration()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Asana authorization...')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Extract authorization code and state from URL query parameters
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Authorization failed: ${error}`)
          
          // Send error message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'ASANA_OAUTH_ERROR',
              error: error
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received from Asana')
          
          // Send error message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'ASANA_OAUTH_ERROR',
              error: 'No authorization code received'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
          return
        }

        // Get stored PKCE parameters from sessionStorage
        const storedCodeVerifier = sessionStorage.getItem('asana_code_verifier')
        const storedState = sessionStorage.getItem('asana_oauth_state')
        const redirectUri = sessionStorage.getItem('asana_redirect_uri')

        if (!storedCodeVerifier || !storedState || !redirectUri) {
          setStatus('error')
          setMessage('Missing OAuth parameters. Please try again.')
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'ASANA_OAUTH_ERROR',
              error: 'Missing OAuth parameters'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
          return
        }

        // Validate state parameter to prevent CSRF attacks
        if (state !== storedState) {
          setStatus('error')
          setMessage('Invalid state parameter. Please try again.')
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'ASANA_OAUTH_ERROR',
              error: 'Invalid state parameter'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
          return
        }

        // Exchange authorization code for tokens
        const success = await handleAsanaAuthCallback(code, redirectUri, storedCodeVerifier)
        
        if (success) {
          setStatus('success')
          setMessage('Successfully authorized with Asana!')
          
          // Clean up stored parameters
          sessionStorage.removeItem('asana_code_verifier')
          sessionStorage.removeItem('asana_oauth_state')
          sessionStorage.removeItem('asana_redirect_uri')
          
          // Send success message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'ASANA_OAUTH_SUCCESS'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 2000)
          }
        } else {
          setStatus('error')
          setMessage('Failed to complete Asana authorization')
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'ASANA_OAUTH_ERROR',
              error: 'Failed to complete authorization'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
        }
      } catch (error) {
        console.error('Asana auth callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during authorization')
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'ASANA_OAUTH_ERROR',
            error: 'An unexpected error occurred'
          }, window.location.origin)
          window.close()
        } else {
          setTimeout(() => router.push('/dashboard'), 3000)
        }
      }
    }

    handleAuth()
  }, [router, handleAsanaAuthCallback])

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[#1d1d1d] border border-[#2d2d2d] rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[#f06a6a] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Asana Authorization</h1>
          </div>
          
          <div className="mb-6">
            {status === 'processing' && (
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f06a6a]"></div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-green-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
            
            <p className={`text-sm ${status === 'error' ? 'text-red-300' : status === 'success' ? 'text-green-300' : 'text-gray-300'}`}>
              {message}
            </p>
          </div>
          
          {status === 'error' && (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#f06a6a] hover:bg-[#e55a5a] text-white px-4 py-2 rounded-md transition-colors"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

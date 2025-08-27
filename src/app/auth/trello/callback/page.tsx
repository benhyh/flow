'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTrelloIntegration } from '@/components/workflow/hooks/useTrelloIntegration'

export default function TrelloAuthCallback() {
  const router = useRouter()
  const { handleTrelloAuthCallback } = useTrelloIntegration()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Trello authorization...')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Extract token from URL fragment
        const hash = window.location.hash
        const params = new URLSearchParams(hash.substring(1)) // Remove the # from hash
        const token = params.get('token')
        const error = params.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Authorization failed: ${error}`)
          
          // Send error message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'TRELLO_OAUTH_ERROR',
              error: error
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
          return
        }

        if (!token) {
          setStatus('error')
          setMessage('No authorization token received from Trello')
          
          // Send error message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'TRELLO_OAUTH_ERROR',
              error: 'No authorization token received'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
          return
        }

        // Validate and store the token
        const success = await handleTrelloAuthCallback(token)
        
        if (success) {
          setStatus('success')
          setMessage('Successfully authorized with Trello!')
          
          // Send success message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'TRELLO_OAUTH_SUCCESS',
              token: token
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 2000)
          }
        } else {
          setStatus('error')
          setMessage('Failed to validate Trello authorization')
          
          // Send error message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({
              type: 'TRELLO_OAUTH_ERROR',
              error: 'Failed to validate authorization'
            }, window.location.origin)
            window.close()
          } else {
            setTimeout(() => router.push('/dashboard'), 3000)
          }
        }
      } catch (error) {
        console.error('Trello auth callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during authorization')
        
        // Send error message to parent window if this is a popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'TRELLO_OAUTH_ERROR',
            error: 'An unexpected error occurred'
          }, window.location.origin)
          window.close()
        } else {
          setTimeout(() => router.push('/dashboard'), 3000)
        }
      }
    }

    handleAuth()
  }, [router, handleTrelloAuthCallback])

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[#1d1d1d] border border-[#2d2d2d] rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[#0079bf] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v12.36zm10.44-6.84c0 .795-.645 1.44-1.44 1.44H15c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v5.52z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Trello Authorization</h1>
          </div>
          
          <div className="mb-6">
            {status === 'processing' && (
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6]"></div>
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
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-md transition-colors"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useTrelloIntegration } from './hooks/useTrelloIntegration'
import { useAsanaIntegration } from './hooks/useAsanaIntegration'
import { toast } from 'sonner'

/**
 * AuthenticationMonitor component
 * Monitors the workspace for nodes requiring authentication and shows notifications
 * Gmail authentication is handled via OAuth during sign-in, so only Trello and Asana need monitoring
 */
export function AuthenticationMonitor() {
  const { getNodes } = useReactFlow()
  const { hasTrelloAccess, generateTrelloAuthUrl } = useTrelloIntegration()
  const { hasAsanaAccess, generateAsanaAuthUrl } = useAsanaIntegration()
  const hasShownTrelloToast = useRef(false)
  const hasShownAsanaToast = useRef(false)

  useEffect(() => {
    const checkAuthRequirements = async () => {
      const nodes = getNodes()
      
      const requiresTrello = nodes.some(node => {
        const nodeData = node.data as Record<string, unknown>
        const nodeType = (nodeData.nodeType as string) || node.type || 'default'
        return nodeType === 'trello-action'
      })

      const requiresAsana = nodes.some(node => {
        const nodeData = node.data as Record<string, unknown>
        const nodeType = (nodeData.nodeType as string) || node.type || 'default'
        return nodeType === 'asana-action'
      })

      // Show Trello auth notification if needed (only once)
      if (requiresTrello && !hasTrelloAccess && !hasShownTrelloToast.current) {
        try {
          const authUrl = await generateTrelloAuthUrl()
          toast.error('Trello Authorization Required', {
            description: 'Your workflow contains Trello nodes. Click to authorize Trello integration.',
            duration: Infinity, // Keep the toast until manually dismissed or auth completed
            action: {
              label: 'Authorize Trello',
              onClick: () => {
                // Open popup similar to Google OAuth
                const popup = window.open(
                  authUrl,
                  'trello-oauth',
                  'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
                )
                
                if (!popup) {
                  toast.error('Popup blocked. Please allow popups for this site.')
                  return
                }

                // Listen for messages from the popup
                const messageListener = (event: MessageEvent) => {
                  if (event.origin !== window.location.origin) return

                  if (event.data.type === 'TRELLO_OAUTH_SUCCESS') {
                    window.removeEventListener('message', messageListener)
                    popup.close()
                    toast.dismiss()
                    toast.success('Trello successfully authorized!', {
                      description: 'You can now use Trello actions in your workflows.',
                      duration: 3000
                    })
                  } else if (event.data.type === 'TRELLO_OAUTH_ERROR') {
                    window.removeEventListener('message', messageListener)
                    popup.close()
                    toast.error('Trello authorization failed', {
                      description: event.data.error || 'Please try again.',
                      duration: 5000
                    })
                  }
                }

                window.addEventListener('message', messageListener)

                // Clean up if popup is closed manually
                const popupCheckInterval = setInterval(() => {
                  if (popup.closed) {
                    clearInterval(popupCheckInterval)
                    window.removeEventListener('message', messageListener)
                  }
                }, 1000)
              }
            }
          })
          hasShownTrelloToast.current = true
        } catch (error) {
          console.error('Failed to generate Trello auth URL:', error)
        }
      }

      // Show Asana auth notification if needed (only once)
      if (requiresAsana && !hasAsanaAccess && !hasShownAsanaToast.current) {
        try {
          const authUrl = await generateAsanaAuthUrl()
          toast.error('Asana Authorization Required', {
            description: 'Your workflow contains Asana nodes. Click to authorize Asana integration.',
            duration: Infinity, // Keep the toast until manually dismissed or auth completed
            action: {
              label: 'Authorize Asana',
              onClick: () => {
                // Open popup similar to Google OAuth
                const popup = window.open(
                  authUrl,
                  'asana-oauth',
                  'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
                )
                
                if (!popup) {
                  toast.error('Popup blocked. Please allow popups for this site.')
                  return
                }

                // Listen for messages from the popup
                const messageListener = (event: MessageEvent) => {
                  if (event.origin !== window.location.origin) return

                  if (event.data.type === 'ASANA_OAUTH_SUCCESS') {
                    window.removeEventListener('message', messageListener)
                    popup.close()
                    toast.dismiss()
                    toast.success('Asana successfully authorized!', {
                      description: 'You can now use Asana actions in your workflows.',
                      duration: 3000
                    })
                  } else if (event.data.type === 'ASANA_OAUTH_ERROR') {
                    window.removeEventListener('message', messageListener)
                    popup.close()
                    toast.error('Asana authorization failed', {
                      description: event.data.error || 'Please try again.',
                      duration: 5000
                    })
                  }
                }

                window.addEventListener('message', messageListener)

                // Clean up if popup is closed manually
                const popupCheckInterval = setInterval(() => {
                  if (popup.closed) {
                    clearInterval(popupCheckInterval)
                    window.removeEventListener('message', messageListener)
                  }
                }, 1000)
              }
            }
          })
          hasShownAsanaToast.current = true
        } catch (error) {
          console.error('Failed to generate Asana auth URL:', error)
        }
      }
    }

    // Check immediately and more frequently for better responsiveness
    checkAuthRequirements()
    
    // Set up a more frequent check (every 2 seconds) to catch node changes quickly
    const interval = setInterval(checkAuthRequirements, 2000)
    
    return () => clearInterval(interval)
  }, [getNodes, hasTrelloAccess, generateTrelloAuthUrl, hasAsanaAccess, generateAsanaAuthUrl])

  // Reset the toast flag when user gets authenticated
  useEffect(() => {
    if (hasTrelloAccess && hasShownTrelloToast.current) {
      hasShownTrelloToast.current = false
      // Dismiss any existing Trello auth toasts
      toast.dismiss()
      toast.success('Trello successfully authorized!', {
        description: 'You can now use Trello actions in your workflows.',
        duration: 3000
      })
    }
  }, [hasTrelloAccess])

  useEffect(() => {
    if (hasAsanaAccess && hasShownAsanaToast.current) {
      hasShownAsanaToast.current = false
      // Dismiss any existing Asana auth toasts
      toast.dismiss()
      toast.success('Asana successfully authorized!', {
        description: 'You can now use Asana actions in your workflows.',
        duration: 3000
      })
      
      // Force a re-check of auth requirements to update the UI
      setTimeout(() => {
        const event = new CustomEvent('asana-auth-updated')
        window.dispatchEvent(event)
      }, 100)
    }
  }, [hasAsanaAccess])

  // This component doesn't render anything visible
  return null
}

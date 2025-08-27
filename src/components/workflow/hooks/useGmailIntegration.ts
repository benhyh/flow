/**
 * Gmail Integration Hook for Workflow System
 * LAZY LOADING: No Gmail clients created until actual execution/testing
 */

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { createGmailClient, EmailTriggerConfig } from '@/lib/gmail-api'
import { PrivacyFirstWorkflowRunner, ProcessedEmailData } from '@/lib/privacy-first-gmail'

export interface GmailExecutionResult {
  success: boolean
  duration: number
  error?: string
  processedEmails?: ProcessedEmailData[]
  emailCount?: number
}

export function useGmailIntegration() {
  const { session } = useAuth()

  // Check if we have Gmail access WITHOUT creating a client
  const hasGmailAccess = useMemo(() => {
    if (!session) return false
    const sessionObj = session as { provider_token?: string } | null
    return !!sessionObj?.provider_token
  }, [session])

  // Get Gmail status WITHOUT creating a client
  const getGmailStatus = useCallback(() => {
    if (!session) {
      return {
        hasAccess: false,
        reason: 'Not authenticated'
      }
    }

    const sessionObj = session as { provider_token?: string } | null
    const hasToken = !!sessionObj?.provider_token

    if (!hasToken) {
      return {
        hasAccess: false,
        reason: 'Gmail access token not available'
      }
    }

    return {
      hasAccess: true,
      reason: 'Gmail access available'
    }
  }, [session])

  // Test Gmail connection - ONLY creates client when explicitly called
  const testGmailConnection = useCallback(async (): Promise<boolean> => {
    console.log('[Gmail Integration] EXPLICIT connection test requested')
    
    if (!session) return false

    try {
      const gmailClient = createGmailClient(session)
      if (!gmailClient) return false

      return await gmailClient.testConnection()
    } catch (error) {
      console.error('Gmail connection test failed:', error)
      return false
    }
  }, [session])

  // Execute Gmail trigger - ONLY creates client during actual execution
  const executeGmailTrigger = useCallback(async (
    config: EmailTriggerConfig,
    userOpenAIKey?: string
  ): Promise<GmailExecutionResult> => {
    const startTime = Date.now()



    if (!session) {
      console.error('[Gmail Integration] No authentication session available')
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'No authentication session available'
      }
    }

    try {

      const gmailClient = createGmailClient(session)
      if (!gmailClient) {
        console.error('[Gmail Integration] Failed to create Gmail client')
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'Gmail access token not available. Please re-authorize.'
        }
      }

      // Validate configuration
      if (!config.senderFilter && !config.subjectContains && (!config.keywords || config.keywords.length === 0)) {
        console.error('[Gmail Integration] No filter criteria specified')
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'At least one filter criteria must be specified (sender, subject, or keywords)'
        }
      }


      const workflowRunner = new PrivacyFirstWorkflowRunner(gmailClient)
      let processedEmails: ProcessedEmailData[] = []


      await workflowRunner.runTrigger(
        config,
        (data) => {
          console.log('[Gmail Integration] Received processed emails:', data.length)
          processedEmails = data
        },
        userOpenAIKey
      )


      return {
        success: true,
        duration: Date.now() - startTime,
        processedEmails,
        emailCount: processedEmails.length
      }

    } catch (error) {
      // Provide more specific error messages
      let errorMessage = 'Unknown Gmail API error'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Handle specific error types - pass through GMAIL_SCOPE_ERROR for special handling
        if (error.message.includes('GMAIL_SCOPE_ERROR')) {
          errorMessage = error.message // Keep the GMAIL_SCOPE_ERROR prefix
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Gmail API returned invalid response. Please check your connection and try again.'
        } else if (error.message.includes('401')) {
          errorMessage = 'Gmail authorization expired. Please re-authenticate with Google.'
        } else if (error.message.includes('403')) {
          errorMessage = 'GMAIL_SCOPE_ERROR: Gmail metadata scope does not support search queries. Please re-authorize with gmail.readonly scope for full access.'
        } else if (error.message.includes('429')) {
          errorMessage = 'Gmail API rate limit exceeded. Please wait a moment and try again.'
        }
      }
      
      return {
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage
      }
    }
  }, [session])

  return {
    testGmailConnection,
    executeGmailTrigger,
    getGmailStatus,
    hasGmailAccess
  }
}
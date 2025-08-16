/**
 * Gmail Integration Hook for Workflow System
 * Provides Gmail API functionality following privacy-first architecture
 */

import { useCallback } from 'react'
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

  // Test Gmail connection
  const testGmailConnection = useCallback(async (): Promise<boolean> => {
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

  // Execute Gmail trigger with privacy-first processing
  const executeGmailTrigger = useCallback(async (
    config: EmailTriggerConfig,
    userOpenAIKey?: string
  ): Promise<GmailExecutionResult> => {
    const startTime = Date.now()

    if (!session) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: 'No authentication session available'
      }
    }

    try {
      const gmailClient = createGmailClient(session)
      if (!gmailClient) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'Gmail access token not available. Please re-authorize.'
        }
      }

      // Validate configuration
      if (!config.senderFilter && !config.subjectContains && (!config.keywords || config.keywords.length === 0)) {
        return {
          success: false,
          duration: Date.now() - startTime,
          error: 'At least one filter criteria must be specified'
        }
      }

      const workflowRunner = new PrivacyFirstWorkflowRunner(gmailClient)
      let processedEmails: ProcessedEmailData[] = []

      await workflowRunner.runTrigger(
        config,
        (data) => {
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
      console.error('Gmail trigger execution failed:', error)
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown Gmail API error'
      }
    }
  }, [session])

  // Get Gmail access status
  const getGmailStatus = useCallback(() => {
    if (!session) {
      return {
        hasAccess: false,
        reason: 'Not authenticated'
      }
    }

    const gmailClient = createGmailClient(session)
    if (!gmailClient) {
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

  return {
    testGmailConnection,
    executeGmailTrigger,
    getGmailStatus,
    hasGmailAccess: !!session && !!createGmailClient(session)
  }
}
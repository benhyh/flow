/**
 * Gmail API Integration for Flow Automation
 * Handles email filtering and message retrieval for workflow triggers
 */

// Global counter for debugging Gmail client instantiations
let gmailClientInstanceCounter = 0

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
  }
  internalDate: string
}

export interface EmailTriggerConfig {
  senderFilter?: string // e.g., "support@company.com"
  subjectContains?: string // e.g., "urgent"
  keywords?: string[] // e.g., ["bug", "error", "issue"]
}

export interface FilteredEmail {
  id: string
  sender: string
  subject: string
  snippet: string
  receivedDate: Date
  threadId: string
}

export class GmailAPIClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
    gmailClientInstanceCounter++
    console.log(`[Gmail API] Creating Gmail client... (Instance #${gmailClientInstanceCounter})`)
  }

  /**
   * Build Gmail API query string based on trigger configuration
   */
  private buildQuery(config: EmailTriggerConfig): string {
    const queryParts: string[] = ['in:inbox'] // Only check inbox

    // Add sender filter
    if (config.senderFilter) {
      queryParts.push(`from:${config.senderFilter}`)
    }

    // Add subject filter
    if (config.subjectContains) {
      queryParts.push(`subject:${config.subjectContains}`)
    }

    // Add keyword filters (OR logic for keywords)
    if (config.keywords && config.keywords.length > 0) {
      const keywordQuery = config.keywords
        .map(keyword => `"${keyword}"`)
        .join(' OR ')
      queryParts.push(`(${keywordQuery})`)
    }

    return queryParts.join(' ')
  }

  /**
   * List messages matching the trigger configuration
   */
  async listMessages(
    config: EmailTriggerConfig,
    maxResults: number = 10
  ): Promise<string[]> {
    const query = this.buildQuery(config)

    console.log('[Gmail API] Listing messages with query:', query)

    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Gmail API] List messages response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        '[Gmail API] List messages error:',
        response.status,
        errorText
      )
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const responseText = await response.text()
    console.log('[Gmail API] Raw response:', responseText)

    if (!responseText.trim()) {
      console.log('[Gmail API] Empty response, returning empty array')
      return []
    }

    try {
      const data = JSON.parse(responseText) as {
        messages?: Array<{ id: string }>
      }
      const messageIds = data.messages?.map(msg => msg.id) || []
      console.log('[Gmail API] Found message IDs:', messageIds)
      return messageIds
    } catch (error) {
      console.error(
        '[Gmail API] JSON parse error:',
        error,
        'Response text:',
        responseText
      )
      throw new Error(`Failed to parse Gmail API response: ${error}`)
    }
  }

  /**
   * Get message details (metadata only for privacy/scope compliance)
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    console.log('[Gmail API] Getting message:', messageId)

    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Gmail API] Get message response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        '[Gmail API] Get message error:',
        response.status,
        errorText
      )
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const responseText = await response.text()
    console.log('[Gmail API] Message response length:', responseText.length)

    if (!responseText.trim()) {
      throw new Error('Empty response from Gmail API for message details')
    }

    try {
      const data = JSON.parse(responseText) as GmailMessage
      console.log('[Gmail API] Parsed message data for:', messageId)
      return data
    } catch (error) {
      console.error(
        '[Gmail API] JSON parse error for message:',
        error,
        'Response text:',
        responseText.substring(0, 200)
      )
      throw new Error(`Failed to parse Gmail message response: ${error}`)
    }
  }

  /**
   * Get filtered emails matching trigger configuration
   */
  async getFilteredEmails(
    config: EmailTriggerConfig,
    maxResults: number = 10
  ): Promise<FilteredEmail[]> {
    try {
      // Get message IDs
      const messageIds = await this.listMessages(config, maxResults)

      if (messageIds.length === 0) {
        return []
      }

      // Get message details
      const messages = await Promise.all(
        messageIds.map(id => this.getMessage(id))
      )

      // Transform to FilteredEmail format
      return messages.map(msg => {
        const headers = msg.payload.headers
        const sender = headers.find(h => h.name === 'From')?.value || 'Unknown'
        const subject =
          headers.find(h => h.name === 'Subject')?.value || 'No Subject'

        return {
          id: msg.id,
          sender,
          subject,
          snippet: msg.snippet,
          receivedDate: new Date(parseInt(msg.internalDate)),
          threadId: msg.threadId,
        }
      })
    } catch (error) {
      console.error('Error fetching filtered emails:', error)
      throw error
    }
  }

  /**
   * Test connection to Gmail API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[Gmail API] Testing connection...')

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log(
        '[Gmail API] Test connection response status:',
        response.status
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          '[Gmail API] Test connection error:',
          response.status,
          errorText
        )
        return false
      }

      const responseText = await response.text()
      console.log(
        '[Gmail API] Test connection response length:',
        responseText.length
      )

      if (!responseText.trim()) {
        console.error('[Gmail API] Empty response from profile endpoint')
        return false
      }

      try {
        JSON.parse(responseText)
        console.log('[Gmail API] Connection test successful')
        return true
      } catch (error) {
        console.error('[Gmail API] JSON parse error in test connection:', error)
        return false
      }
    } catch (error) {
      console.error('[Gmail API] Test connection exception:', error)
      return false
    }
  }
}

/**
 * Helper function to extract Gmail access token from Supabase session
 */
export function extractGmailToken(session: unknown): string | null {
  console.log(`[Gmail API] Extracting token from session: ${!!session} (Instance Context #${gmailClientInstanceCounter})`)

  // Supabase stores provider tokens in session.provider_token
  const sessionObj = session as { provider_token?: string } | null
  const token = sessionObj?.provider_token || null

  console.log(
    `[Gmail API] Token extracted: ${!!token} ${token ? `${token.substring(0, 10)}...` : 'null'} (Instance Context #${gmailClientInstanceCounter})`
  )
  return token
}

/**
 * Create Gmail API client from Supabase session
 */
export function createGmailClient(session: unknown): GmailAPIClient | null {
  const token = extractGmailToken(session)
  if (!token) {
    console.error(`[Gmail API] No token available, cannot create client (Instance Context #${gmailClientInstanceCounter})`)
    return null
  }

  const client = new GmailAPIClient(token)
  console.log(`[Gmail API] Gmail client created successfully (Instance #${gmailClientInstanceCounter})`)
  return client
}

/**
 * Get current Gmail client instance counter for debugging
 */
export function getGmailClientInstanceCount(): number {
  return gmailClientInstanceCounter
}

/**
 * Reset Gmail client instance counter (for debugging)
 */
export function resetGmailClientInstanceCount(): void {
  gmailClientInstanceCounter = 0
  console.log('[Gmail API] Instance counter reset to 0')
}

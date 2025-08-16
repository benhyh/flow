/**
 * Gmail API Integration for Flow Automation
 * Handles email filtering and message retrieval for workflow triggers
 */

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
  senderFilter?: string    // e.g., "support@company.com"
  subjectContains?: string // e.g., "urgent"
  keywords?: string[]      // e.g., ["bug", "error", "issue"]
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
      const keywordQuery = config.keywords.map(keyword => `"${keyword}"`).join(' OR ')
      queryParts.push(`(${keywordQuery})`)
    }

    return queryParts.join(' ')
  }

  /**
   * List messages matching the trigger configuration
   */
  async listMessages(config: EmailTriggerConfig, maxResults: number = 10): Promise<string[]> {
    const query = this.buildQuery(config)
    
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.messages?.map((msg: any) => msg.id) || []
  }

  /**
   * Get message details (metadata only for privacy/scope compliance)
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get filtered emails matching trigger configuration
   */
  async getFilteredEmails(config: EmailTriggerConfig, maxResults: number = 10): Promise<FilteredEmail[]> {
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
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
        
        return {
          id: msg.id,
          sender,
          subject,
          snippet: msg.snippet,
          receivedDate: new Date(parseInt(msg.internalDate)),
          threadId: msg.threadId
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
      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Helper function to extract Gmail access token from Supabase session
 */
export function extractGmailToken(session: any): string | null {
  // Supabase stores provider tokens in session.provider_token
  return session?.provider_token || null
}

/**
 * Create Gmail API client from Supabase session
 */
export function createGmailClient(session: any): GmailAPIClient | null {
  const token = extractGmailToken(session)
  if (!token) {
    return null
  }
  return new GmailAPIClient(token)
}
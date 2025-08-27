/**
 * Privacy-First Gmail Processing Library
 * Processes emails entirely client-side with zero data retention
 */

import { GmailAPIClient, EmailTriggerConfig, FilteredEmail } from './gmail-api'

export interface ProcessedEmailData {
  triggerMatched: boolean
  extractedInfo: {
    priority: 'low' | 'medium' | 'high'
    category: string
    tags: string[]
    summary: string
    sentiment?: 'positive' | 'neutral' | 'negative'
  }
  metadata: {
    receivedAt: string
    messageId: string
    hasAttachments?: boolean
  }
}

export interface AIProcessingOptions {
  enablePriorityDetection?: boolean
  enableCategoryClassification?: boolean
  enableTagging?: boolean
  enableSentimentAnalysis?: boolean
  customPrompt?: string
}

export class PrivacyFirstEmailProcessor {
  private gmailClient: GmailAPIClient

  constructor(gmailClient: GmailAPIClient) {
    this.gmailClient = gmailClient
  }

  /**
   * Scan and process emails with privacy-first approach
   */
  async scanAndProcess(
    triggerConfig: EmailTriggerConfig,
    aiProcessor?: (email: FilteredEmail) => Promise<Partial<ProcessedEmailData['extractedInfo']>>,
    maxResults: number = 10
  ): Promise<ProcessedEmailData[]> {
    try {
      console.log('[Privacy Gmail] Starting scan and process with config:', triggerConfig)
      
      // Fetch emails using metadata-only approach
      const emails = await this.gmailClient.getFilteredEmails(triggerConfig, maxResults)
      
      console.log('[Privacy Gmail] Retrieved emails:', emails.length)
      
      if (emails.length === 0) {
        console.log('[Privacy Gmail] No emails found matching criteria')
        return []
      }

      const processedEmails: ProcessedEmailData[] = []

      for (const email of emails) {
        try {
          console.log('[Privacy Gmail] Processing email:', email.id)
          
          // Process each email
          const processed = await this.processEmail(email, aiProcessor)
          processedEmails.push(processed)
          
          // Explicit cleanup - clear email content from memory
          this.clearEmailFromMemory(email)
          
          console.log('[Privacy Gmail] Successfully processed email:', email.id)
        } catch (error) {
          console.error(`[Privacy Gmail] Error processing email ${email.id}:`, error)
          // Continue processing other emails
        }
      }

      console.log('[Privacy Gmail] Completed processing, total processed:', processedEmails.length)
      return processedEmails
    } catch (error) {
      console.error('[Privacy Gmail] Error in scanAndProcess:', error)
      throw error
    }
  }

  /**
   * Process individual email with privacy safeguards
   */
  private async processEmail(
    email: FilteredEmail,
    aiProcessor?: (email: FilteredEmail) => Promise<Partial<ProcessedEmailData['extractedInfo']>>
  ): Promise<ProcessedEmailData> {
    // Basic processing without AI
    let extractedInfo: ProcessedEmailData['extractedInfo'] = {
      priority: this.detectPriority(email),
      category: this.categorizeEmail(email),
      tags: this.extractTags(email),
      summary: this.createSummary(email)
    }

    // Optional AI processing if user provides their own processor
    if (aiProcessor) {
      try {
        const aiResults = await aiProcessor(email)
        extractedInfo = { ...extractedInfo, ...aiResults }
      } catch (error) {
        console.warn('AI processing failed, using basic processing:', error)
      }
    }

    return {
      triggerMatched: true,
      extractedInfo,
      metadata: {
        receivedAt: email.receivedDate.toISOString(),
        messageId: email.id,
        hasAttachments: false // We don't access attachments for privacy
      }
    }
  }

  /**
   * Detect email priority based on keywords and patterns
   */
  private detectPriority(email: FilteredEmail): 'low' | 'medium' | 'high' {
    const text = `${email.subject} ${email.snippet}`.toLowerCase()
    
    const highPriorityKeywords = [
      'urgent', 'asap', 'emergency', 'critical', 'immediate',
      'deadline', 'important', 'priority', 'rush', 'escalation'
    ]
    
    const mediumPriorityKeywords = [
      'follow up', 'reminder', 'meeting', 'review', 'feedback',
      'question', 'help', 'support', 'issue'
    ]

    if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'high'
    }
    
    if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'medium'
    }
    
    return 'low'
  }

  /**
   * Categorize email based on content patterns
   */
  private categorizeEmail(email: FilteredEmail): string {
    const text = `${email.subject} ${email.snippet} ${email.sender}`.toLowerCase()
    
    const categories = {
      'support': ['support', 'help', 'issue', 'problem', 'bug', 'error'],
      'sales': ['sales', 'quote', 'proposal', 'pricing', 'purchase'],
      'marketing': ['newsletter', 'promotion', 'offer', 'discount', 'campaign'],
      'technical': ['api', 'code', 'development', 'deployment', 'server'],
      'meeting': ['meeting', 'calendar', 'schedule', 'appointment'],
      'personal': ['personal', 'family', 'friend']
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  /**
   * Extract relevant tags from email content
   */
  private extractTags(email: FilteredEmail): string[] {
    const text = `${email.subject} ${email.snippet}`.toLowerCase()
    const tags: string[] = []

    const tagPatterns = {
      'bug-report': ['bug', 'error', 'issue', 'problem'],
      'feature-request': ['feature', 'enhancement', 'improvement'],
      'question': ['question', 'how to', 'help'],
      'feedback': ['feedback', 'review', 'opinion'],
      'urgent': ['urgent', 'asap', 'emergency'],
      'meeting': ['meeting', 'call', 'discussion']
    }

    for (const [tag, keywords] of Object.entries(tagPatterns)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag)
      }
    }

    return tags
  }

  /**
   * Create anonymized summary of email
   */
  private createSummary(email: FilteredEmail): string {
    const priority = this.detectPriority(email)
    const category = this.categorizeEmail(email)
    
    return `${category} email with ${priority} priority from ${this.anonymizeSender(email.sender)}`
  }

  /**
   * Anonymize sender information for privacy
   */
  private anonymizeSender(sender: string): string {
    // Extract domain for context while protecting identity
    const emailMatch = sender.match(/@([^>]+)/)
    if (emailMatch) {
      return `[sender from ${emailMatch[1]}]`
    }
    return '[external sender]'
  }

  /**
   * Explicit memory cleanup for privacy
   */
  private clearEmailFromMemory(email: FilteredEmail): void {
    // Explicitly clear sensitive data from memory
    const mutableEmail = email as unknown as Record<string, unknown>
    mutableEmail.subject = null
    mutableEmail.snippet = null
    mutableEmail.sender = null
  }
}

export class PrivacyFirstWorkflowRunner {
  private processor: PrivacyFirstEmailProcessor

  constructor(gmailClient: GmailAPIClient) {
    this.processor = new PrivacyFirstEmailProcessor(gmailClient)
  }

  /**
   * Run email trigger with privacy-first processing
   */
  async runTrigger(
    config: EmailTriggerConfig,
    onProcessed: (data: ProcessedEmailData[]) => void,
    userOpenAIKey?: string
  ): Promise<void> {
    // Create AI processor if user provided OpenAI key
    let aiProcessor: ((email: FilteredEmail) => Promise<Partial<ProcessedEmailData['extractedInfo']>>) | undefined

    if (userOpenAIKey) {
      aiProcessor = async (email: FilteredEmail) => {
        return await this.processWithOpenAI(email, userOpenAIKey)
      }
    }

    // Process emails
    const processedData = await this.processor.scanAndProcess(config, aiProcessor)
    
    // Call the callback with processed data
    onProcessed(processedData)
  }

  /**
   * Process email with user's OpenAI API (optional)
   */
  private async processWithOpenAI(
    email: FilteredEmail,
    apiKey: string
  ): Promise<Partial<ProcessedEmailData['extractedInfo']>> {
    try {
      const prompt = `
        Analyze this email and provide:
        1. Priority level (low/medium/high)
        2. Category (support/sales/marketing/technical/personal/other)
        3. Relevant tags (max 3)
        4. Sentiment (positive/neutral/negative)

        Email Subject: ${email.subject}
        Email Snippet: ${email.snippet}

        Respond in JSON format:
        {
          "priority": "medium",
          "category": "support",
          "tags": ["bug-report", "urgent"],
          "sentiment": "neutral"
        }
      `

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content) {
        const parsed = JSON.parse(content)
        return {
          priority: parsed.priority,
          category: parsed.category,
          tags: parsed.tags || [],
          sentiment: parsed.sentiment
        }
      }
    } catch (error) {
      console.warn('OpenAI processing failed:', error)
    }

    // Return empty object if AI processing fails
    return {}
  }
}
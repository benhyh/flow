/**
 * Trello API Client
 * Handles authentication and API operations for Trello integration
 */

export interface TrelloCard {
  id: string
  name: string
  desc?: string
  pos?: number | string
  due?: string
  start?: string
  dueComplete?: boolean
  idList: string
  idMembers?: string[]
  idLabels?: string[]
  urlSource?: string
}

export interface TrelloCreateCardRequest {
  name: string
  desc?: string
  pos?: number | string
  due?: string
  start?: string
  dueComplete?: boolean
  idList: string
  idMembers?: string[]
  idLabels?: string[]
  urlSource?: string
}

export interface TrelloAuthConfig {
  key: string
  token?: string
}

export interface TrelloUser {
  id: string
  username: string
  fullName: string
  email?: string
}

export interface TrelloBoard {
  id: string
  name: string
  desc: string
  closed: boolean
  url: string
}

export interface TrelloList {
  id: string
  name: string
  closed: boolean
  pos: number
  idBoard: string
}

export class TrelloAPIClient {
  private key: string
  private token?: string

  constructor(config: TrelloAuthConfig) {
    this.key = config.key
    this.token = config.token
  }

  /**
   * Generate Trello authorization URL
   */
  generateAuthUrl(
    returnUrl: string,
    scope: string = 'read,write',
    expiration: string = '30days'
  ): string {
    const params = new URLSearchParams({
      key: this.key,
      callback_method: 'fragment',
      return_url: returnUrl,
      scope,
      expiration,
      response_type: 'token'
    })

    return `https://trello.com/1/authorize?${params.toString()}`
  }

  /**
   * Set the user token after authorization
   */
  setToken(token: string) {
    this.token = token
  }

  /**
   * Test connection to Trello API
   */
  async testConnection(): Promise<boolean> {
    if (!this.token) {
      return false
    }

    try {
      const response = await fetch(
        `https://api.trello.com/1/members/me?key=${this.key}&token=${this.token}`
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<TrelloUser> {
    if (!this.token) {
      throw new Error('No Trello token available')
    }

    const response = await fetch(
      `https://api.trello.com/1/members/me?key=${this.key}&token=${this.token}`
    )

    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a new card on Trello
   */
  async createCard(cardData: TrelloCreateCardRequest): Promise<TrelloCard> {
    if (!this.token) {
      throw new Error('No Trello token available. Please authorize first.')
    }

    if (!cardData.idList) {
      throw new Error('Board List ID is required to create a card')
    }

    // Build query parameters
    const params = new URLSearchParams({
      key: this.key,
      token: this.token,
      name: cardData.name,
      idList: cardData.idList
    })

    // Add optional parameters
    if (cardData.desc) params.append('desc', cardData.desc)
    if (cardData.pos !== undefined) params.append('pos', String(cardData.pos))
    if (cardData.due) params.append('due', cardData.due)
    if (cardData.start) params.append('start', cardData.start)
    if (cardData.dueComplete !== undefined) params.append('dueComplete', String(cardData.dueComplete))
    if (cardData.idMembers?.length) params.append('idMembers', cardData.idMembers.join(','))
    if (cardData.idLabels?.length) params.append('idLabels', cardData.idLabels.join(','))
    if (cardData.urlSource) params.append('urlSource', cardData.urlSource)

    const response = await fetch('https://api.trello.com/1/cards', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: params
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create Trello card: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get boards for the current user
   */
  async getBoards(): Promise<TrelloBoard[]> {
    if (!this.token) {
      throw new Error('No Trello token available')
    }

    const response = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${this.key}&token=${this.token}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch boards: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get lists for a specific board
   */
  async getBoardLists(boardId: string): Promise<TrelloList[]> {
    if (!this.token) {
      throw new Error('No Trello token available')
    }

    const response = await fetch(
      `https://api.trello.com/1/boards/${boardId}/lists?key=${this.key}&token=${this.token}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch board lists: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

/**
 * Create Trello client instance
 */
export function createTrelloClient(token?: string): TrelloAPIClient {
  const key = process.env.NEXT_PUBLIC_TRELLO_KEY || process.env.TRELLO_KEY
  
  if (!key) {
    throw new Error('Trello API key not found. Please set NEXT_PUBLIC_TRELLO_KEY or TRELLO_KEY environment variable.')
  }

  return new TrelloAPIClient({ key, token })
}

/**
 * Helper function to extract Trello token from localStorage
 */
export function getTrelloTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('trello_token')
}

/**
 * Helper function to save Trello token to localStorage
 */
export function saveTrelloTokenToStorage(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('trello_token', token)
}

/**
 * Helper function to clear Trello token from localStorage
 */
export function clearTrelloTokenFromStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('trello_token')
}
 
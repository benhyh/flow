/**
 * Asana API Client
 * Handles OAuth 2.0 authentication and API operations for Asana integration
 */

export interface AsanaUser {
  gid: string
  name: string
  email: string
  resource_type: string
}

export interface AsanaProject {
  gid: string
  name: string
  resource_type: string
  workspace: {
    gid: string
    name: string
  }
}

export interface AsanaTask {
  gid: string
  name: string
  resource_type: string
  resource_subtype: string
  created_at: string
  permalink_url: string
  projects?: AsanaProject[]
  workspace: {
    gid: string
    name: string
  }
}

export interface AsanaCreateTaskRequest {
  name: string
  notes?: string
  projects?: string[]
  workspace?: string
  assignee?: string
  due_on?: string
  due_at?: string
  start_on?: string
  start_at?: string
  parent?: string
  html_notes?: string
  completed?: boolean
  custom_fields?: Record<string, any>
}

export interface AsanaAuthConfig {
  clientId: string
  clientSecret?: string // Server-side only
  accessToken?: string
  refreshToken?: string
}

export interface AsanaTokens {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  data: {
    id: string
    gid: string
    name: string
    email: string
  }
}

export interface AsanaExecutionResult {
  success: boolean
  duration: number
  error?: string
  taskId?: string
  taskUrl?: string
  taskName?: string
}

export class AsanaAPIClient {
  private clientId: string
  private clientSecret?: string
  private accessToken?: string
  private refreshToken?: string

  constructor(config: AsanaAuthConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.accessToken = config.accessToken
    this.refreshToken = config.refreshToken
  }

  /**
   * Generate Asana OAuth authorization URL with PKCE
   */
  generateAuthUrl(
    redirectUri: string,
    scopes: string[] = ['projects:read', 'tasks:read', 'tasks:write'],
    state: string,
    codeChallenge: string
  ): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: scopes.join(' ')
    })

    return `https://app.asana.com/-/oauth_authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<AsanaTokens> {
    if (!this.clientSecret) {
      throw new Error('Client secret is required for token exchange')
    }

    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        code: code,
        code_verifier: codeVerifier
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AsanaTokens> {
    if (!this.clientSecret) {
      throw new Error('Client secret is required for token refresh')
    }

    const response = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Set tokens after OAuth flow
   */
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  /**
   * Test connection by getting current user
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<AsanaUser> {
    if (!this.accessToken) {
      throw new Error('No Asana access token available. Please authorize first.')
    }

    const response = await fetch('https://app.asana.com/api/1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid or expired access token')
      }
      throw new Error(`Failed to get current user: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Create a new task in Asana
   */
  async createTask(taskData: AsanaCreateTaskRequest): Promise<AsanaTask> {
    if (!this.accessToken) {
      throw new Error('No Asana access token available. Please authorize first.')
    }

    if (!taskData.name) {
      throw new Error('Task name is required')
    }

    // Build the request payload
    const payload: any = {
      name: taskData.name
    }

    if (taskData.notes) payload.notes = taskData.notes
    if (taskData.projects?.length) payload.projects = taskData.projects
    if (taskData.workspace) payload.workspace = taskData.workspace
    if (taskData.assignee) payload.assignee = taskData.assignee
    if (taskData.due_on) payload.due_on = taskData.due_on
    if (taskData.due_at) payload.due_at = taskData.due_at
    if (taskData.start_on) payload.start_on = taskData.start_on
    if (taskData.start_at) payload.start_at = taskData.start_at
    if (taskData.parent) payload.parent = taskData.parent
    if (taskData.html_notes) payload.html_notes = taskData.html_notes
    if (taskData.completed !== undefined) payload.completed = taskData.completed
    if (taskData.custom_fields) payload.custom_fields = taskData.custom_fields

    const response = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ data: payload })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create Asana task: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get projects for the current user
   */
  async getProjects(workspaceId?: string): Promise<AsanaProject[]> {
    if (!this.accessToken) {
      throw new Error('No Asana access token available')
    }

    const params = new URLSearchParams()
    if (workspaceId) {
      params.append('workspace', workspaceId)
    }

    const response = await fetch(
      `https://app.asana.com/api/1.0/projects?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get workspaces for the current user
   */
  async getWorkspaces(): Promise<Array<{ gid: string; name: string; resource_type: string }>> {
    if (!this.accessToken) {
      throw new Error('No Asana access token available')
    }

    const response = await fetch('https://app.asana.com/api/1.0/workspaces', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch workspaces: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }
}

/**
 * Create Asana client instance
 */
export function createAsanaClient(
  accessToken?: string,
  refreshToken?: string
): AsanaAPIClient {
  const clientId = process.env.NEXT_PUBLIC_ASANA_CLIENT_ID
  const clientSecret = process.env.ASANA_CLIENT_SECRET
  
  if (!clientId) {
    throw new Error('Asana client ID not found. Please set NEXT_PUBLIC_ASANA_CLIENT_ID environment variable.')
  }

  return new AsanaAPIClient({ 
    clientId, 
    clientSecret, 
    accessToken, 
    refreshToken 
  })
}

/**
 * Helper function to extract Asana tokens from localStorage
 */
export function getAsanaTokensFromStorage(): { accessToken: string; refreshToken: string } | null {
  if (typeof window === 'undefined') return null
  
  const accessToken = localStorage.getItem('asana_access_token')
  const refreshToken = localStorage.getItem('asana_refresh_token')
  
  if (!accessToken || !refreshToken) return null
  
  return { accessToken, refreshToken }
}

/**
 * Helper function to save Asana tokens to localStorage
 */
export function saveAsanaTokensToStorage(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('asana_access_token', accessToken)
  localStorage.setItem('asana_refresh_token', refreshToken)
}

/**
 * Helper function to clear Asana tokens from localStorage
 */
export function clearAsanaTokensFromStorage(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('asana_access_token')
  localStorage.removeItem('asana_refresh_token')
}

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  // Generate random code verifier
  const array = new Uint8Array(32)
  
  if (typeof window !== 'undefined') {
    // Browser environment
    crypto.getRandomValues(array)
  } else {
    // Node.js environment
    const { randomBytes } = await import('crypto')
    const bytes = randomBytes(32)
    array.set(bytes)
  }
  
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // Generate code challenge using SHA256
  let hash: ArrayBuffer
  
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Browser environment
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    hash = await crypto.subtle.digest('SHA-256', data)
  } else {
    // Node.js environment
    const { createHash } = await import('crypto')
    const hashBuffer = createHash('sha256').update(codeVerifier).digest()
    hash = hashBuffer.buffer.slice(hashBuffer.byteOffset, hashBuffer.byteOffset + hashBuffer.byteLength)
  }
  
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return { codeVerifier, codeChallenge }
}

/**
 * Generate random state parameter for OAuth
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(16)
  
  if (typeof window !== 'undefined') {
    // Browser environment
    crypto.getRandomValues(array)
  } else {
    // Node.js environment - use synchronous version for simplicity
    const crypto = require('crypto')
    const bytes = crypto.randomBytes(16)
    array.set(bytes)
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

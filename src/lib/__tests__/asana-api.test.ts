/**
 * @jest-environment jsdom
 */

import { 
  createAsanaClient, 
  generatePKCE, 
  generateOAuthState,
  getAsanaTokensFromStorage,
  saveAsanaTokensToStorage,
  clearAsanaTokensFromStorage
} from '../asana-api'

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ASANA_CLIENT_ID: 'test-client-id',
    ASANA_CLIENT_SECRET: 'test-client-secret'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Asana API Client', () => {
  describe('PKCE Generation', () => {
    it('should generate PKCE code verifier and challenge', async () => {
      const pkce = await generatePKCE()
      
      expect(pkce).toHaveProperty('codeVerifier')
      expect(pkce).toHaveProperty('codeChallenge')
      expect(typeof pkce.codeVerifier).toBe('string')
      expect(typeof pkce.codeChallenge).toBe('string')
      expect(pkce.codeVerifier.length).toBeGreaterThan(20)
      expect(pkce.codeChallenge.length).toBeGreaterThan(20)
    })

    it('should generate different PKCE values on each call', async () => {
      const pkce1 = await generatePKCE()
      const pkce2 = await generatePKCE()
      
      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier)
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge)
    })
  })

  describe('OAuth State Generation', () => {
    it('should generate OAuth state', () => {
      const state = generateOAuthState()
      
      expect(typeof state).toBe('string')
      expect(state.length).toBe(32) // 16 bytes -> 32 hex chars
    })

    it('should generate different state values on each call', () => {
      const state1 = generateOAuthState()
      const state2 = generateOAuthState()
      
      expect(state1).not.toBe(state2)
    })
  })

  describe('Client Creation', () => {
    it('should create client without tokens', () => {
      const client = createAsanaClient()
      expect(client).toBeDefined()
    })

    it('should create client with tokens', () => {
      const client = createAsanaClient('access-token', 'refresh-token')
      expect(client).toBeDefined()
    })

    it('should throw error when client ID is missing', () => {
      delete process.env.NEXT_PUBLIC_ASANA_CLIENT_ID
      
      expect(() => createAsanaClient()).toThrow(
        'Asana client ID not found. Please set NEXT_PUBLIC_ASANA_CLIENT_ID environment variable.'
      )
    })
  })

  describe('Auth URL Generation', () => {
    it('should generate proper OAuth authorization URL', async () => {
      const client = createAsanaClient()
      const { codeChallenge } = await generatePKCE()
      const state = generateOAuthState()
      
      const authUrl = client.generateAuthUrl(
        'http://localhost:3000/auth/asana/callback',
        ['projects:read', 'tasks:read', 'tasks:write'],
        state,
        codeChallenge
      )
      
      expect(authUrl).toContain('https://app.asana.com/-/oauth_authorize')
      expect(authUrl).toContain('client_id=test-client-id')
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fasana%2Fcallback')
      expect(authUrl).toContain('response_type=code')
      expect(authUrl).toContain('code_challenge_method=S256')
      expect(authUrl).toContain(`state=${state}`)
      expect(authUrl).toContain(`code_challenge=${codeChallenge}`)
      expect(authUrl).toMatch(/scope=projects%3Aread[\+%20]tasks%3Aread[\+%20]tasks%3Awrite/)
    })

    it('should use default scopes when none provided', async () => {
      const client = createAsanaClient()
      const { codeChallenge } = await generatePKCE()
      const state = generateOAuthState()
      
      const authUrl = client.generateAuthUrl(
        'http://localhost:3000/auth/asana/callback',
        undefined,
        state,
        codeChallenge
      )
      
      expect(authUrl).toMatch(/scope=projects%3Aread[\+%20]tasks%3Aread[\+%20]tasks%3Awrite/)
    })
  })

  describe('Token Storage', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear()
    })

    it('should save and retrieve tokens', () => {
      const accessToken = 'test-access-token'
      const refreshToken = 'test-refresh-token'
      
      saveAsanaTokensToStorage(accessToken, refreshToken)
      const retrieved = getAsanaTokensFromStorage()
      
      expect(retrieved).toEqual({
        accessToken,
        refreshToken
      })
    })

    it('should return null when no tokens stored', () => {
      const retrieved = getAsanaTokensFromStorage()
      expect(retrieved).toBeNull()
    })

    it('should return null when only access token stored', () => {
      localStorage.setItem('asana_access_token', 'test-token')
      
      const retrieved = getAsanaTokensFromStorage()
      expect(retrieved).toBeNull()
    })

    it('should return null when only refresh token stored', () => {
      localStorage.setItem('asana_refresh_token', 'test-token')
      
      const retrieved = getAsanaTokensFromStorage()
      expect(retrieved).toBeNull()
    })

    it('should clear tokens', () => {
      saveAsanaTokensToStorage('access', 'refresh')
      clearAsanaTokensFromStorage()
      
      const retrieved = getAsanaTokensFromStorage()
      expect(retrieved).toBeNull()
    })
  })
})

describe('API Methods (without network calls)', () => {
  let client: ReturnType<typeof createAsanaClient>

  beforeEach(() => {
    client = createAsanaClient('mock-access-token', 'mock-refresh-token')
  })

  it('should set tokens', () => {
    client.setTokens('new-access', 'new-refresh')
    // Can't easily test this without exposing internal state
    // but we can verify the method exists and doesn't throw
    expect(client.setTokens).toBeDefined()
  })

  it('should have all required API methods', () => {
    expect(client.generateAuthUrl).toBeDefined()
    expect(client.exchangeCodeForTokens).toBeDefined()
    expect(client.refreshAccessToken).toBeDefined()
    expect(client.setTokens).toBeDefined()
    expect(client.testConnection).toBeDefined()
    expect(client.getCurrentUser).toBeDefined()
    expect(client.createTask).toBeDefined()
    expect(client.getProjects).toBeDefined()
    expect(client.getWorkspaces).toBeDefined()
  })
})

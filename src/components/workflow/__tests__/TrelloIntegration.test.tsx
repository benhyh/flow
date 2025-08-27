import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthenticationMonitor } from '../AuthenticationMonitor'
import { useTrelloIntegration } from '../hooks/useTrelloIntegration'
import { useReactFlow } from '@xyflow/react'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@xyflow/react')
vi.mock('../hooks/useTrelloIntegration')
vi.mock('sonner')

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen
})

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener
})
Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener
})

describe('Trello Integration Authentication Monitor', () => {
  const mockGetNodes = vi.fn()
  const mockGenerateTrelloAuthUrl = vi.fn()
  const mockToastError = vi.fn()
  const mockToastSuccess = vi.fn()
  const mockToastDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup React Flow mock
    vi.mocked(useReactFlow).mockReturnValue({
      getNodes: mockGetNodes,
    } as any)

    // Setup toast mocks
    vi.mocked(toast).mockReturnValue({
      error: mockToastError,
      success: mockToastSuccess,
      dismiss: mockToastDismiss,
    } as any)

    // Setup default return values
    mockGetNodes.mockReturnValue([])
    mockGenerateTrelloAuthUrl.mockResolvedValue('https://trello.com/auth/test')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Persistent notification fix', () => {
    it('should only show toast notification once when Trello nodes are present and user is not authenticated', async () => {
      // Setup: Has Trello nodes but no access
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'action',
          data: { nodeType: 'trello-action' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: false,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      render(<AuthenticationMonitor />)

      // Wait for initial check
      await waitFor(() => {
        expect(mockGenerateTrelloAuthUrl).toHaveBeenCalledTimes(1)
      })

      // Verify toast was called only once
      expect(mockToastError).toHaveBeenCalledTimes(1)
      expect(mockToastError).toHaveBeenCalledWith('Trello Authorization Required', {
        description: 'Your workflow contains Trello nodes. Click to authorize Trello integration.',
        duration: Infinity,
        action: expect.objectContaining({
          label: 'Authorize Trello',
          onClick: expect.any(Function)
        })
      })
    })

    it('should show success toast when user gets authenticated', async () => {
      let hasTrelloAccess = false

      const mockUseTrelloIntegration = vi.fn(() => ({
        hasTrelloAccess,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      }))

      vi.mocked(useTrelloIntegration).mockImplementation(mockUseTrelloIntegration)

      const { rerender } = render(<AuthenticationMonitor />)

      // Simulate user getting authenticated
      hasTrelloAccess = true
      rerender(<AuthenticationMonitor />)

      await waitFor(() => {
        expect(mockToastDismiss).toHaveBeenCalled()
        expect(mockToastSuccess).toHaveBeenCalledWith('Trello successfully authorized!', {
          description: 'You can now use Trello actions in your workflows.',
          duration: 3000
        })
      })
    })
  })

  describe('Popup OAuth implementation', () => {
    it('should open popup window when authorize button is clicked', async () => {
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'action',
          data: { nodeType: 'trello-action' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: false,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      // Mock popup window
      const mockPopup = {
        close: vi.fn(),
        closed: false
      }
      mockWindowOpen.mockReturnValue(mockPopup)

      render(<AuthenticationMonitor />)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled()
      })

      // Get the onClick function from the toast action
      const toastCall = mockToastError.mock.calls[0]
      const toastConfig = toastCall[1]
      const onClickHandler = toastConfig.action.onClick

      // Simulate clicking the authorize button
      onClickHandler()

      // Verify popup was opened with correct parameters
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://trello.com/auth/test',
        'trello-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,top=100,left=100'
      )

      // Verify message listener was added
      expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('should handle popup blocked scenario', async () => {
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'action',
          data: { nodeType: 'trello-action' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: false,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      // Mock popup blocked (window.open returns null)
      mockWindowOpen.mockReturnValue(null)

      render(<AuthenticationMonitor />)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled()
      })

      // Get the onClick function from the toast action
      const toastCall = mockToastError.mock.calls[0]
      const toastConfig = toastCall[1]
      const onClickHandler = toastConfig.action.onClick

      // Simulate clicking the authorize button
      onClickHandler()

      // Verify popup blocked error was shown
      expect(mockToastError).toHaveBeenCalledWith('Popup blocked. Please allow popups for this site.')
    })

    it('should handle successful OAuth message from popup', async () => {
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'action',
          data: { nodeType: 'trello-action' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: false,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      const mockPopup = {
        close: vi.fn(),
        closed: false
      }
      mockWindowOpen.mockReturnValue(mockPopup)

      render(<AuthenticationMonitor />)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled()
      })

      // Get the onClick function and trigger it
      const toastCall = mockToastError.mock.calls[0]
      const onClickHandler = toastCall[1].action.onClick
      onClickHandler()

      // Get the message listener that was added
      const addEventListenerCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'message'
      )
      const messageListener = addEventListenerCall[1]

      // Simulate successful OAuth message
      const successEvent = {
        origin: window.location.origin,
        data: {
          type: 'TRELLO_OAUTH_SUCCESS'
        }
      }

      messageListener(successEvent)

      // Verify popup was closed and success toast was shown
      expect(mockPopup.close).toHaveBeenCalled()
      expect(mockRemoveEventListener).toHaveBeenCalledWith('message', messageListener)
      expect(mockToastDismiss).toHaveBeenCalled()
      expect(mockToastSuccess).toHaveBeenCalledWith('Trello successfully authorized!', {
        description: 'You can now use Trello actions in your workflows.',
        duration: 3000
      })
    })

    it('should handle OAuth error message from popup', async () => {
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'action',
          data: { nodeType: 'trello-action' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: false,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      const mockPopup = {
        close: vi.fn(),
        closed: false
      }
      mockWindowOpen.mockReturnValue(mockPopup)

      render(<AuthenticationMonitor />)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled()
      })

      // Get the onClick function and trigger it
      const toastCall = mockToastError.mock.calls[0]
      const onClickHandler = toastCall[1].action.onClick
      onClickHandler()

      // Get the message listener
      const addEventListenerCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'message'
      )
      const messageListener = addEventListenerCall[1]

      // Simulate error message
      const errorEvent = {
        origin: window.location.origin,
        data: {
          type: 'TRELLO_OAUTH_ERROR',
          error: 'User denied access'
        }
      }

      messageListener(errorEvent)

      // Verify popup was closed and error toast was shown
      expect(mockPopup.close).toHaveBeenCalled()
      expect(mockRemoveEventListener).toHaveBeenCalledWith('message', messageListener)
      expect(mockToastError).toHaveBeenCalledWith('Trello authorization failed', {
        description: 'User denied access',
        duration: 5000
      })
    })
  })

  describe('No Trello nodes scenario', () => {
    it('should not show any toast when no Trello nodes are present', async () => {
      // Setup: No Trello nodes
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'trigger',
          data: { nodeType: 'gmail-trigger' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: false,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: null,
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      render(<AuthenticationMonitor />)

      // Wait a bit to ensure no toast is shown
      await waitFor(() => {
        expect(mockGenerateTrelloAuthUrl).not.toHaveBeenCalled()
        expect(mockToastError).not.toHaveBeenCalled()
      })
    })

    it('should not show toast when user already has Trello access', async () => {
      // Setup: Has Trello nodes and access
      mockGetNodes.mockReturnValue([
        {
          id: '1',
          type: 'action',
          data: { nodeType: 'trello-action' },
          position: { x: 0, y: 0 }
        }
      ])

      vi.mocked(useTrelloIntegration).mockReturnValue({
        hasTrelloAccess: true,
        generateTrelloAuthUrl: mockGenerateTrelloAuthUrl,
        trelloUser: { id: '1', username: 'test', fullName: 'Test User' },
        isCheckingAuth: false,
        checkTrelloAuth: vi.fn(),
        handleTrelloAuthCallback: vi.fn(),
        signOutTrello: vi.fn(),
        createTrelloCard: vi.fn(),
      })

      render(<AuthenticationMonitor />)

      // Wait to ensure no toast is shown
      await waitFor(() => {
        expect(mockGenerateTrelloAuthUrl).not.toHaveBeenCalled()
        expect(mockToastError).not.toHaveBeenCalled()
      })
    })
  })
})

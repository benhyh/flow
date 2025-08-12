import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ResponsiveLayout, useResponsive } from '../ResponsiveLayout'

// Mock window.innerWidth for responsive tests
const mockInnerWidth = (width: number) => {
  act(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    window.dispatchEvent(new Event('resize'))
  })
}

// Test component that uses the useResponsive hook
function TestResponsiveComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  return (
    <div>
      <div data-testid="mobile">{isMobile ? 'mobile' : 'not-mobile'}</div>
      <div data-testid="tablet">{isTablet ? 'tablet' : 'not-tablet'}</div>
      <div data-testid="desktop">{isDesktop ? 'desktop' : 'not-desktop'}</div>
    </div>
  )
}

describe('ResponsiveLayout', () => {
  const mockToolbar = <div data-testid="toolbar">Toolbar</div>
  const mockSidebar = <div data-testid="sidebar">Sidebar</div>
  const mockChildren = <div data-testid="children">Main Content</div>

  beforeEach(() => {
    // Reset to desktop size
    mockInnerWidth(1200)
  })

  test('renders all components correctly', () => {
    render(
      <ResponsiveLayout
        toolbar={mockToolbar}
        sidebar={mockSidebar}
      >
        {mockChildren}
      </ResponsiveLayout>
    )

    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('children')).toBeInTheDocument()
  })

  test('shows mobile menu button on mobile screens', () => {
    mockInnerWidth(600)
    
    render(
      <ResponsiveLayout
        toolbar={mockToolbar}
        sidebar={mockSidebar}
      >
        {mockChildren}
      </ResponsiveLayout>
    )

    // Mobile menu button should be visible (look for the one with Menu icon)
    const menuButton = screen.getByRole('button', { name: /menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  test('sidebar is hidden by default on mobile', () => {
    mockInnerWidth(600)
    
    render(
      <ResponsiveLayout
        toolbar={mockToolbar}
        sidebar={mockSidebar}
      >
        {mockChildren}
      </ResponsiveLayout>
    )

    // Find the sidebar container (the div with the translate classes)
    const sidebarContainer = screen.getByTestId('sidebar').closest('.fixed')
    expect(sidebarContainer).toHaveClass('-translate-x-full')
  })

  test('can toggle sidebar on mobile', () => {
    mockInnerWidth(600)
    
    render(
      <ResponsiveLayout
        toolbar={mockToolbar}
        sidebar={mockSidebar}
      >
        {mockChildren}
      </ResponsiveLayout>
    )

    const menuButton = screen.getByRole('button', { name: /menu/i })
    const sidebarContainer = screen.getByTestId('sidebar').closest('.fixed')

    // Initially hidden
    expect(sidebarContainer).toHaveClass('-translate-x-full')

    // Click to show
    act(() => {
      fireEvent.click(menuButton)
    })
    expect(sidebarContainer).toHaveClass('translate-x-0')
  })
})

describe('useResponsive hook', () => {
  test('detects mobile screen size', () => {
    mockInnerWidth(600)
    
    render(<TestResponsiveComponent />)
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('mobile')
    expect(screen.getByTestId('tablet')).toHaveTextContent('not-tablet')
    expect(screen.getByTestId('desktop')).toHaveTextContent('not-desktop')
  })

  test('detects tablet screen size', () => {
    mockInnerWidth(800)
    
    render(<TestResponsiveComponent />)
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('not-mobile')
    expect(screen.getByTestId('tablet')).toHaveTextContent('tablet')
    expect(screen.getByTestId('desktop')).toHaveTextContent('not-desktop')
  })

  test('detects desktop screen size', () => {
    mockInnerWidth(1200)
    
    render(<TestResponsiveComponent />)
    
    expect(screen.getByTestId('mobile')).toHaveTextContent('not-mobile')
    expect(screen.getByTestId('tablet')).toHaveTextContent('not-tablet')
    expect(screen.getByTestId('desktop')).toHaveTextContent('desktop')
  })

  test('updates on window resize', () => {
    render(<TestResponsiveComponent />)
    
    // Start desktop
    mockInnerWidth(1200)
    expect(screen.getByTestId('desktop')).toHaveTextContent('desktop')
    
    // Resize to mobile
    mockInnerWidth(600)
    expect(screen.getByTestId('mobile')).toHaveTextContent('mobile')
    expect(screen.getByTestId('desktop')).toHaveTextContent('not-desktop')
  })
})
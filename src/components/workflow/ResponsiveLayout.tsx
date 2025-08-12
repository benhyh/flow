'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  toolbar: React.ReactNode
  debugPanel?: React.ReactNode
  className?: string
}

export function ResponsiveLayout({
  children,
  sidebar,
  toolbar,
  debugPanel,
  className = ''
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      
      // Auto-collapse sidebar on smaller screens
      if (width < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen)
  }, [sidebarOpen])

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed)
  }, [sidebarCollapsed])

  return (
    <div className={`min-h-screen bg-[#1D1D1D] flex flex-col ${className}`}>
      {/* Toolbar - always visible */}
      <div className="flex-shrink-0">
        {toolbar}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex relative">
        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed && !isMobile ? 'w-16' : isMobile ? 'w-80' : 'w-80'}
          transition-all duration-300 ease-in-out
          bg-[#242424]
          flex flex-col
        `}>
          {/* Sidebar header with controls */}
          <div className="flex items-center justify-between p-3">
            {!sidebarCollapsed && (
              <h3 className="text-white font-medium">Node Library</h3>
            )}
            <div className="flex items-center gap-1">
              {/* Collapse button (desktop only) */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebarCollapse}
                  className="text-white/50 hover:text-white p-1 h-auto"
                >
                  {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </Button>
              )}
              
              {/* Close button (mobile only) */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/50 hover:text-white p-1 h-auto"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-hidden">
            {React.isValidElement(sidebar) ? React.cloneElement(sidebar as React.ReactElement<Record<string, unknown>>, {
              ...(sidebarCollapsed && !isMobile ? { collapsed: true } : {}),
              className: `h-full ${sidebarCollapsed && !isMobile ? 'px-2' : ''}`
            }) : sidebar}
          </div>
        </div>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col relative">
          {/* Mobile menu button */}
          {(isMobile || isTablet) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-30 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </Button>
          )}

          {/* Canvas content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Debug panel */}
          {debugPanel && (
            <div className="flex-shrink-0">
              {debugPanel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for responsive utilities
export function useResponsive() {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}
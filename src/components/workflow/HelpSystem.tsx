'use client'

import React, { useState, useCallback } from 'react'
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  ChevronDown,
  Book,
  Keyboard,
  Video,
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KeyboardShortcutsHelp } from './KeyboardShortcuts'

interface HelpSystemProps {
  className?: string
}

interface HelpSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export function HelpSystem({ className = '' }: HelpSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('getting-started')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }, [])

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book size={16} />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">Creating Your First Workflow</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Start with a template or drag nodes from the sidebar</li>
              <li>Connect nodes by dragging from output to input handles</li>
              <li>Double-click nodes to configure their settings</li>
              <li>Use the &quot;Run Test&quot; button to test your workflow</li>
              <li>Save and activate your workflow when ready</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">Node Types</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-green-400">Triggers</span>
                <span className="text-white/50">- Start your workflow (e.g., New Email)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-blue-400">Actions</span>
                <span className="text-white/50">- Perform tasks (e.g., Create Card)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <span className="text-yellow-400">Logic</span>
                <span className="text-white/50">- Add conditions and branching</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="text-purple-400">AI</span>
                <span className="text-white/50">- AI-powered processing</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: <Keyboard size={16} />,
      content: <KeyboardShortcutsHelp />
    },
    {
      id: 'workflow-tips',
      title: 'Workflow Tips',
      icon: <HelpCircle size={16} />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">Best Practices</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>Start simple - begin with basic email-to-task workflows</li>
              <li>Test frequently using the &quot;Run Test&quot; button</li>
              <li>Use descriptive names for your workflows</li>
              <li>Configure filters carefully to avoid spam</li>
              <li>Monitor execution logs for troubleshooting</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">Common Patterns</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>Email → Task: Convert emails to actionable items</li>
              <li>AI Classification: Route emails based on content</li>
              <li>Conditional Logic: Handle different scenarios</li>
              <li>Multi-platform: Create tasks in multiple systems</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <MessageCircle size={16} />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">Common Issues</h4>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-red-400">Workflow not triggering</div>
                <div className="text-gray-300 ml-2">
                  • Check email filters and keywords
                  • Verify OAuth connections are active
                  • Ensure workflow is activated (not in draft)
                </div>
              </div>
              
              <div>
                <div className="font-medium text-red-400">Tasks not being created</div>
                <div className="text-gray-300 ml-2">
                  • Verify board/project permissions
                  • Check API rate limits
                  • Review execution logs for errors
                </div>
              </div>
              
              <div>
                <div className="font-medium text-red-400">Nodes won&apos;t connect</div>
                <div className="text-gray-300 ml-2">
                  • Ensure compatible node types
                  • Check for circular connections
                  • Verify handle positions
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-40 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full p-3 shadow-lg ${className}`}
        title="Get help (F1)"
      >
        <HelpCircle size={20} />
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-[#242424] w-full max-w-4xl max-h-[80vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Help & Support</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto chat-scrollbar smooth-scroll p-2">
            {helpSections.map((section) => (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => {
                    setActiveSection(section.id)
                    toggleSection(section.id)
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id 
                      ? 'bg-[#8b5cf6] text-white' 
                      : 'text-gray-300 hover:bg-[#2d2d2d]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span className="text-sm font-medium">{section.title}</span>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              </div>
            ))}
            
            {/* External links */}
            <div className="mt-6 pt-4">
              <div className="text-xs font-medium text-white/50 mb-2">External Resources</div>
              <div className="space-y-1">
                <a
                  href="#"
                  className="flex items-center gap-2 p-2 text-sm text-gray-300 hover:text-white hover:bg-[#2d2d2d] rounded"
                >
                  <Video size={14} />
                  Video Tutorials
                  <ExternalLink size={12} />
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 p-2 text-sm text-gray-300 hover:text-white hover:bg-[#2d2d2d] rounded"
                >
                  <Book size={14} />
                  Documentation
                  <ExternalLink size={12} />
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 p-2 text-sm text-gray-300 hover:text-white hover:bg-[#2d2d2d] rounded"
                >
                  <MessageCircle size={14} />
                  Community
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-2">
              {helpSections.find(s => s.id === activeSection)?.icon}
              <h3 className="text-xl font-semibold text-white">
                {helpSections.find(s => s.id === activeSection)?.title}
              </h3>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto chat-scrollbar smooth-scroll p-6">
            {helpSections.find(s => s.id === activeSection)?.content}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Tooltip component for inline help
export function HelpTooltip({ 
  content, 
  children, 
  className = '' 
}: { 
  content: string
  children: React.ReactNode
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
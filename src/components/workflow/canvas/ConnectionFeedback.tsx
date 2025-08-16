'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

interface ConnectionFeedbackProps {
  message: string
  type: 'success' | 'error'
  duration?: number
  onClose?: () => void
}

export function ConnectionFeedback({ 
  message, 
  type, 
  duration = 3000, 
  onClose 
}: ConnectionFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600'
  const IconComponent = type === 'success' ? Check : AlertCircle

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-right`}>
      <IconComponent size={16} />
      <span className="text-sm">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
        className="ml-1 text-white hover:text-gray-200 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// Hook for managing connection feedback
export function useConnectionFeedback() {
  const [feedback, setFeedback] = useState<{
    message: string
    type: 'success' | 'error'
    id: number
  } | null>(null)

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({
      message,
      type,
      id: Date.now()
    })
  }

  const clearFeedback = () => {
    setFeedback(null)
  }

  return {
    feedback,
    showFeedback,
    clearFeedback
  }
}
'use client'

import React, { useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { 
  Terminal, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// Execution log types
export type LogLevel = 'info' | 'success' | 'warning' | 'error'

export interface ExecutionLog {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  nodeId?: string
  nodeName?: string
  details?: string
  duration?: number
}

export interface ExecutionRun {
  id: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'success' | 'error' | 'cancelled'
  logs: ExecutionLog[]
  totalNodes: number
  completedNodes: number
  errorCount: number
}

interface DebugPanelProps {
  isVisible: boolean
  onToggle: () => void
  executionRuns: ExecutionRun[]
  onClearLogs: () => void
  currentRun?: ExecutionRun
}

export function DebugPanel({
  isVisible,
  onToggle,
  executionRuns,
  onClearLogs,
  currentRun
}: DebugPanelProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const selectedRun = selectedRunId 
    ? executionRuns.find(run => run.id === selectedRunId) 
    : currentRun || executionRuns[0]

  const toggleLogExpansion = useCallback((logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }, [])

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return <CheckCircle size={14} className="text-green-500" />
      case 'error':
        return <XCircle size={14} className="text-red-500" />
      case 'warning':
        return <AlertTriangle size={14} className="text-yellow-500" />
      default:
        return <Clock size={14} className="text-blue-500" />
    }
  }

  const getStatusIcon = (status: ExecutionRun['status']) => {
    switch (status) {
      case 'running':
        return <Play size={14} className="text-blue-500 animate-pulse" />
      case 'success':
        return <CheckCircle size={14} className="text-green-500" />
      case 'error':
        return <XCircle size={14} className="text-red-500" />
      case 'cancelled':
        return <XCircle size={14} className="text-gray-500" />
    }
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - startTime.getTime()
    return `${(duration / 1000).toFixed(1)}s`
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-20">
        <Button
          onClick={onToggle}
          className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white border border-[#3d3d3d] shadow-lg"
        >
          <Terminal size={16} className="mr-2" />
          Debug Panel
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-80 z-20 bg-[#1d1d1d] border-l border-t border-[#3d3d3d] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#3d3d3d] bg-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-[#8b5cf6]" />
          <h3 className="text-white font-medium text-sm">Debug Panel</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onClearLogs}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-6 px-2"
          >
            <Trash2 size={12} />
          </Button>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-6 px-2"
          >
            <ChevronDown size={12} />
          </Button>
        </div>
      </div>

      {/* Execution Run Selector */}
      {executionRuns.length > 0 && (
        <div className="p-2 border-b border-[#3d3d3d] bg-[#242424]">
          <select
            value={selectedRunId || ''}
            onChange={(e) => setSelectedRunId(e.target.value || null)}
            className="w-full bg-[#1d1d1d] border border-[#3d3d3d] text-white rounded px-2 py-1 text-xs"
          >
            {currentRun && (
              <option value="">Current Run ({formatDuration(currentRun.startTime, currentRun.endTime)})</option>
            )}
            {executionRuns.map((run) => (
              <option key={run.id} value={run.id}>
                Run {run.id.slice(-8)} - {run.status} ({formatDuration(run.startTime, run.endTime)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Execution Summary */}
      {selectedRun && (
        <div className="p-2 border-b border-[#3d3d3d] bg-[#242424]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {getStatusIcon(selectedRun.status)}
              <span className="text-white">
                {selectedRun.completedNodes}/{selectedRun.totalNodes} nodes
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <span>{formatDuration(selectedRun.startTime, selectedRun.endTime)}</span>
              {selectedRun.errorCount > 0 && (
                <span className="text-red-400">{selectedRun.errorCount} errors</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="flex-1 overflow-y-auto chat-scrollbar smooth-scroll">
        {selectedRun?.logs.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No execution logs yet. Run a test to see logs here.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {selectedRun?.logs.map((log) => (
              <div key={log.id} className="text-xs">
                <div 
                  className="flex items-start gap-2 p-2 rounded hover:bg-[#2d2d2d] cursor-pointer"
                  onClick={() => log.details && toggleLogExpansion(log.id)}
                >
                  <span className="text-gray-500 font-mono text-xs min-w-[60px]">
                    {log.timestamp.toLocaleTimeString().slice(0, 8)}
                  </span>
                  {getLogIcon(log.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{log.message}</span>
                      {log.nodeName && (
                        <span className="text-[#8b5cf6] text-xs">({log.nodeName})</span>
                      )}
                      {log.duration && (
                        <span className="text-gray-400 text-xs">{log.duration}ms</span>
                      )}
                      {log.details && (
                        expandedLogs.has(log.id) ? 
                          <ChevronDown size={12} className="text-gray-400" /> :
                          <ChevronRight size={12} className="text-gray-400" />
                      )}
                    </div>
                    {log.details && expandedLogs.has(log.id) && (
                      <div className="mt-1 p-2 bg-[#1a1a1a] rounded text-gray-300 font-mono text-xs">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#3d3d3d] bg-[#242424]">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {selectedRun?.logs.length || 0} log entries
          </span>
          <span>
            Last updated: {selectedRun?.logs[selectedRun.logs.length - 1]?.timestamp.toLocaleTimeString() || 'Never'}
          </span>
        </div>
      </div>
    </div>
  )
}
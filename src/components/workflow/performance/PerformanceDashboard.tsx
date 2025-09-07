/**
 * PerformanceDashboard - Real-time performance monitoring for workflows
 * 
 * Phase 2.3d: Performance Monitoring and Analytics Dashboard
 * Source: DATABASE.md Fast MVP Implementation Strategy
 * 
 * Features:
 * - React Flow render performance tracking
 * - Supabase query performance monitoring
 * - Validation cache statistics
 * - Performance recommendations
 * - Memory usage tracking
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Database, 
  Zap, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { useWorkflowPerformance } from '@/hooks/useWorkflowPerformance'
import { validationCache } from '@/lib/services/WorkflowValidationCache'
import { workflowService } from '@/lib/services/WorkflowService'
import { type WorkflowState } from '../toolbar/WorkflowToolbar'
import { type Node, type Edge } from '@xyflow/react'

interface PerformanceDashboardProps {
  workflowState: WorkflowState
  nodes: Node[]
  edges: Edge[]
  className?: string
}

interface SystemMetrics {
  memoryUsage: number
  renderTime: number
  queryResponseTime: number
  cacheHitRate: number
  activeConnections: number
}

export function PerformanceDashboard({
  workflowState,
  nodes,
  edges,
  className = ''
}: PerformanceDashboardProps) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    queryResponseTime: 0,
    cacheHitRate: 0,
    activeConnections: 0
  })
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Use performance hook
  const {
    metrics: performanceMetrics,
    getPerformanceSuggestions
  } = useWorkflowPerformance(workflowState, {
    enablePerformanceLogging: true
  })

  // ===================
  // Performance Data Collection
  // ===================

  /**
   * Collect system performance metrics
   */
  const collectSystemMetrics = useCallback(async () => {
    const startTime = performance.now()

    try {
      // Memory usage (if available)
      const memoryInfo = (performance as any).memory
      const memoryUsage = memoryInfo 
        ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
        : 0

      // Cache statistics
      const cacheStats = validationCache.getStats()
      
      // Test query response time
      const queryStart = performance.now()
      await workflowService.getUserWorkflows()
      const queryTime = performance.now() - queryStart

      setSystemMetrics({
        memoryUsage,
        renderTime: performanceMetrics.lastRenderTime,
        queryResponseTime: queryTime,
        cacheHitRate: cacheStats.hitRate,
        activeConnections: 1 // Simplified for MVP
      })

    } catch (error) {
      console.error('Failed to collect system metrics:', error)
    }
  }, [performanceMetrics.lastRenderTime])

  /**
   * Refresh all performance data
   */
  const refreshMetrics = useCallback(async () => {
    setIsRefreshing(true)
    
    try {
      await collectSystemMetrics()
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [collectSystemMetrics])

  // Auto-refresh metrics every 10 seconds
  useEffect(() => {
    const interval = setInterval(collectSystemMetrics, 10000)
    
    // Initial collection
    collectSystemMetrics()
    
    return () => clearInterval(interval)
  }, [collectSystemMetrics])

  // ===================
  // Performance Status Helpers
  // ===================

  /**
   * Get performance status color and message
   */
  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) {
      return { color: 'green', status: 'Excellent', icon: CheckCircle }
    } else if (value <= thresholds.warning) {
      return { color: 'yellow', status: 'Good', icon: AlertTriangle }
    } else {
      return { color: 'red', status: 'Needs Attention', icon: AlertTriangle }
    }
  }

  /**
   * Format duration in a human-readable way
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1) return '< 1ms'
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  /**
   * Get performance suggestions
   */
  const suggestions = getPerformanceSuggestions()
  const cacheRecommendations = validationCache.getPerformanceRecommendations()

  // ===================
  // Render
  // ===================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Performance Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Render Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4" />
              Render Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatDuration(systemMetrics.renderTime)}
              </div>
              <Progress 
                value={Math.min((systemMetrics.renderTime / 100) * 100, 100)} 
                className="h-2"
              />
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getPerformanceStatus(systemMetrics.renderTime, { good: 50, warning: 100 })
                  return (
                    <>
                      <status.icon className={`w-3 h-3 text-${status.color}-500`} />
                      <span className={`text-xs text-${status.color}-600`}>{status.status}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Query Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" />
              Query Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatDuration(systemMetrics.queryResponseTime)}
              </div>
              <Progress 
                value={Math.min((systemMetrics.queryResponseTime / 1000) * 100, 100)} 
                className="h-2"
              />
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getPerformanceStatus(systemMetrics.queryResponseTime, { good: 200, warning: 500 })
                  return (
                    <>
                      <status.icon className={`w-3 h-3 text-${status.color}-500`} />
                      <span className={`text-xs text-${status.color}-600`}>{status.status}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {systemMetrics.cacheHitRate.toFixed(1)}%
              </div>
              <Progress 
                value={systemMetrics.cacheHitRate} 
                className="h-2"
              />
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getPerformanceStatus(100 - systemMetrics.cacheHitRate, { good: 20, warning: 50 })
                  return (
                    <>
                      <status.icon className={`w-3 h-3 text-${status.color}-500`} />
                      <span className={`text-xs text-${status.color}-600`}>{status.status}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {systemMetrics.memoryUsage.toFixed(1)}%
              </div>
              <Progress 
                value={systemMetrics.memoryUsage} 
                className="h-2"
              />
              <div className="flex items-center gap-1">
                {(() => {
                  const status = getPerformanceStatus(systemMetrics.memoryUsage, { good: 60, warning: 80 })
                  return (
                    <>
                      <status.icon className={`w-3 h-3 text-${status.color}-500`} />
                      <span className={`text-xs text-${status.color}-600`}>{status.status}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Current Workflow Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
              <div className="text-sm text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{edges.length}</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics.autoSaveCount}</div>
              <div className="text-sm text-muted-foreground">Auto-saves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {performanceMetrics.validationCacheHits + performanceMetrics.validationCacheMisses}
              </div>
              <div className="text-sm text-muted-foreground">Validations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      {(suggestions.length > 0 || cacheRecommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    Workflow
                  </Badge>
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
              {cacheRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    Cache
                  </Badge>
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
              {suggestions.length === 0 && cacheRecommendations.length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">All systems performing optimally</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {performanceMetrics.validationCacheHits}
              </div>
              <div className="text-sm text-muted-foreground">Cache Hits</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {performanceMetrics.validationCacheMisses}
              </div>
              <div className="text-sm text-muted-foreground">Cache Misses</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {validationCache.getEfficiencyScore().toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Efficiency Score</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {performanceMetrics.lastAutoSaveTime 
                  ? formatDuration(Date.now() - performanceMetrics.lastAutoSaveTime)
                  : 'Never'
                }
              </div>
              <div className="text-sm text-muted-foreground">Last Auto-save</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

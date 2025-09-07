/**
 * useWorkflowPerformance - Performance optimization hook for React Flow + Supabase
 * 
 * Phase 2.3a: React Flow Performance Optimizations
 * Source: DATABASE.md React Flow Performance Optimizations for Supabase
 * 
 * Features:
 * - Optimized node/edge rendering with React.memo
 * - Debounced Supabase auto-save
 * - Validation result caching
 * - Performance monitoring and metrics
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { workflowService } from '@/lib/services/WorkflowService'
import { type ValidationResult } from '@/components/workflow/utils/workflowValidation'
import { type WorkflowState } from '@/components/workflow/toolbar/WorkflowToolbar'

interface PerformanceMetrics {
  lastRenderTime: number
  nodeCount: number
  edgeCount: number
  validationCacheHits: number
  validationCacheMisses: number
  autoSaveCount: number
  lastAutoSaveTime?: number
}

interface UseWorkflowPerformanceOptions {
  autoSaveDelay?: number // Debounce delay for auto-save (default: 2000ms)
  validationCacheSize?: number // Max cached validation results (default: 50)
  enablePerformanceLogging?: boolean // Log performance metrics (default: false)
}

const DEFAULT_OPTIONS: Required<UseWorkflowPerformanceOptions> = {
  autoSaveDelay: 2000,
  validationCacheSize: 50,
  enablePerformanceLogging: false
}

export function useWorkflowPerformance(
  workflowState: WorkflowState,
  options: UseWorkflowPerformanceOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Performance metrics state
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lastRenderTime: 0,
    nodeCount: 0,
    edgeCount: 0,
    validationCacheHits: 0,
    validationCacheMisses: 0,
    autoSaveCount: 0
  })

  // Validation cache with LRU-like behavior
  const validationCache = useRef<Map<string, { result: ValidationResult; timestamp: number }>>(new Map())
  const autoSaveTimer = useRef<NodeJS.Timeout>()
  const renderStartTime = useRef<number>(0)

  // ===================
  // Validation Caching (Phase 2.3b)
  // ===================

  /**
   * Generate cache key for nodes/edges combination
   */
  const generateCacheKey = useCallback((nodes: Node[], edges: Edge[]): string => {
    const nodeHash = nodes
      .map(n => `${n.id}:${n.type}:${JSON.stringify(n.data)}`)
      .sort()
      .join('|')
    
    const edgeHash = edges
      .map(e => `${e.id}:${e.source}:${e.target}`)
      .sort()
      .join('|')
    
    return `${nodeHash}::${edgeHash}`
  }, [])

  /**
   * Get cached validation result or compute new one
   */
  const getValidationResult = useCallback(async (
    nodes: Node[], 
    edges: Edge[]
  ): Promise<ValidationResult> => {
    const cacheKey = generateCacheKey(nodes, edges)
    const cached = validationCache.current.get(cacheKey)
    
    // Check if cache hit and not expired (5 minutes)
    if (cached && Date.now() - cached.timestamp < 300000) {
      setMetrics(prev => ({ ...prev, validationCacheHits: prev.validationCacheHits + 1 }))
      if (opts.enablePerformanceLogging) {
        console.log('🎯 Validation cache hit')
      }
      return cached.result
    }

    // Cache miss - compute validation
    setMetrics(prev => ({ ...prev, validationCacheMisses: prev.validationCacheMisses + 1 }))
    
    if (opts.enablePerformanceLogging) {
      console.log('💨 Computing new validation result')
    }

    // Import validation function dynamically to avoid circular imports
    const { validateWorkflow } = await import('@/components/workflow/utils/workflowValidation')
    const result = validateWorkflow(nodes, edges)

    // Store in cache with cleanup for memory management
    if (validationCache.current.size >= opts.validationCacheSize) {
      // Remove oldest entry
      const oldestKey = validationCache.current.keys().next().value
      if (oldestKey) {
        validationCache.current.delete(oldestKey)
      }
    }

    validationCache.current.set(cacheKey, {
      result,
      timestamp: Date.now()
    })

    return result
  }, [generateCacheKey, opts.validationCacheSize, opts.enablePerformanceLogging])

  // ===================
  // Debounced Auto-Save (Phase 2.3a)
  // ===================

  /**
   * Debounced auto-save to Supabase
   */
  const debouncedAutoSave = useCallback((
    nodes: Node[], 
    edges: Edge[]
  ) => {
    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    // Set new timer
    autoSaveTimer.current = setTimeout(async () => {
      try {
        if (!workflowState.id) return

        const updateData = {
          nodes,
          edges
        }

        const result = await workflowService.updateWorkflow(workflowState.id, updateData)
        
        if (result) {
          setMetrics(prev => ({ 
            ...prev, 
            autoSaveCount: prev.autoSaveCount + 1,
            lastAutoSaveTime: Date.now()
          }))
          
          if (opts.enablePerformanceLogging) {
            console.log('💾 Auto-saved workflow to Supabase')
          }
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, opts.autoSaveDelay)
  }, [workflowState.id, opts.autoSaveDelay, opts.enablePerformanceLogging])

  // ===================
  // Performance Monitoring
  // ===================

  /**
   * Start render timing
   */
  const startRenderTiming = useCallback(() => {
    renderStartTime.current = performance.now()
  }, [])

  /**
   * End render timing and update metrics
   */
  const endRenderTiming = useCallback((nodeCount: number, edgeCount: number) => {
    const renderTime = performance.now() - renderStartTime.current
    
    setMetrics(prev => ({
      ...prev,
      lastRenderTime: renderTime,
      nodeCount,
      edgeCount
    }))

    if (opts.enablePerformanceLogging && renderTime > 100) {
      console.warn(`🐌 Slow render detected: ${renderTime.toFixed(2)}ms for ${nodeCount} nodes, ${edgeCount} edges`)
    }
  }, [opts.enablePerformanceLogging])

  // ===================
  // Optimized Node/Edge Memoization
  // ===================

  /**
   * Memoize nodes for React Flow performance
   */
  const memoizedNodes = useMemo(() => {
    startRenderTiming()
    return nodes => {
      // Apply any node-level optimizations here
      return nodes.map(node => ({
        ...node,
        // Add stable key for React optimization
        key: `node-${node.id}-${node.type}`
      }))
    }
  }, [startRenderTiming])

  /**
   * Memoize edges for React Flow performance
   */
  const memoizedEdges = useMemo(() => {
    return edges => {
      // Apply any edge-level optimizations here
      return edges.map(edge => ({
        ...edge,
        // Add stable key for React optimization
        key: `edge-${edge.id}-${edge.source}-${edge.target}`
      }))
    }
  }, [])

  /**
   * Optimized node change handler with auto-save
   */
  const handleNodesChange = useCallback((
    nodes: Node[], 
    edges: Edge[],
    originalHandler?: (nodes: Node[]) => void
  ) => {
    // Call original handler
    if (originalHandler) {
      originalHandler(nodes)
    }

    // Trigger auto-save
    debouncedAutoSave(nodes, edges)
    
    // Update performance metrics
    endRenderTiming(nodes.length, edges.length)
  }, [debouncedAutoSave, endRenderTiming])

  /**
   * Optimized edge change handler with auto-save
   */
  const handleEdgesChange = useCallback((
    nodes: Node[], 
    edges: Edge[],
    originalHandler?: (edges: Edge[]) => void
  ) => {
    // Call original handler
    if (originalHandler) {
      originalHandler(edges)
    }

    // Trigger auto-save
    debouncedAutoSave(nodes, edges)
    
    // Update performance metrics
    endRenderTiming(nodes.length, edges.length)
  }, [debouncedAutoSave, endRenderTiming])

  // ===================
  // Cleanup
  // ===================

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [])

  // ===================
  // Performance Suggestions
  // ===================

  /**
   * Get performance suggestions based on current metrics
   */
  const getPerformanceSuggestions = useCallback((): string[] => {
    const suggestions: string[] = []
    
    if (metrics.lastRenderTime > 100) {
      suggestions.push('Consider reducing the number of visible nodes or implementing virtualization')
    }
    
    if (metrics.nodeCount > 100) {
      suggestions.push('Large workflow detected - consider breaking into smaller sub-workflows')
    }
    
    if (metrics.validationCacheMisses > metrics.validationCacheHits * 2) {
      suggestions.push('Low validation cache hit rate - consider increasing cache size')
    }
    
    if (metrics.autoSaveCount > 50) {
      suggestions.push('High auto-save frequency detected - consider increasing debounce delay')
    }
    
    return suggestions
  }, [metrics])

  return {
    // Performance-optimized handlers
    memoizedNodes,
    memoizedEdges,
    handleNodesChange,
    handleEdgesChange,
    
    // Validation with caching
    getValidationResult,
    
    // Auto-save control
    debouncedAutoSave,
    
    // Performance monitoring
    metrics,
    getPerformanceSuggestions,
    
    // Timing utilities
    startRenderTiming,
    endRenderTiming,
    
    // Cache management
    clearValidationCache: () => validationCache.current.clear()
  }
}

/**
 * Higher-order component for optimizing React Flow node components
 */
export function withNodeOptimization<T extends { id: string; data: any }>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison for node optimization
    return (
      prevProps.id === nextProps.id &&
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
    )
  })
}

/**
 * Higher-order component for optimizing React Flow edge components
 */
export function withEdgeOptimization<T extends { id: string; source: string; target: string }>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison for edge optimization
    return (
      prevProps.id === nextProps.id &&
      prevProps.source === nextProps.source &&
      prevProps.target === nextProps.target
    )
  })
}

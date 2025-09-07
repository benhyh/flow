/**
 * Performance Test Page - Showcase React Flow + Supabase optimizations
 * 
 * Phase 2.3d: Performance Testing and Demonstration
 * Source: DATABASE.md Performance Optimizations and Caching
 */

'use client'

import React, { useState, useCallback } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { PerformanceDashboard } from '@/components/workflow/performance/PerformanceDashboard'
import { useWorkflowPerformance } from '@/hooks/useWorkflowPerformance'
import { useWorkflowState } from '@/components/workflow/hooks/useWorkflowState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Database, BarChart3, Settings } from 'lucide-react'

// Sample workflow data for testing
const sampleNodes: Node[] = [
  {
    id: '1',
    type: 'gmailTrigger',
    position: { x: 100, y: 100 },
    data: { label: 'Gmail Trigger', config: { subject: 'Test' } }
  },
  {
    id: '2',
    type: 'trelloAction',
    position: { x: 300, y: 100 },
    data: { label: 'Create Trello Card', config: { board: 'test-board' } }
  },
  {
    id: '3',
    type: 'asanaAction',
    position: { x: 500, y: 100 },
    data: { label: 'Create Asana Task', config: { project: 'test-project' } }
  }
]

const sampleEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2'
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3'
  }
]

export default function PerformancePage() {
  const [nodes, setNodes] = useState<Node[]>(sampleNodes)
  const [edges, setEdges] = useState<Edge[]>(sampleEdges)
  const [testRunning, setTestRunning] = useState(false)

  // Use workflow state management
  const { workflowState, validateCurrentWorkflow } = useWorkflowState({
    name: 'Performance Test Workflow',
    status: 'draft'
  })

  // Use performance optimizations
  const {
    memoizedNodes,
    memoizedEdges,
    handleNodesChange,
    handleEdgesChange,
    getValidationResult,
    metrics,
    getPerformanceSuggestions
  } = useWorkflowPerformance(workflowState, {
    enablePerformanceLogging: true
  })

  // ===================
  // Performance Test Functions
  // ===================

  /**
   * Simulate heavy workflow operations to test performance
   */
  const runPerformanceTest = useCallback(async () => {
    setTestRunning(true)
    
    try {
      console.log('🚀 Starting performance test...')
      
      // Test 1: Validation caching
      console.log('Test 1: Validation caching performance')
      const start1 = performance.now()
      
      // Run validation multiple times to test caching
      for (let i = 0; i < 5; i++) {
        await getValidationResult(nodes, edges)
      }
      
      const end1 = performance.now()
      console.log(`✅ Validation test completed in ${(end1 - start1).toFixed(2)}ms`)
      
      // Test 2: Node manipulation
      console.log('Test 2: Node manipulation performance')
      const start2 = performance.now()
      
      // Add many nodes quickly
      const newNodes = [...nodes]
      for (let i = 0; i < 20; i++) {
        newNodes.push({
          id: `test-${i}`,
          type: 'default',
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          data: { label: `Test Node ${i}` }
        })
      }
      
      // Use optimized handler
      handleNodesChange(newNodes, edges, setNodes)
      
      const end2 = performance.now()
      console.log(`✅ Node manipulation test completed in ${(end2 - start2).toFixed(2)}ms`)
      
      // Test 3: Edge manipulation  
      console.log('Test 3: Edge manipulation performance')
      const start3 = performance.now()
      
      // Add many edges
      const newEdges = [...edges]
      for (let i = 0; i < 10; i++) {
        if (i < newNodes.length - 1) {
          newEdges.push({
            id: `test-edge-${i}`,
            source: newNodes[i].id,
            target: newNodes[i + 1].id
          })
        }
      }
      
      // Use optimized handler
      handleEdgesChange(newNodes, newEdges, setEdges)
      
      const end3 = performance.now()
      console.log(`✅ Edge manipulation test completed in ${(end3 - start3).toFixed(2)}ms`)
      
      console.log('🎉 Performance test completed!')
      
    } catch (error) {
      console.error('❌ Performance test failed:', error)
    } finally {
      setTestRunning(false)
    }
  }, [nodes, edges, getValidationResult, handleNodesChange, handleEdgesChange])

  /**
   * Reset to original sample data
   */
  const resetWorkflow = useCallback(() => {
    setNodes(sampleNodes)
    setEdges(sampleEdges)
  }, [])

  /**
   * Add random nodes for stress testing
   */
  const addRandomNodes = useCallback(() => {
    const newNodes = [...nodes]
    for (let i = 0; i < 10; i++) {
      newNodes.push({
        id: `random-${Date.now()}-${i}`,
        type: 'default',
        position: { 
          x: Math.random() * 800, 
          y: Math.random() * 600 
        },
        data: { 
          label: `Random Node ${i}`,
          config: { value: Math.random() }
        }
      })
    }
    setNodes(newNodes)
  }, [nodes])

  // ===================
  // Render
  // ===================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Performance Testing Suite
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test and monitor React Flow + Supabase performance optimizations including 
            validation caching, debounced auto-save, and memoized components.
          </p>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Performance Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={runPerformanceTest}
                disabled={testRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                {testRunning ? 'Running Tests...' : 'Run Performance Test'}
              </Button>
              
              <Button 
                onClick={addRandomNodes}
                variant="outline"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Add 10 Random Nodes
              </Button>
              
              <Button 
                onClick={resetWorkflow}
                variant="outline"
              >
                Reset to Sample
              </Button>
              
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="outline">
                  {nodes.length} Nodes
                </Badge>
                <Badge variant="outline">
                  {edges.length} Edges
                </Badge>
                <Badge variant="outline">
                  Status: {workflowState.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Dashboard */}
        <PerformanceDashboard
          workflowState={workflowState}
          nodes={memoizedNodes(nodes)}
          edges={memoizedEdges(edges)}
        />

        {/* Current Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                Render Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Last Render:</span>
                  <span className="text-sm font-mono">
                    {metrics.lastRenderTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Node Count:</span>
                  <span className="text-sm font-mono">{metrics.nodeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Edge Count:</span>
                  <span className="text-sm font-mono">{metrics.edgeCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4" />
                Cache Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cache Hits:</span>
                  <span className="text-sm font-mono text-green-600">
                    {metrics.validationCacheHits}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cache Misses:</span>
                  <span className="text-sm font-mono text-red-600">
                    {metrics.validationCacheMisses}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Hit Rate:</span>
                  <span className="text-sm font-mono">
                    {metrics.validationCacheHits + metrics.validationCacheMisses > 0
                      ? ((metrics.validationCacheHits / (metrics.validationCacheHits + metrics.validationCacheMisses)) * 100).toFixed(1)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                Auto-Save
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Save Count:</span>
                  <span className="text-sm font-mono">{metrics.autoSaveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Last Save:</span>
                  <span className="text-sm font-mono">
                    {metrics.lastAutoSaveTime 
                      ? `${((Date.now() - metrics.lastAutoSaveTime) / 1000).toFixed(1)}s ago`
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Suggestions */}
        {getPerformanceSuggestions().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {getPerformanceSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">
                      Tip
                    </Badge>
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

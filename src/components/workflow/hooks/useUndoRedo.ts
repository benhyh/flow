/**
 * Undo/Redo Hook for Workflow Editor
 * Provides undo/redo functionality for node and edge changes
 */

import { useState, useCallback, useRef } from 'react'
import { type Node, type Edge } from '@xyflow/react'

export interface WorkflowSnapshot {
  nodes: Node[]
  edges: Edge[]
  timestamp: number
  description?: string
}

interface UndoRedoState {
  history: WorkflowSnapshot[]
  currentIndex: number
  maxHistorySize: number
}

const DEFAULT_MAX_HISTORY = 50

export function useUndoRedo(
  initialNodes: Node[] = [],
  initialEdges: Edge[] = [],
  maxHistorySize: number = DEFAULT_MAX_HISTORY
) {
  const [state, setState] = useState<UndoRedoState>({
    history: [{
      nodes: initialNodes,
      edges: initialEdges,
      timestamp: Date.now(),
      description: 'Initial state'
    }],
    currentIndex: 0,
    maxHistorySize
  })

  // Track if we're currently applying an undo/redo to prevent infinite loops
  const isApplyingHistory = useRef(false)

  /**
   * Add a new snapshot to history
   */
  const takeSnapshot = useCallback((
    nodes: Node[], 
    edges: Edge[], 
    description?: string
  ) => {
    // Don't take snapshot if we're applying history
    if (isApplyingHistory.current) return

    setState(prevState => {
      const newSnapshot: WorkflowSnapshot = {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
        edges: JSON.parse(JSON.stringify(edges)), // Deep clone
        timestamp: Date.now(),
        description
      }

      // Remove any future history if we're not at the end
      const newHistory = prevState.history.slice(0, prevState.currentIndex + 1)
      
      // Add new snapshot
      newHistory.push(newSnapshot)
      
      // Limit history size
      if (newHistory.length > prevState.maxHistorySize) {
        newHistory.shift()
      }

      return {
        ...prevState,
        history: newHistory,
        currentIndex: newHistory.length - 1
      }
    })
  }, [])

  /**
   * Undo last action
   */
  const undo = useCallback((): { nodes: Node[]; edges: Edge[] } | null => {
    if (state.currentIndex <= 0) return null

    const newIndex = state.currentIndex - 1
    const snapshot = state.history[newIndex]

    setState(prevState => ({
      ...prevState,
      currentIndex: newIndex
    }))

    isApplyingHistory.current = true
    
    // Return the snapshot to apply
    return {
      nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
      edges: JSON.parse(JSON.stringify(snapshot.edges))
    }
  }, [state.currentIndex, state.history])

  /**
   * Redo next action
   */
  const redo = useCallback((): { nodes: Node[]; edges: Edge[] } | null => {
    if (state.currentIndex >= state.history.length - 1) return null

    const newIndex = state.currentIndex + 1
    const snapshot = state.history[newIndex]

    setState(prevState => ({
      ...prevState,
      currentIndex: newIndex
    }))

    isApplyingHistory.current = true

    // Return the snapshot to apply
    return {
      nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
      edges: JSON.parse(JSON.stringify(snapshot.edges))
    }
  }, [state.currentIndex, state.history])

  /**
   * Clear history flag after applying
   */
  const finishApplyingHistory = useCallback(() => {
    isApplyingHistory.current = false
  }, [])

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      history: [prevState.history[prevState.currentIndex]],
      currentIndex: 0
    }))
  }, [])

  /**
   * Get current snapshot info
   */
  const getCurrentSnapshot = useCallback((): WorkflowSnapshot | null => {
    return state.history[state.currentIndex] || null
  }, [state.history, state.currentIndex])

  /**
   * Get history info for debugging
   */
  const getHistoryInfo = useCallback(() => {
    return {
      totalSnapshots: state.history.length,
      currentIndex: state.currentIndex,
      canUndo: state.currentIndex > 0,
      canRedo: state.currentIndex < state.history.length - 1,
      currentDescription: state.history[state.currentIndex]?.description,
      historySize: JSON.stringify(state.history).length
    }
  }, [state])

  return {
    // Actions
    takeSnapshot,
    undo,
    redo,
    clearHistory,
    finishApplyingHistory,
    
    // State queries
    canUndo: state.currentIndex > 0,
    canRedo: state.currentIndex < state.history.length - 1,
    getCurrentSnapshot,
    getHistoryInfo,
    
    // History data
    history: state.history,
    currentIndex: state.currentIndex
  }
}

/**
 * Hook for automatic snapshot taking based on node/edge changes
 */
export function useAutoSnapshot(
  nodes: Node[],
  edges: Edge[],
  undoRedo: ReturnType<typeof useUndoRedo>,
  debounceMs: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSnapshotRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: []
  })

  const scheduleSnapshot = useCallback((description?: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Schedule new snapshot
    timeoutRef.current = setTimeout(() => {
      // Check if there are actual changes
      const hasChanges = 
        JSON.stringify(nodes) !== JSON.stringify(lastSnapshotRef.current.nodes) ||
        JSON.stringify(edges) !== JSON.stringify(lastSnapshotRef.current.edges)

      if (hasChanges) {
        undoRedo.takeSnapshot(nodes, edges, description)
        lastSnapshotRef.current = { nodes, edges }
      }
    }, debounceMs)
  }, [nodes, edges, undoRedo, debounceMs])

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    scheduleSnapshot,
    cleanup
  }
}

/**
 * Keyboard shortcuts for undo/redo
 */
export function useUndoRedoKeyboard(
  undoRedo: ReturnType<typeof useUndoRedo>,
  onApplySnapshot: (snapshot: { nodes: Node[]; edges: Edge[] }) => void
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Ctrl+Z (undo) or Cmd+Z on Mac
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      const snapshot = undoRedo.undo()
      if (snapshot) {
        onApplySnapshot(snapshot)
        setTimeout(() => undoRedo.finishApplyingHistory(), 0)
      }
      return
    }

    // Check for Ctrl+Y (redo) or Ctrl+Shift+Z or Cmd+Shift+Z on Mac
    if (
      ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z')
    ) {
      event.preventDefault()
      const snapshot = undoRedo.redo()
      if (snapshot) {
        onApplySnapshot(snapshot)
        setTimeout(() => undoRedo.finishApplyingHistory(), 0)
      }
      return
    }
  }, [undoRedo, onApplySnapshot])

  return { handleKeyDown }
}
'use client'

import React, { useEffect, useCallback } from 'react'
import { useReactFlow, type Node, type Edge } from '@xyflow/react'
import { toast } from 'sonner'

interface KeyboardShortcutsProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onSave?: () => void
  onRunTest?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

export function KeyboardShortcuts({
  onNodesChange,
  onEdgesChange,
  onSave,
  onRunTest,
  onUndo,
  onRedo
}: KeyboardShortcutsProps) {
  const { 
    fitView, 
    zoomIn, 
    zoomOut, 
    deleteElements,
    getNodes,
    getEdges
  } = useReactFlow()

  const showShortcutsHelp = useCallback(() => {
    toast.info(
      <div className="text-sm">
        <div className="font-semibold mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1 text-xs">
          <div><kbd>Ctrl+S</kbd> Save workflow</div>
          <div><kbd>Ctrl+Z</kbd> Undo</div>
          <div><kbd>Ctrl+Y</kbd> Redo</div>
          <div><kbd>Ctrl+A</kbd> Select all</div>
          <div><kbd>Del</kbd> Delete selected</div>
          <div><kbd>Ctrl+F</kbd> Fit to view</div>
          <div><kbd>Ctrl+R</kbd> Run test</div>
          <div><kbd>Ctrl+D</kbd> Duplicate</div>
          <div><kbd>F1</kbd> Show help</div>
        </div>
      </div>,
      { duration: 5000 }
    )
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey
    const isShift = event.shiftKey
    const target = event.target as HTMLElement
    
    // Don't trigger shortcuts when typing in inputs
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    // Prevent default browser shortcuts for our custom ones
    const shouldPreventDefault = [
      'KeyS', 'KeyZ', 'KeyY', 'KeyA', 'KeyD', 'KeyF', 'Equal', 'Minus'
    ].includes(event.code) && isCtrlOrCmd

    if (shouldPreventDefault) {
      event.preventDefault()
    }

    // Handle shortcuts
    switch (event.code) {
      // Save workflow (Ctrl/Cmd + S)
      case 'KeyS':
        if (isCtrlOrCmd) {
          onSave?.()
          toast.success('Workflow saved')
        }
        break

      // Undo (Ctrl/Cmd + Z)
      case 'KeyZ':
        if (isCtrlOrCmd && !isShift) {
          onUndo?.()
          toast.info('Undo')
        }
        break

      // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
      case 'KeyY':
        if (isCtrlOrCmd) {
          onRedo?.()
          toast.info('Redo')
        }
        break

      // Redo alternative (Ctrl/Cmd + Shift + Z)
      case 'KeyZ':
        if (isCtrlOrCmd && isShift) {
          onRedo?.()
          toast.info('Redo')
        }
        break

      // Select all nodes (Ctrl/Cmd + A)
      case 'KeyA':
        if (isCtrlOrCmd) {
          const allNodes = getNodes()
          const updatedNodes = allNodes.map(node => ({ ...node, selected: true }))
          onNodesChange(updatedNodes)
          toast.info(`Selected ${allNodes.length} nodes`)
        }
        break

      // Delete selected elements (Delete or Backspace)
      case 'Delete':
      case 'Backspace':
        const selectedNodes = getNodes().filter(node => node.selected)
        const selectedEdges = getEdges().filter(edge => edge.selected)
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          deleteElements({ 
            nodes: selectedNodes.map(n => ({ id: n.id })),
            edges: selectedEdges.map(e => ({ id: e.id }))
          })
          toast.success(`Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges`)
        }
        break

      // Fit view (Ctrl/Cmd + F)
      case 'KeyF':
        if (isCtrlOrCmd) {
          fitView({ padding: 0.1, duration: 300 })
          toast.info('Fit to view')
        }
        break

      // Zoom in (Ctrl/Cmd + Plus/Equal)
      case 'Equal':
        if (isCtrlOrCmd) {
          zoomIn({ duration: 200 })
        }
        break

      // Zoom out (Ctrl/Cmd + Minus)
      case 'Minus':
        if (isCtrlOrCmd) {
          zoomOut({ duration: 200 })
        }
        break

      // Run test (Ctrl/Cmd + R)
      case 'KeyR':
        if (isCtrlOrCmd) {
          event.preventDefault()
          onRunTest?.()
          toast.info('Running test...')
        }
        break

      // Duplicate selected nodes (Ctrl/Cmd + D)
      case 'KeyD':
        if (isCtrlOrCmd) {
          const selectedNodes = getNodes().filter(node => node.selected)
          if (selectedNodes.length > 0) {
            const duplicatedNodes = selectedNodes.map(node => ({
              ...node,
              id: `${node.id}-copy-${Date.now()}`,
              position: {
                x: node.position.x + 50,
                y: node.position.y + 50
              },
              selected: false
            }))
            
            onNodesChange([...getNodes(), ...duplicatedNodes])
            toast.success(`Duplicated ${selectedNodes.length} nodes`)
          }
        }
        break

      // Help (F1 or ?)
      case 'F1':
      case 'Slash':
        if (event.code === 'Slash' && isShift) {
          showShortcutsHelp()
        } else if (event.code === 'F1') {
          showShortcutsHelp()
        }
        break

      // Escape - Clear selection
      case 'Escape':
        const allNodes = getNodes()
        const allEdges = getEdges()
        const hasSelection = allNodes.some(n => n.selected) || allEdges.some(e => e.selected)
        
        if (hasSelection) {
          onNodesChange(allNodes.map(node => ({ ...node, selected: false })))
          onEdgesChange(allEdges.map(edge => ({ ...edge, selected: false })))
          toast.info('Selection cleared')
        }
        break
    }
  }, [
    onNodesChange, onEdgesChange, onSave, onRunTest, onUndo, onRedo,
    fitView, zoomIn, zoomOut, deleteElements, getNodes, getEdges, showShortcutsHelp
  ])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return null // This component doesn't render anything
}

// Helper component to show keyboard shortcuts in UI
export function KeyboardShortcutsHelp({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs text-white/50 ${className}`}>
      <div className="font-medium mb-2">Keyboard Shortcuts:</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+S</kbd> Save</div>
        <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+Z</kbd> Undo</div>
        <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+F</kbd> Fit View</div>
        <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+R</kbd> Test</div>
        <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Del</kbd> Delete</div>
        <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">F1</kbd> Help</div>
      </div>
    </div>
  )
}
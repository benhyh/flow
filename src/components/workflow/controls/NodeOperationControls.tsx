/**
 * Node Operation Controls for individual node operations (add/delete undo)
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Undo2, Redo2, Trash2 } from 'lucide-react'
import { useNodeOperationsContext } from '../contexts/NodeOperationsContext'
import { type Node, type Edge } from '@xyflow/react'
import { toast } from 'sonner'

interface NodeOperationControlsProps {
  onUndoOperation: (shouldAdd: boolean, node: Node, edges: Edge[]) => void
  currentNodesCount: number
}

export function NodeOperationControls({ onUndoOperation, currentNodesCount }: NodeOperationControlsProps) {
  const { 
    canUndo, 
    getLastOperation, 
    undoLastOperation, 
    operationsCount,
    additionsCount,
    deletionsCount,
    clearOperations,
    getRecentlyDeletedNodes
  } = useNodeOperationsContext()

  const handleUndo = () => {
    const lastOperation = getLastOperation()
    if (!lastOperation) return

    const undoResult = undoLastOperation()
    if (undoResult) {
      onUndoOperation(undoResult.shouldAdd, undoResult.node, undoResult.connectedEdges)
      
      const actionText = undoResult.operation.type === 'add' ? 'removed' : 'restored'
      toast.success(`Node operation undone!`, {
        description: `${undoResult.node.data.label} ${actionText}`
      })
    } else {
      toast.error('Failed to undo operation')
    }
  }

  const handleRecover = () => {
    // This button specifically restores the most recently deleted node
    // without removing it from the operations stack
    const recentDeleted = getRecentlyDeletedNodes(1)
    if (recentDeleted.length > 0) {
      const { node, connectedEdges } = recentDeleted[0]
      onUndoOperation(true, node, connectedEdges) // shouldAdd = true to restore the node
      toast.success(`Node recovered!`, {
        description: `Recovered "${node.data.label}"`
      })
    } else {
      toast.info('No deleted nodes to recover')
    }
  }

  const getUndoTooltip = () => {
    const lastOp = getLastOperation()
    if (!lastOp) return 'No operations to undo'
    
    const action = lastOp.type === 'add' ? 'Remove last added' : 'Restore deleted'
    return `${action}: "${lastOp.node.data.label}"`
  }

  const getRecoverTooltip = () => {
    const recentDeleted = getRecentlyDeletedNodes(1)
    if (recentDeleted.length === 0) return 'No deleted nodes to recover'
    return `Recover deleted: "${recentDeleted[0].node.data.label}"`
  }

  const handleConfirmClear = () => {
    clearOperations()
    toast.success('History cleared successfully', {
      description: `Cleared ${operationsCount} operations from session`
    })
  }

  const getClearTooltip = () => {
    if (operationsCount === 0) return 'No operations to clear'
    return `Clear ${operationsCount} operations (${additionsCount} adds, ${deletionsCount} deletes)`
  }

  return (
    <div className="flex items-center bg-transparent p-1 gap-0.5">
      <Button
        size="sm"
        variant="ghost" 
        className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
        disabled={!canUndo}
        onClick={handleUndo}
        title={getUndoTooltip()}
      >
        <Undo2 size={14} />
      </Button>
      <Button
        size="sm"
        variant="ghost" 
        className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
        disabled={getRecentlyDeletedNodes(1).length === 0}
        onClick={handleRecover}
        title={getRecoverTooltip()}
      >
        <Redo2 size={14} />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost" 
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
            disabled={operationsCount === 0}
            title={getClearTooltip()}
          >
            <Trash2 size={14} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#2d2d2d] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Clear Operation History</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              There are currently {currentNodesCount} nodes in your workflow and {operationsCount} operations in your history. Are you sure you want to reset your history?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmClear}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

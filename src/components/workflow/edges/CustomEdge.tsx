'use client'

import React, { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps
} from '@xyflow/react'
import { X } from 'lucide-react'

interface CustomEdgeData extends Record<string, unknown> {
  isValid?: boolean
  validationMessage?: string
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected
}: EdgeProps) {
  const { deleteElements } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Determine edge styling based on validation state
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: 2,
      ...style
    }

    if (selected || isHovered) {
      return {
        ...baseStyle,
        stroke: '#8b5cf6', // Purple when selected or hovered
        strokeWidth: selected ? 3 : 2,
        opacity: isHovered && !selected ? 0.8 : 1
      }
    }

    if ((data as CustomEdgeData)?.isValid === false) {
      return {
        ...baseStyle,
        stroke: '#ef4444', // Red for invalid
        strokeDasharray: '5,5', // Dashed line for invalid
        animation: 'dash 1s linear infinite'
      }
    }

    return {
      ...baseStyle,
      stroke: '#6b7280' // Default gray
    }
  }

  const handleDelete = () => {
    deleteElements({ edges: [{ id }] })
  }

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={getEdgeStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Edge Label with Delete Button (show when selected or hovered) */}
      {(selected || isHovered) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={handleDelete}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors shadow-lg"
              title="Delete connection"
            >
              <X size={12} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Validation Message (only show for invalid connections) */}
      {(data as CustomEdgeData)?.isValid === false && (data as CustomEdgeData)?.validationMessage && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 10}px)`,
              pointerEvents: 'none',
            }}
            className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg"
          >
            {(data as CustomEdgeData).validationMessage}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// CSS for dashed line animation (add to global styles)
export const customEdgeStyles = `
  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }
`
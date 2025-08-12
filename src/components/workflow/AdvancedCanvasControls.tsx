'use client'

import React, { useState, useCallback } from 'react'
import { 
  useReactFlow, 
  MiniMap, 
  Controls, 
  ControlButton,
  Panel,
  type Node 
} from '@xyflow/react'
import { 
  Maximize2, 
  Grid3X3, 
  Eye, 
  EyeOff, 
  RotateCcw,
  ZoomIn,
  Move,
  MousePointer,
  Hand
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useResponsive } from './ResponsiveLayout'

interface AdvancedCanvasControlsProps {
  nodes: Node[]
  showMinimap?: boolean
  onToggleMinimap?: (show: boolean) => void
  className?: string
}

export function AdvancedCanvasControls({
  nodes,
  showMinimap = true,
  onToggleMinimap,
  className = ''
}: AdvancedCanvasControlsProps) {
  const { 
    fitView, 
    zoomTo,
    getZoom,
    setCenter
  } = useReactFlow()
  
  const { isMobile } = useResponsive()
  const [isMinimapVisible, setIsMinimapVisible] = useState(showMinimap && !isMobile)
  const [panMode, setPanMode] = useState<'select' | 'pan'>('select')

  // Minimap node color function
  const nodeColor = useCallback((node: Node) => {
    const nodeData = node.data as Record<string, unknown>
    return (nodeData?.color as string) || '#8b5cf6'
  }, [])

  // Toggle minimap visibility
  const toggleMinimap = useCallback(() => {
    const newState = !isMinimapVisible
    setIsMinimapVisible(newState)
    onToggleMinimap?.(newState)
  }, [isMinimapVisible, onToggleMinimap])

  // Fit view with animation
  const handleFitView = useCallback(() => {
    fitView({ 
      padding: 0.1, 
      duration: 500,
      maxZoom: 1.2,
      minZoom: 0.1
    })
  }, [fitView])

  // Reset zoom to 100%
  const resetZoom = useCallback(() => {
    zoomTo(1, { duration: 300 })
  }, [zoomTo])

  // Center view on nodes
  const centerView = useCallback(() => {
    if (nodes.length === 0) return
    
    // Calculate center point of all nodes
    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + (node.width || 200)),
        maxY: Math.max(acc.maxY, node.position.y + (node.height || 100))
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    )
    
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    
    setCenter(centerX, centerY, { zoom: getZoom(), duration: 500 })
  }, [nodes, setCenter, getZoom])

  // Toggle pan mode
  const togglePanMode = useCallback(() => {
    setPanMode(current => current === 'select' ? 'pan' : 'select')
  }, [])

  return (
    <>
      {/* Enhanced Controls */}
      <Controls 
        className={className}
        showZoom={!isMobile}
        showFitView={!isMobile}
        showInteractive={!isMobile}
      >
        {/* Fit View */}
        <ControlButton onClick={handleFitView} title="Fit to view (Ctrl+F)">
          <Maximize2 size={16} />
        </ControlButton>

        {/* Reset Zoom */}
        <ControlButton onClick={resetZoom} title="Reset zoom (100%)">
          <RotateCcw size={16} />
        </ControlButton>

        {/* Center View */}
        <ControlButton onClick={centerView} title="Center on nodes">
          <Move size={16} />
        </ControlButton>

        {/* Toggle Minimap */}
        {!isMobile && (
          <ControlButton onClick={toggleMinimap} title="Toggle minimap">
            {isMinimapVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </ControlButton>
        )}

        {/* Pan Mode Toggle */}
        <ControlButton 
          onClick={togglePanMode} 
          title={`Switch to ${panMode === 'select' ? 'pan' : 'select'} mode`}
          className={panMode === 'pan' ? 'bg-[#8b5cf6] text-white' : ''}
        >
          {panMode === 'select' ? <Hand size={16} /> : <MousePointer size={16} />}
        </ControlButton>
      </Controls>

      {/* Enhanced Minimap */}
      {isMinimapVisible && !isMobile && (
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          nodeStrokeColor="#ffffff"
          nodeBorderRadius={8}
          maskColor="rgba(0, 0, 0, 0.2)"
          className="bg-[#2d2d2d] rounded-lg"
          style={{
            backgroundColor: '#2d2d2d',
          }}
          pannable
          zoomable
          ariaLabel="Workflow minimap"
        />
      )}

      {/* Zoom Level Indicator */}
      <Panel position="bottom-left" className="bg-[#2d2d2d] rounded px-2 py-1">
        <ZoomIndicator />
      </Panel>

      {/* Node Count Indicator */}
      <Panel position="bottom-right" className="bg-[#2d2d2d] rounded px-2 py-1">
        <div className="text-xs text-white/50">
          {nodes.length} node{nodes.length !== 1 ? 's' : ''}
        </div>
      </Panel>

      {/* Mobile-specific controls */}
      {isMobile && (
        <Panel position="top-right" className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitView}
            className="bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] p-2"
          >
            <Maximize2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            className="bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] p-2"
          >
            <RotateCcw size={16} />
          </Button>
        </Panel>
      )}
    </>
  )
}

// Zoom level indicator component
function ZoomIndicator() {
  const { getZoom } = useReactFlow()
  const [zoom, setZoom] = useState(100)

  React.useEffect(() => {
    const updateZoom = () => {
      const currentZoom = Math.round(getZoom() * 100)
      setZoom(currentZoom)
    }

    updateZoom()
    const interval = setInterval(updateZoom, 100)
    return () => clearInterval(interval)
  }, [getZoom])

  return (
    <div className="text-xs text-white/50 flex items-center gap-1">
      <ZoomIn size={12} />
      {zoom}%
    </div>
  )
}

// Grid toggle component
export function GridToggle({ 
  showGrid, 
  onToggle, 
  className = '' 
}: { 
  showGrid: boolean
  onToggle: (show: boolean) => void
  className?: string 
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onToggle(!showGrid)}
      className={`${className} ${showGrid ? 'bg-[#8b5cf6] text-white' : 'text-white/50'}`}
      title="Toggle grid"
    >
      <Grid3X3 size={16} />
    </Button>
  )
}
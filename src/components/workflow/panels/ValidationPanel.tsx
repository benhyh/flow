'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  X,
} from 'lucide-react'
import {
  type ValidationResult,
  type ValidationError,
} from '../utils/workflowValidation'

interface ValidationPanelProps {
  validation: ValidationResult | null
  isVisible: boolean
  onToggle: () => void
  onFixError?: (error: ValidationError) => void
  className?: string
  hasNodes?: boolean // Whether there are nodes in the workflow
}

export function ValidationPanel({
  validation,
  isVisible,
  onToggle,
  onFixError,
  className = '',
  hasNodes = false,
}: ValidationPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['errors'])
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    if (score >= 50) return 'outline'
    return 'destructive'
  }

  // Simplified: no more category icons or severity levels

  if (!isVisible) {
    const isDisabled = !hasNodes
    
    // Determine icon color based on validation state
    const getIconColor = () => {
      if (isDisabled) {
        return '#5a5a5a' // Gray when disabled
      }
      
      if (!validation || (!validation.errors.length && !validation.warnings.length)) {
        return '#5a5a5a' // Gray when no issues
      }
      
      if (validation.errors.length > 0) {
        return '#ef4444' // Red for errors
      }
      
      if (validation.warnings.length > 0) {
        return '#f97316' // Orange for warnings
      }
      
      return '#5a5a5a' // Default gray
    }
    
    return (
      <button
        onClick={isDisabled ? undefined : onToggle}
        disabled={isDisabled}
        className={`absolute top-4 left-4 z-20 p-2 hover:bg-white/10 rounded transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <AlertCircle 
          size={20} 
          style={{ color: getIconColor() }} 
        />
      </button>
    )
  }

  return (
    <Card className={`absolute top-4 left-4 w-96 max-h-96 z-20 bg-[#2d2d2d] border-[#3d3d3d] text-white ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-white">Workflow Validation</CardTitle>
            {validation && (
              <Badge
                variant={getScoreBadgeVariant(validation.score)}
                className="text-xs"
              >
                {validation.score}/100
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-white hover:bg-[#3d3d3d] hover:text-white">
            <X size={16} />
          </Button>
        </div>
        {validation && (
          <CardDescription>
            {validation.isValid ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} />
                Workflow is valid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle size={14} />
                {validation.errors.length} error
                {validation.errors.length > 1 ? 's' : ''} found
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {!validation ? (
          <div className="text-center py-4 text-gray-300">
            <Info size={24} className="mx-auto mb-2" />
            <p>No validation results yet</p>
            <p className="text-xs">Make changes to see validation feedback</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {/* Errors Section */}
              {validation.errors.length > 0 && (
                <Collapsible
                  open={expandedSections.has('errors')}
                  onOpenChange={() => toggleSection('errors')}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-0 h-auto text-white hover:bg-[#3d3d3d] hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('errors') ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <AlertCircle size={14} className="text-red-600" />
                        <span className="font-medium">Errors</span>
                        <Badge variant="destructive" className="text-xs">
                          {validation.errors.length}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {validation.errors.map(error => (
                      <ValidationErrorItem
                        key={error.id}
                        error={error}
                        onFix={onFixError}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Warnings Section */}
              {validation.warnings.length > 0 && (
                <Collapsible
                  open={expandedSections.has('warnings')}
                  onOpenChange={() => toggleSection('warnings')}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-0 h-auto text-white hover:bg-[#3d3d3d] hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('warnings') ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <AlertTriangle size={14} className="text-yellow-600" />
                        <span className="font-medium">Warnings</span>
                        <Badge variant="secondary" className="text-xs">
                          {validation.warnings.length}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {validation.warnings.map(warning => (
                      <ValidationErrorItem
                        key={warning.id}
                        error={warning}
                        onFix={onFixError}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Info Section */}
              {validation.info.length > 0 && (
                <Collapsible
                  open={expandedSections.has('info')}
                  onOpenChange={() => toggleSection('info')}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-0 h-auto text-white hover:bg-[#3d3d3d] hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has('info') ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <Info size={14} className="text-blue-600" />
                        <span className="font-medium">Information</span>
                        <Badge variant="outline" className="text-xs">
                          {validation.info.length}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {validation.info.map(info => (
                      <ValidationErrorItem
                        key={info.id}
                        error={info}
                        onFix={onFixError}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Success State */}
              {validation.errors.length === 0 &&
                validation.warnings.length === 0 &&
                validation.info.length === 0 && (
                  <div className="text-center py-4">
                    <CheckCircle
                      size={24}
                      className="mx-auto mb-2 text-green-600"
                    />
                    <p className="text-green-600 font-medium">
                      Perfect workflow!
                    </p>
                    <p className="text-xs text-gray-300">
                      No issues found
                    </p>
                  </div>
                )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

interface ValidationErrorItemProps {
  error: ValidationError
  onFix?: (error: ValidationError) => void
}

function ValidationErrorItem({
  error,
  onFix,
}: ValidationErrorItemProps) {
  // Simple color scheme: red for errors, orange for warnings
  const getErrorColor = () => {
    switch (error.type) {
      case 'error':
        return 'border-red-500/30 bg-red-500/10'
      case 'warning':
        return 'border-orange-500/30 bg-orange-500/10'
      default:
        return 'border-blue-500/30 bg-blue-500/10'
    }
  }
  return (
    <div className={`p-3 rounded border ${getErrorColor()}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{error.message}</p>
          {error.suggestion && (
            <p className="text-xs text-gray-300 mt-1">
              💡 {error.suggestion}
            </p>
          )}
          {error.nodeId && (
            <p className="text-xs text-gray-400 mt-1">
              Node: {error.nodeId}
            </p>
          )}
        </div>
        {onFix && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-6 px-2 bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] hover:text-white"
            onClick={() => onFix(error)}
          >
            Fix
          </Button>
        )}
      </div>
    </div>
  )
}

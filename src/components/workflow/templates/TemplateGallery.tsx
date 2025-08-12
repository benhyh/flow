'use client'

import React, { useState, useMemo } from 'react'
import { Search, Clock, Star, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  workflowTemplates,
  getFeaturedTemplates,
  searchTemplates,
  type WorkflowTemplate,
} from './workflowTemplates'

interface TemplateGalleryProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: WorkflowTemplate) => void
  className?: string
}

const categoryLabels = {
  'email-automation': 'Email Automation',
  'ai-processing': 'AI Processing',
  'task-management': 'Task Management',
  advanced: 'Advanced Workflows',
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
}

export function TemplateGallery({
  isOpen,
  onClose,
  onSelectTemplate,
  className = '',
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    let templates = workflowTemplates

    // Apply search filter
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery)
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(
        template => template.category === selectedCategory
      )
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      templates = templates.filter(
        template => template.difficulty === selectedDifficulty
      )
    }

    return templates
  }, [searchQuery, selectedCategory, selectedDifficulty])

  const featuredTemplates = getFeaturedTemplates()

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedDifficulty('all')
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}
    >
      <div className="bg-[#242424] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Workflow Templates
              </h2>
              <p className="text-white/50">
                Choose a template to get started quickly
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/50 hover:text-white"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50"
              />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#2d2d2d] text-white placeholder-white/50"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#2d2d2d] rounded-md text-white text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-[#2d2d2d] rounded-md text-white text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Clear Filters */}
            {(searchQuery ||
              selectedCategory !== 'all' ||
              selectedDifficulty !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-white/50 hover:text-white whitespace-nowrap"
              >
                <Filter size={16} className="mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto chat-scrollbar smooth-scroll p-6">
          {/* Featured Templates (only show if no filters applied) */}
          {!searchQuery &&
            selectedCategory === 'all' &&
            selectedDifficulty === 'all' && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Star size={20} className="text-yellow-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">
                    Featured Templates
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

          {/* All Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {searchQuery
                  ? `Search Results (${filteredTemplates.length})`
                  : 'All Templates'}
              </h3>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-white/50 mb-2">No templates found</div>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: WorkflowTemplate
  onSelect: (template: WorkflowTemplate) => void
  featured?: boolean
}

function TemplateCard({
  template,
  onSelect,
  featured = false,
}: TemplateCardProps) {
  return (
    <Card className="bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer group">
      <div className="p-4" onClick={() => onSelect(template)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{template.icon}</span>
            <div>
              <h4 className="font-semibold text-white group-hover:text-[#8b5cf6] transition-colors">
                {template.name}
              </h4>
              {featured && (
                <div className="flex items-center mt-1">
                  <Star size={12} className="text-yellow-400 mr-1" />
                  <span className="text-xs text-yellow-400">Featured</span>
                </div>
              )}
            </div>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs ${difficultyColors[template.difficulty]}`}
          >
            {template.difficulty}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white/50 mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            {template.estimatedSetupTime}
          </div>
          <div className="text-white/50">
            {categoryLabels[template.category]}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
              +{template.tags.length - 3}
            </span>
          )}
        </div>

        {/* Node count indicator */}
        <div className="mt-3 pt-3">
          <div className="text-xs text-gray-500">
            {template.nodes.length} nodes • {template.edges.length} connections
          </div>
        </div>
      </div>
    </Card>
  )
}

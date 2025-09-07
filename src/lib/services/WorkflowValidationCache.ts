/**
 * WorkflowValidationCache - Intelligent caching system for workflow validation
 * 
 * Phase 2.3b: Validation Result Caching
 * Source: DATABASE.md Performance Optimizations and Caching
 * 
 * Features:
 * - LRU cache with configurable size
 * - Time-based expiration
 * - Persistent cache across sessions
 * - Cache statistics and monitoring
 * - Integration with Supabase quality scores
 */

import { type Node, type Edge } from '@xyflow/react'
import { type ValidationResult } from '@/components/workflow/utils/workflowValidation'
import { workflowService } from './WorkflowService'

interface CacheEntry {
  result: ValidationResult
  timestamp: number
  accessCount: number
  lastAccessed: number
  hash: string
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  oldestEntry: number
  newestEntry: number
  hitRate: number
}

interface CacheOptions {
  maxSize: number // Maximum number of cached entries
  ttlMs: number // Time-to-live in milliseconds
  persistToLocalStorage: boolean // Persist cache across sessions
  enableStats: boolean // Track cache statistics
}

const DEFAULT_OPTIONS: CacheOptions = {
  maxSize: 100,
  ttlMs: 10 * 60 * 1000, // 10 minutes
  persistToLocalStorage: true,
  enableStats: true
}

export class WorkflowValidationCache {
  private cache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    oldestEntry: Date.now(),
    newestEntry: Date.now(),
    hitRate: 0
  }
  private options: CacheOptions

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    
    // Load cache from localStorage if enabled
    if (this.options.persistToLocalStorage) {
      this.loadFromStorage()
    }
  }

  // ===================
  // Core Cache Operations
  // ===================

  /**
   * Generate deterministic hash for nodes and edges
   */
  private generateHash(nodes: Node[], edges: Edge[]): string {
    // Create a deterministic representation of the workflow structure
    const nodeData = nodes
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: this.sanitizeNodeData(node.data)
      }))

    const edgeData = edges
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))

    const combined = JSON.stringify({ nodes: nodeData, edges: edgeData })
    return this.simpleHash(combined)
  }

  /**
   * Sanitize node data to exclude non-validation-relevant fields
   */
  private sanitizeNodeData(data: any): any {
    if (!data || typeof data !== 'object') return data

    // Remove UI-specific fields that don't affect validation
    const { 
      isSelected, 
      isDragging, 
      position, 
      zIndex, 
      ...validationData 
    } = data

    return validationData
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Get validation result from cache or compute new one
   */
  async get(nodes: Node[], edges: Edge[]): Promise<ValidationResult> {
    const hash = this.generateHash(nodes, edges)
    const entry = this.cache.get(hash)
    
    // Check if entry exists and is not expired
    if (entry && this.isValidEntry(entry)) {
      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = Date.now()
      
      this.stats.hits++
      this.updateHitRate()
      
      return entry.result
    }

    // Cache miss - compute new validation result
    this.stats.misses++
    this.updateHitRate()
    
    const result = await this.computeValidation(nodes, edges)
    
    // Store in cache
    this.set(hash, result)
    
    return result
  }

  /**
   * Store validation result in cache
   */
  private set(hash: string, result: ValidationResult): void {
    const now = Date.now()
    
    // Evict entries if at capacity
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    // Create new cache entry
    const entry: CacheEntry = {
      result,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      hash
    }

    this.cache.set(hash, entry)
    
    // Update statistics
    this.stats.totalSize = this.cache.size
    this.stats.newestEntry = now
    
    // Persist to storage if enabled
    if (this.options.persistToLocalStorage) {
      this.saveToStorage()
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.options.ttlMs
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestEntry: CacheEntry | null = null
    let oldestKey: string | null = null

    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * Compute validation result using the workflow validation function
   */
  private async computeValidation(nodes: Node[], edges: Edge[]): Promise<ValidationResult> {
    // Import validation function dynamically to avoid circular imports
    const { validateWorkflow } = await import('@/components/workflow/utils/workflowValidation')
    return validateWorkflow(nodes, edges)
  }

  // ===================
  // Cache Management
  // ===================

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      oldestEntry: Date.now(),
      newestEntry: Date.now(),
      hitRate: 0
    }
    
    if (this.options.persistToLocalStorage) {
      localStorage.removeItem('workflow-validation-cache')
    }
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.options.ttlMs) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.totalSize = this.cache.size

    if (this.options.persistToLocalStorage) {
      this.saveToStorage()
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateHitRate()
    return { ...this.stats }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  // ===================
  // Persistence
  // ===================

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now()
      }
      
      localStorage.setItem('workflow-validation-cache', JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to save validation cache to localStorage:', error)
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('workflow-validation-cache')
      if (!stored) return

      const cacheData = JSON.parse(stored)
      
      // Check if cache data is recent (within 1 hour)
      if (Date.now() - cacheData.timestamp > 60 * 60 * 1000) {
        localStorage.removeItem('workflow-validation-cache')
        return
      }

      // Restore cache entries
      this.cache = new Map(cacheData.entries)
      this.stats = cacheData.stats || this.stats

      // Cleanup expired entries
      this.cleanup()
    } catch (error) {
      console.warn('Failed to load validation cache from localStorage:', error)
      localStorage.removeItem('workflow-validation-cache')
    }
  }

  // ===================
  // Integration with WorkflowService
  // ===================

  /**
   * Update Supabase workflow with cached validation results
   */
  async syncWithSupabase(workflowId: string, nodes: Node[], edges: Edge[]): Promise<boolean> {
    try {
      const validationResult = await this.get(nodes, edges)
      
      // Update workflow validation in Supabase using WorkflowService
      const result = await workflowService.updateWorkflowValidation(workflowId)
      
      return !!result
    } catch (error) {
      console.error('Failed to sync validation with Supabase:', error)
      return false
    }
  }

  /**
   * Preload validation results for multiple workflows
   */
  async preloadValidations(workflows: Array<{ nodes: Node[]; edges: Edge[] }>): Promise<void> {
    const promises = workflows.map(workflow => this.get(workflow.nodes, workflow.edges))
    
    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to preload validations:', error)
    }
  }

  // ===================
  // Performance Monitoring
  // ===================

  /**
   * Get performance recommendations based on cache statistics
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()

    if (stats.hitRate < 50) {
      recommendations.push('Low cache hit rate detected. Consider increasing cache size or TTL.')
    }

    if (stats.evictions > stats.hits * 0.2) {
      recommendations.push('High eviction rate. Consider increasing cache size.')
    }

    if (stats.totalSize < this.options.maxSize * 0.1) {
      recommendations.push('Cache utilization is low. Consider reducing cache size.')
    }

    return recommendations
  }

  /**
   * Get cache efficiency score (0-100)
   */
  getEfficiencyScore(): number {
    const stats = this.getStats()
    
    // Calculate efficiency based on hit rate and eviction rate
    const hitRateScore = Math.min(stats.hitRate, 100)
    const evictionPenalty = Math.min(stats.evictions / Math.max(stats.hits, 1) * 20, 50)
    
    return Math.max(hitRateScore - evictionPenalty, 0)
  }
}

// ===================
// Export singleton instance
// ===================

export const validationCache = new WorkflowValidationCache({
  maxSize: 50, // Smaller size for MVP
  ttlMs: 5 * 60 * 1000, // 5 minutes for MVP
  persistToLocalStorage: true,
  enableStats: true
})

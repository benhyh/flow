import { supabase } from './supabase-client'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
  metadata?: {
    requestId?: string
    processingTime?: number
    retryCount?: number
  }
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: unknown
}

// =============================================================================
// CORE API CLIENT CLASS
// =============================================================================

export class ApiClient {
  // ---------------------------------------------------------------------------
  // SUPABASE OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Execute Supabase database operation with error handling
   */
  static async supabaseQuery<T = unknown>(
    operation: () => Promise<{ data: T | null; error: unknown }>
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()

    try {
      const { data, error } = await operation()
      
      if (error) {
        return {
          success: false,
          error: (error as { message?: string })?.message || 'Database operation failed',
          metadata: {
            requestId,
            processingTime: Date.now() - startTime,
            retryCount: 0
          }
        }
      }

      return {
        success: true,
        data: data as T,
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      }
    }
  }

  /**
   * Execute Supabase auth operation
   */
  static async supabaseAuth<T = unknown>(
    operation: () => Promise<{ data: T; error: unknown }>
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()

    try {
      const { data, error } = await operation()
      
      if (error) {
        return {
          success: false,
          error: (error as { message?: string })?.message || 'Auth operation failed',
          metadata: {
            requestId,
            processingTime: Date.now() - startTime,
            retryCount: 0
          }
        }
      }

      return {
        success: true,
        data: data as T,
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown auth error',
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      }
    }
  }

  /**
   * Upload file to Supabase storage
   */
  static async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options: { upsert?: boolean } = {}
  ): Promise<ApiResponse<{ path: string; publicUrl?: string }>> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, options)

      if (error) {
        return {
          success: false,
          error: (error as { message?: string })?.message || 'File upload failed',
          metadata: {
            requestId,
            processingTime: Date.now() - startTime,
            retryCount: 0
          }
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return {
        success: true,
        data: {
          path: data.path,
          publicUrl: urlData.publicUrl
        },
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          retryCount: 0
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ---------------------------------------------------------------------------
  // ERROR HANDLING UTILITIES
  // ---------------------------------------------------------------------------

  /**
   * Handle errors with user-friendly messages
   */
  static handleError(error: ApiResponse<unknown>): string {
    if (!error.error) return 'An unknown error occurred'

    // Map common error patterns to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Failed to fetch': 'Network connection error. Please check your internet connection.',
      'Network error': 'Network connection error. Please try again.',
      'timeout': 'Request timed out. Please try again.',
      'Unauthorized': 'You are not authorized to perform this action.',
      'Forbidden': 'Access denied. You do not have permission.',
      'Not Found': 'The requested resource was not found.',
      'Internal Server Error': 'Server error. Please try again later.',
      'Bad Gateway': 'Service temporarily unavailable. Please try again.',
      'Service Unavailable': 'Service temporarily unavailable. Please try again.',
    }

    // Check for exact matches
    if (errorMappings[error.error]) {
      return errorMappings[error.error]
    }

    // Check for partial matches
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (error.error.toLowerCase().includes(pattern.toLowerCase())) {
        return message
      }
    }

    return error.error
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: ApiResponse<unknown>): boolean {
    if (!error.statusCode) return true // Network errors are retryable
    return error.statusCode >= 500 || error.statusCode === 408
  }
}

export default ApiClient
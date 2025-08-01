import { Context } from 'hono'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, true)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true)
  }
}

export class RateLimitError extends AppError {
  constructor(resetTime?: Date) {
    super('Rate limit exceeded', 429, true, { resetTime })
  }
}

export class GitHubAPIError extends AppError {
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(`GitHub API Error: ${message}`, statusCode, true, details)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(`Database Error: ${message}`, 500, true, details)
  }
}

// Error response formatter
export function formatErrorResponse(error: Error, c: Context) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (error instanceof AppError) {
    return c.json({
      error: error.message,
      ...(error.details && { details: error.details }),
      ...(isDevelopment && { stack: error.stack })
    }, error.statusCode)
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return c.json({
      error: 'Validation failed',
      details: (error as any).errors
    }, 400)
  }

  // Handle GitHub API errors
  if (error.message.includes('GitHub API')) {
    return c.json({
      error: 'GitHub API error',
      message: error.message,
      ...(isDevelopment && { stack: error.stack })
    }, 502)
  }

  // Generic error
  console.error('Unhandled error:', error)
  return c.json({
    error: 'Internal server error',
    ...(isDevelopment && { 
      message: error.message,
      stack: error.stack 
    })
  }, 500)
}

// Async error handler wrapper
export function asyncHandler(fn: Function) {
  return async (c: Context, next?: any) => {
    try {
      return await fn(c, next)
    } catch (error) {
      return formatErrorResponse(error as Error, c)
    }
  }
}

// Success response formatter
export function successResponse(c: Context, data: any, statusCode: number = 200) {
  return c.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, statusCode)
}

// Paginated response formatter
export function paginatedResponse(
  c: Context, 
  data: any[], 
  total: number, 
  limit: number, 
  offset: number
) {
  return c.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + limit < total
    },
    timestamp: new Date().toISOString()
  })
}

// Validation helpers
export function validatePositiveInteger(value: string, fieldName: string): number {
  const parsed = parseInt(value)
  if (isNaN(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`)
  }
  return parsed
}

export function validateDateRange(days: number): void {
  if (days < 1 || days > 365) {
    throw new ValidationError('Days must be between 1 and 365')
  }
}

export function validatePaginationParams(limit?: string, offset?: string): { limit: number; offset: number } {
  const parsedLimit = limit ? parseInt(limit) : 50
  const parsedOffset = offset ? parseInt(offset) : 0

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new ValidationError('Limit must be between 1 and 100')
  }

  if (isNaN(parsedOffset) || parsedOffset < 0) {
    throw new ValidationError('Offset must be non-negative')
  }

  return { limit: parsedLimit, offset: parsedOffset }
}

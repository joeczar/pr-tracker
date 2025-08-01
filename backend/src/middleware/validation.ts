import { Context, Next } from 'hono'
import { z } from 'zod'

// Common validation schemas
export const schemas = {
  repositoryId: z.number().int().positive(),
  pullRequestId: z.number().int().positive(),
  reviewId: z.number().int().positive(),
  pagination: z.object({
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0)
  }),
  dateRange: z.object({
    days: z.number().int().min(1).max(365).optional().default(30)
  }),
  addRepository: z.object({
    owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\-_.]+$/),
    name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\-_.]+$/)
  }),
  syncRequest: z.object({
    type: z.enum(['full', 'incremental']).optional().default('incremental')
  }),
  compareRepositories: z.object({
    repository_ids: z.array(z.number().int().positive()).min(1).max(10),
    days: z.number().int().min(1).max(365).optional().default(30)
  })
}

// Validation middleware factory
export function validateParam(paramName: string, schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const value = c.req.param(paramName)
      
      // Convert string to number for numeric schemas
      let parsedValue: any = value
      if (schema instanceof z.ZodNumber) {
        parsedValue = parseInt(value)
        if (isNaN(parsedValue)) {
          return c.json({ 
            error: 'Validation failed',
            details: `Invalid ${paramName}: must be a number`
          }, 400)
        }
      }
      
      const result = schema.safeParse(parsedValue)
      if (!result.success) {
        return c.json({ 
          error: 'Validation failed',
          details: result.error.errors.map(e => `${paramName}: ${e.message}`)
        }, 400)
      }
      
      // Store validated value in context
      c.set(`validated_${paramName}`, result.data)
      await next()
    } catch (error) {
      return c.json({ 
        error: 'Validation error',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      }, 400)
    }
  }
}

export function validateQuery(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query()
      
      // Convert string values to appropriate types
      const parsedQuery: any = {}
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue
        
        // Try to parse as number if it looks like one
        if (/^\d+$/.test(value)) {
          parsedQuery[key] = parseInt(value)
        } else if (value === 'true' || value === 'false') {
          parsedQuery[key] = value === 'true'
        } else {
          parsedQuery[key] = value
        }
      }
      
      const result = schema.safeParse(parsedQuery)
      if (!result.success) {
        return c.json({ 
          error: 'Invalid query parameters',
          details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }, 400)
      }
      
      c.set('validated_query', result.data)
      await next()
    } catch (error) {
      return c.json({ 
        error: 'Query validation error',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      }, 400)
    }
  }
}

export function validateBody(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json().catch(() => ({}))
      
      const result = schema.safeParse(body)
      if (!result.success) {
        return c.json({ 
          error: 'Invalid request body',
          details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }, 400)
      }
      
      c.set('validated_body', result.data)
      await next()
    } catch (error) {
      return c.json({ 
        error: 'Body validation error',
        message: error instanceof Error ? error.message : 'Unknown validation error'
      }, 400)
    }
  }
}

// Helper function to get validated data from context
export function getValidated<T>(c: Context, key: string): T {
  return c.get(key) as T
}

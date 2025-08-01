import { Hono } from 'hono'
import { AnalyticsService } from '../services/analytics.js'
import { z } from 'zod'

const analyticsRoutes = new Hono()

// Get trend analysis for a repository
analyticsRoutes.get('/repository/:repositoryId/trends', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const days = parseInt(c.req.query('days') || '30')
    if (days < 1 || days > 365) {
      return c.json({ error: 'Days must be between 1 and 365' }, 400)
    }
    
    const analyticsService = new AnalyticsService()
    const trends = await analyticsService.getTrendAnalysis(repositoryId, days)
    
    return c.json(trends)
  } catch (error) {
    console.error('Failed to fetch trend analysis:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch trend analysis'
    }, 500)
  }
})

// Compare multiple repositories
analyticsRoutes.post('/compare', async (c) => {
  try {
    const compareSchema = z.object({
      repository_ids: z.array(z.number()).min(1).max(10),
      days: z.number().min(1).max(365).optional().default(30)
    })
    
    const body = await c.req.json()
    const { repository_ids, days } = compareSchema.parse(body)
    
    const analyticsService = new AnalyticsService()
    const comparison = await analyticsService.getRepositoryComparison(repository_ids, days)
    
    return c.json(comparison)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Invalid request data',
        details: error.errors
      }, 400)
    }
    
    console.error('Failed to compare repositories:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to compare repositories'
    }, 500)
  }
})

export { analyticsRoutes }

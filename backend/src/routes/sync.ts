import { Hono } from 'hono'
import { SyncService } from '../services/sync.js'

const syncRoutes = new Hono()

// Global sync service instance
let syncService: SyncService | null = null

function getSyncService(): SyncService {
  if (!syncService) {
    syncService = new SyncService()
  }
  return syncService
}

// Queue a sync job for a repository
syncRoutes.post('/repository/:repositoryId', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const body = await c.req.json().catch(() => ({}))
    const type = body.type === 'full' ? 'full' : 'incremental'
    
    const service = getSyncService()
    const jobId = await service.queueSync(repositoryId, type)
    
    return c.json({ 
      success: true, 
      job_id: jobId,
      message: `${type} sync queued for repository ${repositoryId}`
    })
  } catch (error) {
    console.error('Failed to queue sync:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to queue sync'
    }, 500)
  }
})

// Get sync job status
syncRoutes.get('/job/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId')
    
    const service = getSyncService()
    const job = await service.getSyncStatus(jobId)
    
    if (!job) {
      return c.json({ error: 'Sync job not found' }, 404)
    }
    
    return c.json(job)
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to get sync status'
    }, 500)
  }
})

// Get sync history for a repository
syncRoutes.get('/repository/:repositoryId/history', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const limit = parseInt(c.req.query('limit') || '10')
    if (limit < 1 || limit > 100) {
      return c.json({ error: 'Limit must be between 1 and 100' }, 400)
    }
    
    const service = getSyncService()
    const history = await service.getRepositorySyncHistory(repositoryId, limit)
    
    return c.json(history)
  } catch (error) {
    console.error('Failed to get sync history:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to get sync history'
    }, 500)
  }
})

// Get rate limit status
syncRoutes.get('/rate-limit', async (c) => {
  try {
    const service = getSyncService()
    const rateLimitStatus = service.getRateLimitStatus()
    
    return c.json(rateLimitStatus)
  } catch (error) {
    console.error('Failed to get rate limit status:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to get rate limit status'
    }, 500)
  }
})

// Start periodic sync (admin endpoint)
syncRoutes.post('/periodic/start', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const intervalMinutes = body.interval_minutes || 60
    
    if (intervalMinutes < 5 || intervalMinutes > 1440) {
      return c.json({ error: 'Interval must be between 5 and 1440 minutes' }, 400)
    }
    
    const service = getSyncService()
    await service.startPeriodicSync(intervalMinutes)
    
    return c.json({ 
      success: true, 
      message: `Periodic sync started with ${intervalMinutes} minute interval`
    })
  } catch (error) {
    console.error('Failed to start periodic sync:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to start periodic sync'
    }, 500)
  }
})

export { syncRoutes }

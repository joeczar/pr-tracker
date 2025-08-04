import { Hono } from 'hono'
import { PullRequestService } from '../services/pull-request.js'
import { requireAuth, getUser } from '../middleware/auth.js'

const pullRequestRoutes = new Hono()

// Get pull requests for a repository
pullRequestRoutes.get('/repository/:repositoryId', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    const state = c.req.query('state') as 'open' | 'closed' | 'merged' | undefined
    
    const pullRequestService = new PullRequestService()
    const pullRequests = await pullRequestService.getPullRequestsByRepository(
      repositoryId, 
      { limit, offset, state }
    )
    
    return c.json(pullRequests)
  } catch (error) {
    console.error('Failed to fetch pull requests:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch pull requests'
    }, 500)
  }
})

// Get pull request metrics
pullRequestRoutes.get('/repository/:repositoryId/metrics', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const days = parseInt(c.req.query('days') || '30')
    
    const pullRequestService = new PullRequestService()
    const metrics = await pullRequestService.getRepositoryMetrics(repositoryId, days)
    
    return c.json(metrics)
  } catch (error) {
    console.error('Failed to fetch PR metrics:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch PR metrics'
    }, 500)
  }
})

// Get pull request by ID
pullRequestRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid pull request ID' }, 400)
    }
    
    const pullRequestService = new PullRequestService()
    const pullRequest = await pullRequestService.getPullRequestById(id)
    
    if (!pullRequest) {
      return c.json({ error: 'Pull request not found' }, 404)
    }
    
    return c.json(pullRequest)
  } catch (error) {
    console.error('Failed to fetch pull request:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch pull request'
    }, 500)
  }
})

// Sync pull requests for a repository
pullRequestRoutes.post('/repository/:repositoryId/sync', requireAuth, async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }

    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const pullRequestService = PullRequestService.forUser(user)
    const result = await pullRequestService.syncPullRequests(repositoryId)

    return c.json(result)
  } catch (error) {
    console.error('Failed to sync pull requests:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to sync pull requests'
    }, 500)
  }
})

// Get pull request statistics summary
pullRequestRoutes.get('/repository/:repositoryId/stats', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }

    const pullRequestService = new PullRequestService()
    const [totalPRs, openPRs, mergedPRs, closedPRs] = await Promise.all([
      pullRequestService.getPullRequestsByRepository(repositoryId, {}),
      pullRequestService.getPullRequestsByRepository(repositoryId, { state: 'open' }),
      pullRequestService.getPullRequestsByRepository(repositoryId, { state: 'merged' }),
      pullRequestService.getPullRequestsByRepository(repositoryId, { state: 'closed' })
    ])

    return c.json({
      total: totalPRs.length,
      open: openPRs.length,
      merged: mergedPRs.length,
      closed: closedPRs.length,
      merge_rate: totalPRs.length > 0 ? (mergedPRs.length / totalPRs.length) * 100 : 0
    })
  } catch (error) {
    console.error('Failed to fetch PR statistics:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch PR statistics'
    }, 500)
  }
})

export { pullRequestRoutes }

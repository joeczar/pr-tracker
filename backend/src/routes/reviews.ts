import { Hono } from 'hono'
import { ReviewService } from '../services/review.js'

const reviewRoutes = new Hono()

// Get reviews for a pull request
reviewRoutes.get('/pull-request/:pullRequestId', async (c) => {
  try {
    const pullRequestId = parseInt(c.req.param('pullRequestId'))
    if (isNaN(pullRequestId)) {
      return c.json({ error: 'Invalid pull request ID' }, 400)
    }
    
    const reviewService = new ReviewService()
    const reviews = await reviewService.getReviewsByPullRequest(pullRequestId)
    
    return c.json(reviews)
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch reviews'
    }, 500)
  }
})

// Get review metrics for a repository
reviewRoutes.get('/repository/:repositoryId/metrics', async (c) => {
  try {
    const repositoryId = parseInt(c.req.param('repositoryId'))
    if (isNaN(repositoryId)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const days = parseInt(c.req.query('days') || '30')
    
    const reviewService = new ReviewService()
    const metrics = await reviewService.getReviewMetrics(repositoryId, days)
    
    return c.json(metrics)
  } catch (error) {
    console.error('Failed to fetch review metrics:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch review metrics'
    }, 500)
  }
})

// Get review by ID
reviewRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid review ID' }, 400)
    }
    
    const reviewService = new ReviewService()
    const review = await reviewService.getReviewById(id)
    
    if (!review) {
      return c.json({ error: 'Review not found' }, 404)
    }
    
    return c.json(review)
  } catch (error) {
    console.error('Failed to fetch review:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch review'
    }, 500)
  }
})

// Sync reviews for a pull request
reviewRoutes.post('/pull-request/:pullRequestId/sync', async (c) => {
  try {
    const pullRequestId = parseInt(c.req.param('pullRequestId'))
    if (isNaN(pullRequestId)) {
      return c.json({ error: 'Invalid pull request ID' }, 400)
    }
    
    const reviewService = new ReviewService()
    const result = await reviewService.syncReviewsForPullRequest(pullRequestId)
    
    return c.json(result)
  } catch (error) {
    console.error('Failed to sync reviews:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync reviews'
    }, 500)
  }
})

export { reviewRoutes }

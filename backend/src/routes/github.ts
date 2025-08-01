import { Hono } from 'hono'
import { GitHubService } from '../services/github.js'

const githubRoutes = new Hono()

// Test GitHub connection
githubRoutes.get('/test', async (c) => {
  try {
    const githubService = new GitHubService()
    const user = await githubService.getCurrentUser()
    return c.json({ 
      success: true, 
      user: {
        login: user.login,
        name: user.name,
        id: user.id
      }
    })
  } catch (error) {
    console.error('GitHub test failed:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get repository information
githubRoutes.get('/repos/:owner/:repo', async (c) => {
  try {
    const { owner, repo } = c.req.param()
    const githubService = new GitHubService()
    const repository = await githubService.getRepository(owner, repo)
    return c.json(repository)
  } catch (error) {
    console.error('Failed to fetch repository:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch repository'
    }, 500)
  }
})

// Get pull requests for a repository
githubRoutes.get('/repos/:owner/:repo/pulls', async (c) => {
  try {
    const { owner, repo } = c.req.param()
    const state = c.req.query('state') || 'all'
    const page = parseInt(c.req.query('page') || '1')
    const per_page = parseInt(c.req.query('per_page') || '30')
    
    const githubService = new GitHubService()
    const pullRequests = await githubService.getPullRequests(owner, repo, {
      state: state as 'open' | 'closed' | 'all',
      page,
      per_page
    })
    
    return c.json(pullRequests)
  } catch (error) {
    console.error('Failed to fetch pull requests:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch pull requests'
    }, 500)
  }
})

export { githubRoutes }

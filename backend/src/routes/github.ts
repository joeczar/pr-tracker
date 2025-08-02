import { Hono } from 'hono'
import { GitHubService } from '../services/github.js'
import { requireAuth, getUser } from '../middleware/auth.js'

const githubRoutes = new Hono()

// Test GitHub connection
githubRoutes.get('/test', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
    const githubUser = await githubService.getCurrentUser()
    return c.json({
      success: true,
      user: {
        login: githubUser.login,
        name: githubUser.name,
        id: githubUser.id
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
githubRoutes.get('/repos/:owner/:repo', requireAuth, async (c) => {
  try {
    const { owner, repo } = c.req.param()
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
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
githubRoutes.get('/repos/:owner/:repo/pulls', requireAuth, async (c) => {
  try {
    const { owner, repo } = c.req.param()
    const state = c.req.query('state') || 'all'
    const page = parseInt(c.req.query('page') || '1')
    const per_page = parseInt(c.req.query('per_page') || '30')

    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
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

// Get detailed pull request information
githubRoutes.get('/repos/:owner/:repo/pulls/:pull_number', requireAuth, async (c) => {
  try {
    const { owner, repo, pull_number } = c.req.param()
    const pullNumber = parseInt(pull_number)

    if (isNaN(pullNumber)) {
      return c.json({ error: 'Invalid pull request number' }, 400)
    }

    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
    const prDetails = await githubService.getPullRequestDetails(owner, repo, pullNumber)

    return c.json(prDetails)
  } catch (error) {
    console.error('Failed to fetch pull request details:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch pull request details'
    }, 500)
  }
})

// Get pull request files
githubRoutes.get('/repos/:owner/:repo/pulls/:pull_number/files', requireAuth, async (c) => {
  try {
    const { owner, repo, pull_number } = c.req.param()
    const pullNumber = parseInt(pull_number)

    if (isNaN(pullNumber)) {
      return c.json({ error: 'Invalid pull request number' }, 400)
    }

    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
    const files = await githubService.getPullRequestFiles(owner, repo, pullNumber)

    return c.json(files)
  } catch (error) {
    console.error('Failed to fetch pull request files:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch pull request files'
    }, 500)
  }
})

// Get rate limit information
githubRoutes.get('/rate-limit', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
    const rateLimit = await githubService.getRateLimit()

    return c.json(rateLimit)
  } catch (error) {
    console.error('Failed to fetch rate limit:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch rate limit'
    }, 500)
  }
})

// Get all accessible repositories for the authenticated user
githubRoutes.get('/repositories', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    // Parse query parameters
    const page = parseInt(c.req.query('page') || '1')
    const per_page = parseInt(c.req.query('per_page') || '100')
    const sort = c.req.query('sort') as 'created' | 'updated' | 'pushed' | 'full_name' || 'updated'
    const direction = c.req.query('direction') as 'asc' | 'desc' || 'desc'
    const affiliation = c.req.query('affiliation') || 'owner,collaborator,organization_member'
    const visibility = c.req.query('visibility') as 'all' | 'public' | 'private' || 'all'

    const githubService = GitHubService.forUser(user)
    const result = await githubService.getUserAccessibleRepositories({
      page,
      per_page,
      sort,
      direction,
      affiliation,
      visibility
    })

    return c.json({
      repositories: result.repositories,
      pagination: {
        page,
        per_page,
        total_count: result.total_count,
        has_next_page: result.has_next_page
      }
    })
  } catch (error) {
    console.error('Failed to fetch accessible repositories:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch repositories'
    }, 500)
  }
})

export { githubRoutes }

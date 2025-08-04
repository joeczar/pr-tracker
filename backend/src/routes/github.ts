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

/**
 * Organizations
 */
githubRoutes.get('/organizations', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) return c.json({ error: 'User not found' }, 401)

    const githubService = GitHubService.forUser(user)
    
    // Debug: Try the API call directly and log details
    console.log('🔍 Fetching organizations for user:', user.login)
    
    try {
      console.log('🔍 Fetching organizations for user:', user.login)

      const orgs = await githubService.getUserOrganizations()

      console.log('✅ Organizations fetched successfully')
      console.log('📊 Organizations count:', orgs.length)
      console.log('🏢 Organization names:', orgs.map(org => org.login))

      return c.json({
        organizations: orgs,
        debug: {
          count: orgs.length,
          organizations: orgs.map(org => org.login)
        }
      })
    } catch (apiError: any) {
      console.error('❌ GitHub API error:', apiError.status, apiError.message)
      console.error('📝 Full error:', apiError)
      
      return c.json({
        organizations: [],
        error: `GitHub API error: ${apiError.status} - ${apiError.message}`,
        debug: {
          status: apiError.status,
          message: apiError.message
        }
      }, apiError.status || 500)
    }
  } catch (error) {
    console.error('Failed to fetch organizations:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch organizations'
    }, 500)
  }
})

githubRoutes.get('/orgs/:org/repos', requireAuth, async (c) => {
  try {
    const { org } = c.req.param()
    const page = parseInt(c.req.query('page') || '1')
    const per_page = parseInt(c.req.query('per_page') || '100')
    const sort = (c.req.query('sort') as 'created' | 'updated' | 'pushed' | 'full_name') || 'updated'
    const direction = (c.req.query('direction') as 'asc' | 'desc') || 'desc'
    const type = (c.req.query('type') as 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member') || 'all'

    const user = getUser(c)
    if (!user) return c.json({ error: 'User not found' }, 401)

    const githubService = GitHubService.forUser(user)
    const repositories = await githubService.getOrganizationRepositories(org, {
      page,
      per_page,
      sort,
      direction,
      type,
    })

    return c.json({
      repositories,
      pagination: {
        page,
        per_page,
        has_next_page: repositories.length === per_page
      }
    })
  } catch (error) {
    console.error('Failed to fetch organization repositories:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to fetch organization repositories'
    }, 500)
  }
})

// Debug: Check current OAuth scopes
githubRoutes.get('/debug/token-info', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
    
    // Make a request to GitHub to see what scopes we actually have
    const response = await githubService.octokit.request('GET /user')
    const scopes = response.headers['x-oauth-scopes']?.split(', ') || []
    
    return c.json({
      user_login: response.data.login,
      granted_scopes: scopes,
      has_read_org: scopes.includes('read:org'),
      has_repo: scopes.includes('repo'),
      token_created: user.created_at,
      raw_scopes_header: response.headers['x-oauth-scopes']
    })
  } catch (error) {
    console.error('Failed to get token info:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to get token info'
    }, 500)
  }
})

// Debug: Test direct GitHub orgs API call
githubRoutes.get('/debug/orgs-raw', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) {
      return c.json({ error: 'User not found' }, 401)
    }

    const githubService = GitHubService.forUser(user)
    
    console.log('🔍 Making direct GitHub API call for organizations...')
    
    // Try different organization endpoints
    const endpoints = [
      { name: 'listForAuthenticatedUser', call: () => githubService.octokit.rest.orgs.listForAuthenticatedUser() },
      { name: 'direct /user/orgs', call: () => githubService.octokit.request('GET /user/orgs') },
      { name: 'direct /user/orgs with per_page', call: () => githubService.octokit.request('GET /user/orgs', { per_page: 100 }) }
    ]
    
    const results = {}
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing endpoint: ${endpoint.name}`)
        const response = await endpoint.call()
        console.log(`✅ ${endpoint.name} - Status: ${response.status}, Count: ${response.data.length}`)
        console.log(`📊 ${endpoint.name} - Data:`, response.data.map((org: any) => ({ login: org.login, id: org.id })))
        console.log(`🔐 ${endpoint.name} - Headers:`, {
          scopes: response.headers['x-oauth-scopes'],
          rateLimit: response.headers['x-ratelimit-remaining']
        })
        
        results[endpoint.name] = {
          status: response.status,
          count: response.data.length,
          organizations: response.data.map((org: any) => ({ login: org.login, id: org.id, avatar_url: org.avatar_url })),
          headers: {
            scopes: response.headers['x-oauth-scopes'],
            rateLimit: response.headers['x-ratelimit-remaining']
          }
        }
      } catch (error: any) {
        console.error(`❌ ${endpoint.name} failed:`, error.status, error.message)
        results[endpoint.name] = {
          error: error.message,
          status: error.status
        }
      }
    }
    
    return c.json({
      message: 'Direct GitHub API test results',
      user_login: user.login,
      results
    })
  } catch (error) {
    console.error('Failed to test GitHub orgs API:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Failed to test GitHub API'
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

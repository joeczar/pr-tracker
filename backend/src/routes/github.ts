import { Hono } from 'hono'
import { GitHubService } from '../services/github.js'
import { requireAuth, getUser } from '../middleware/auth.js'
import { EncryptionService } from '../utils/encryption.js'
import { UserService } from '../services/user.js'

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
    const response = await githubService.getOctokit().request('GET /user')
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
    const octokit = githubService.getOctokit()
    const endpoints = [
      { name: 'listForAuthenticatedUser', call: () => octokit.rest.orgs.listForAuthenticatedUser() },
      { name: 'direct /user/orgs', call: () => octokit.request('GET /user/orgs') },
      { name: 'direct /user/orgs with per_page', call: () => octokit.request('GET /user/orgs', { per_page: 100 }) },
      { name: 'memberships-active', call: () => octokit.request('GET /user/memberships/orgs', { state: 'active', per_page: 100 }) },
      { name: 'memberships-all', call: () => octokit.request('GET /user/memberships/orgs', { per_page: 100 }) }
    ]
    
    const results: Record<string, any> = {}
    
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

/**
 * Personal Access Token (PAT) Management
 */

// Store PAT for enhanced GitHub access
githubRoutes.post('/pat/store', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) return c.json({ error: 'User not found' }, 401)

    const body = await c.req.json()
    const { pat } = body

    if (!pat || typeof pat !== 'string' || !pat.startsWith('ghp_')) {
      return c.json({ 
        error: 'Invalid PAT format. Personal Access Tokens should start with "ghp_"' 
      }, 400)
    }

    // Test the PAT first
    try {
      const testService = GitHubService.withToken(pat)
      await testService.getCurrentUser()
    } catch (error) {
      return c.json({ 
        error: 'Invalid PAT - unable to authenticate with GitHub',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400)
    }

    // Encrypt and store the PAT
    const encryptedPAT = EncryptionService.encrypt(pat)
    const userService = new UserService()
    
    await userService.updateUserPAT(user.id, encryptedPAT)

    return c.json({ 
      success: true,
      message: 'Personal Access Token stored successfully'
    })
  } catch (error) {
    console.error('Failed to store PAT:', error)
    return c.json({
      error: 'Failed to store Personal Access Token',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

 // Validate stored PAT
githubRoutes.get('/pat/validate', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) return c.json({ error: 'User not found' }, 401)

    const userService = new UserService()

    if (!user.github_pat_encrypted) {
      // Persist invalid state as no token
      try {
        await userService.updatePatValidation(user.id, 'invalid', new Date())
      } catch (e) {
        console.warn('Failed to persist PAT invalid status (no token):', e)
      }
      return c.json({ 
        valid: false,
        status: 'invalid',
        validated_at: new Date().toISOString(),
        message: 'No Personal Access Token stored'
      })
    }

    try {
      // Decrypt and test the PAT
      const pat = EncryptionService.decrypt(user.github_pat_encrypted)
      const testService = GitHubService.withToken(pat)
      const githubUser = await testService.getCurrentUser()

      const now = new Date()
      try {
        await userService.updatePatValidation(user.id, 'valid', now)
      } catch (e) {
        console.warn('Failed to persist PAT valid status:', e)
      }

      return c.json({ 
        valid: true,
        status: 'valid',
        validated_at: now.toISOString(),
        pat_user: {
          login: githubUser.login,
          id: githubUser.id,
          name: githubUser.name
        }
      })
    } catch (error) {
      const now = new Date()
      try {
        await userService.updatePatValidation(user.id, 'invalid', now)
      } catch (e) {
        console.warn('Failed to persist PAT invalid status:', e)
      }

      return c.json({ 
        valid: false,
        status: 'invalid',
        validated_at: now.toISOString(),
        message: 'Stored PAT is invalid or expired',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('Failed to validate PAT:', error)
    return c.json({
      error: 'Failed to validate Personal Access Token',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Remove stored PAT
githubRoutes.delete('/pat/remove', requireAuth, async (c) => {
  try {
    const user = getUser(c)
    if (!user) return c.json({ error: 'User not found' }, 401)

    const userService = new UserService()
    await userService.updateUserPAT(user.id, null)

    return c.json({ 
      success: true,
      message: 'Personal Access Token removed successfully'
    })
  } catch (error) {
    console.error('Failed to remove PAT:', error)
    return c.json({
      error: 'Failed to remove Personal Access Token',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { githubRoutes }

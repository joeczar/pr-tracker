import { Hono } from 'hono'
import { GitHubAppService } from '../services/github-app.js'

const githubAppRoutes = new Hono()

// Test GitHub App authentication
githubAppRoutes.get('/test', async (c) => {
  try {
    const githubAppService = new GitHubAppService()
    
    // Get all installations
    const installations = await githubAppService.getInstallations()
    
    return c.json({
      success: true,
      app_id: process.env.GITHUB_APP_ID,
      installations: installations.map(installation => ({
        id: installation.id,
        account: {
          login: installation.account.login,
          type: installation.account.type,
        },
        repository_selection: installation.repository_selection,
        created_at: installation.created_at,
        updated_at: installation.updated_at,
      }))
    })
  } catch (error) {
    console.error('GitHub App test failed:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get installation repositories
githubAppRoutes.get('/installations/:installationId/repositories', async (c) => {
  try {
    const installationId = parseInt(c.req.param('installationId'))
    if (isNaN(installationId)) {
      return c.json({ error: 'Invalid installation ID' }, 400)
    }

    const githubAppService = new GitHubAppService()
    const repositories = await githubAppService.getInstallationRepositories(installationId)
    
    return c.json({
      success: true,
      installation_id: installationId,
      repositories: repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          type: repo.owner.type,
        },
        permissions: repo.permissions,
      }))
    })
  } catch (error) {
    console.error('Failed to get installation repositories:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { githubAppRoutes }

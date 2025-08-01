import { Hono } from 'hono'
import { RepositoryService } from '../services/repository.js'
import { z } from 'zod'

const repositoryRoutes = new Hono()

const addRepositorySchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1)
})

// Get all tracked repositories
repositoryRoutes.get('/', async (c) => {
  try {
    const repositoryService = new RepositoryService()
    const repositories = await repositoryService.getAllRepositories()
    return c.json(repositories)
  } catch (error) {
    console.error('Failed to fetch repositories:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch repositories'
    }, 500)
  }
})

// Add a repository to track
repositoryRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { owner, name } = addRepositorySchema.parse(body)
    
    const repositoryService = new RepositoryService()
    const repository = await repositoryService.addRepository(owner, name)
    
    return c.json(repository, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Invalid request data',
        details: error.errors
      }, 400)
    }
    
    console.error('Failed to add repository:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to add repository'
    }, 500)
  }
})

// Get repository by ID
repositoryRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const repositoryService = new RepositoryService()
    const repository = await repositoryService.getRepositoryById(id)
    
    if (!repository) {
      return c.json({ error: 'Repository not found' }, 404)
    }
    
    return c.json(repository)
  } catch (error) {
    console.error('Failed to fetch repository:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch repository'
    }, 500)
  }
})

// Delete repository
repositoryRoutes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid repository ID' }, 400)
    }
    
    const repositoryService = new RepositoryService()
    await repositoryService.deleteRepository(id)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete repository:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete repository'
    }, 500)
  }
})

export { repositoryRoutes }

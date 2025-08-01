import { test, expect, describe, beforeEach, mock } from 'bun:test'
import '../setup' // Import setup to set environment variables
import { RepositoryService } from '../../src/services/repository'
import { GitHubService } from '../../src/services/github'
import { DatabaseManager } from '../../src/db/database'

// Setup test database
const dbManager = DatabaseManager.getInstance()
dbManager.runMigrations()

// Mock GitHubService
const mockGetRepository = mock()

describe('RepositoryService', () => {
  let repositoryService: RepositoryService

  beforeEach(() => {
    // Clear database
    const db = dbManager.getDatabase()
    db.exec('DELETE FROM reviews')
    db.exec('DELETE FROM pull_requests')
    db.exec('DELETE FROM repositories')

    repositoryService = new RepositoryService()
    // Replace the GitHub service with our mock
    ;(repositoryService as any).githubService = {
      getRepository: mockGetRepository
    }
    mockGetRepository.mockClear()
  })

  test('should add a new repository successfully', async () => {
    const mockGitHubRepo = {
      id: 123456,
      name: 'test-repo',
      full_name: 'testuser/test-repo',
      owner: { login: 'testuser' }
    }

    mockGetRepository.mockResolvedValue(mockGitHubRepo)

    const result = await repositoryService.addRepository('testuser', 'test-repo')

    expect(result.github_id).toBe(123456)
    expect(result.name).toBe('test-repo')
    expect(result.full_name).toBe('testuser/test-repo')
    expect(mockGetRepository).toHaveBeenCalledWith('testuser', 'test-repo')
  })

  test('should prevent duplicate repositories', async () => {
    const mockGitHubRepo = {
      id: 123456,
      name: 'test-repo',
      full_name: 'testuser/test-repo'
    }

    mockGetRepository.mockResolvedValue(mockGitHubRepo)

    await repositoryService.addRepository('testuser', 'test-repo')

    try {
      await repositoryService.addRepository('testuser', 'test-repo')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Repository testuser/test-repo is already being tracked')
    }
  })

  test('should retrieve and delete repositories', async () => {
    const mockGitHubRepo = {
      id: 123456,
      name: 'test-repo',
      full_name: 'testuser/test-repo'
    }

    mockGetRepository.mockResolvedValue(mockGitHubRepo)
    const addedRepo = await repositoryService.addRepository('testuser', 'test-repo')

    // Should retrieve successfully
    const retrieved = await repositoryService.getRepositoryById(addedRepo.id)
    expect(retrieved?.id).toBe(addedRepo.id)

    // Should delete successfully
    await repositoryService.deleteRepository(addedRepo.id)
    const afterDelete = await repositoryService.getRepositoryById(addedRepo.id)
    expect(afterDelete).toBeNull()
  })
})

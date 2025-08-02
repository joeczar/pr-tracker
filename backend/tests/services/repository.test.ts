import { test, expect, describe, beforeEach, mock } from 'bun:test'
import '../setup' // Import setup to set environment variables
import { RepositoryService } from '../../src/services/repository'
import { GitHubService } from '../../src/services/github'
import { DatabaseManager } from '../../src/db/database'
import { UserService } from '../../src/services/user'
import { User } from '../../src/types/auth'

// Setup test database
const dbManager = DatabaseManager.getInstance()
dbManager.runMigrations()

// Mock GitHubService
const mockGetRepository = mock()

describe('RepositoryService', () => {
  let repositoryService: RepositoryService
  let userService: UserService
  let testUser: User

  beforeEach(async () => {
    // Clear database
    const db = dbManager.getDatabase()
    db.exec('DELETE FROM oauth_states')
    db.exec('DELETE FROM user_sessions')
    db.exec('DELETE FROM reviews')
    db.exec('DELETE FROM pull_requests')
    db.exec('DELETE FROM repositories')
    db.exec('DELETE FROM users')

    // Create a test user
    userService = new UserService()
    testUser = await userService.createOrUpdateUser(
      {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://github.com/images/error/testuser_happy.gif'
      },
      'test-access-token',
      'test-refresh-token',
      ['repo', 'user:email', 'read:user'],
      new Date(Date.now() + 3600000) // 1 hour from now
    )

    repositoryService = RepositoryService.forUser(testUser)
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
    expect((result as any).user_id).toBe(testUser.id) // Verify user association
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

  test('should enforce user isolation', async () => {
    // Create a second user
    const secondUser = await userService.createOrUpdateUser(
      {
        id: 67890,
        login: 'seconduser',
        name: 'Second User',
        email: 'second@example.com',
        avatar_url: 'https://github.com/images/error/seconduser_happy.gif'
      },
      'second-access-token',
      'second-refresh-token',
      ['repo', 'user:email', 'read:user'],
      new Date(Date.now() + 3600000)
    )

    const mockGitHubRepo = {
      id: 123456,
      name: 'test-repo',
      full_name: 'testuser/test-repo'
    }

    mockGetRepository.mockResolvedValue(mockGitHubRepo)

    // Add repository for first user
    const addedRepo = await repositoryService.addRepository('testuser', 'test-repo')

    // Second user should not be able to access first user's repository
    const secondUserService = RepositoryService.forUser(secondUser)
    const retrieved = await secondUserService.getRepositoryById(addedRepo.id)
    expect(retrieved).toBeNull()

    // Second user should not see first user's repositories in list
    const repositories = await secondUserService.getAllRepositories()
    expect(repositories).toHaveLength(0)
  })

  test('should require user authentication for adding repositories', async () => {
    const serviceWithoutUser = new RepositoryService()

    try {
      await serviceWithoutUser.addRepository('testuser', 'test-repo')
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('User authentication required')
    }
  })
})

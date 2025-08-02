import { test, expect, describe, beforeEach, mock } from 'bun:test'
import '../setup' // Import setup to set environment variables
import { GitHubService } from '../../src/services/github'
import { User } from '../../src/types/auth'

// Mock Octokit to avoid real API calls
const mockOctokit = {
  rest: {
    users: {
      getAuthenticated: mock(() => Promise.resolve({
        data: {
          id: 12345,
          login: 'testuser',
          name: 'Test User'
        }
      }))
    },
    repos: {
      get: mock(() => Promise.resolve({
        data: {
          id: 123456,
          name: 'test-repo',
          full_name: 'testuser/test-repo'
        }
      }))
    }
  }
}

// Mock the Octokit constructor
mock.module('@octokit/rest', () => ({
  Octokit: mock(() => mockOctokit)
}))

describe('GitHubService', () => {
  let testUser: User

  beforeEach(() => {
    testUser = {
      id: 1,
      github_id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_expires_at: new Date(Date.now() + 3600000), // 1 hour from now
      scopes: ['repo', 'user:email', 'read:user'],
      created_at: new Date(),
      updated_at: new Date()
    }

    // Clear all mocks
    mockOctokit.rest.users.getAuthenticated.mockClear()
    mockOctokit.rest.repos.get.mockClear()
  })

  test('should create service with user token', () => {
    const service = GitHubService.forUser(testUser)
    expect(service).toBeDefined()
  })

  test('should create service with direct token', () => {
    const service = GitHubService.withToken('direct-token')
    expect(service).toBeDefined()
  })

  test('should create service with legacy environment token', () => {
    const service = new GitHubService()
    expect(service).toBeDefined()
  })

  test('should get current user', async () => {
    const service = GitHubService.forUser(testUser)
    const user = await service.getCurrentUser()

    expect(user.id).toBe(12345)
    expect(user.login).toBe('testuser')
    expect(mockOctokit.rest.users.getAuthenticated).toHaveBeenCalled()
  })

  test('should get repository', async () => {
    const service = GitHubService.forUser(testUser)
    const repo = await service.getRepository('testuser', 'test-repo')

    expect(repo.id).toBe(123456)
    expect(repo.name).toBe('test-repo')
    expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith({
      owner: 'testuser',
      repo: 'test-repo'
    })
  })

  test('should use environment token when no user provided', () => {
    // Since we have GITHUB_TOKEN set in test setup, this should work
    const service = new GitHubService(undefined)
    expect(service).toBeDefined()
  })
})

import { test, expect, describe, beforeEach } from 'bun:test'
import '../setup' // Import setup to set environment variables
import { UserService } from '../../src/services/user'
import { DatabaseManager } from '../../src/db/database'
import { GitHubUser } from '../../src/types/auth'

// Setup test database
const dbManager = DatabaseManager.getInstance()
dbManager.runMigrations()

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    // Clear database
    const db = dbManager.getDatabase()
    db.exec('DELETE FROM oauth_states')
    db.exec('DELETE FROM user_sessions')
    db.exec('DELETE FROM users')

    userService = new UserService()
  })

  test('should create a new user successfully', async () => {
    const githubUser: GitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif'
    }

    const user = await userService.createOrUpdateUser(
      githubUser,
      'access-token',
      'refresh-token',
      ['repo', 'user:email', 'read:user'],
      new Date(Date.now() + 3600000)
    )

    expect(user.github_id).toBe(12345)
    expect(user.login).toBe('testuser')
    expect(user.name).toBe('Test User')
    expect(user.email).toBe('test@example.com')
    expect(user.access_token).toBe('access-token')
    expect(user.refresh_token).toBe('refresh-token')
    expect(user.scopes).toEqual(['repo', 'user:email', 'read:user'])
  })

  test('should update existing user', async () => {
    const githubUser: GitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif'
    }

    // Create user
    await userService.createOrUpdateUser(
      githubUser,
      'old-token',
      'old-refresh-token',
      ['repo'],
      new Date(Date.now() + 3600000)
    )

    // Update user
    const updatedUser = await userService.createOrUpdateUser(
      { ...githubUser, name: 'Updated Name' },
      'new-token',
      'new-refresh-token',
      ['repo', 'user:email'],
      new Date(Date.now() + 7200000)
    )

    expect(updatedUser.name).toBe('Updated Name')
    expect(updatedUser.access_token).toBe('new-token')
    expect(updatedUser.refresh_token).toBe('new-refresh-token')
    expect(updatedUser.scopes).toEqual(['repo', 'user:email'])
  })

  test('should retrieve user by ID', async () => {
    const githubUser: GitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif'
    }

    const createdUser = await userService.createOrUpdateUser(
      githubUser,
      'access-token',
      'refresh-token',
      ['repo'],
      new Date(Date.now() + 3600000)
    )

    const retrievedUser = await userService.getUserById(createdUser.id)
    expect(retrievedUser?.id).toBe(createdUser.id)
    expect(retrievedUser?.login).toBe('testuser')
  })

  test('should retrieve user by GitHub ID', async () => {
    const githubUser: GitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif'
    }

    await userService.createOrUpdateUser(
      githubUser,
      'access-token',
      'refresh-token',
      ['repo'],
      new Date(Date.now() + 3600000)
    )

    const retrievedUser = await userService.getUserByGitHubId(12345)
    expect(retrievedUser?.github_id).toBe(12345)
    expect(retrievedUser?.login).toBe('testuser')
  })

  test('should create and validate sessions', async () => {
    const githubUser: GitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif'
    }

    const user = await userService.createOrUpdateUser(
      githubUser,
      'access-token',
      'refresh-token',
      ['repo'],
      new Date(Date.now() + 3600000)
    )

    // Create session
    const session = await userService.createSession(user.id, '127.0.0.1', 'test-agent')
    expect(session.user_id).toBe(user.id)
    expect(session.ip_address).toBe('127.0.0.1')
    expect(session.user_agent).toBe('test-agent')

    // Retrieve session
    const retrievedSession = await userService.getSession(session.id)
    expect(retrievedSession?.id).toBe(session.id)
    expect(retrievedSession?.user_id).toBe(user.id)

    // Delete session
    await userService.deleteSession(session.id)
    const deletedSession = await userService.getSession(session.id)
    expect(deletedSession).toBeNull()
  })

  test('should create and validate OAuth states', async () => {
    // Create OAuth state
    const state = await userService.createOAuthState()
    expect(state).toBeTruthy()
    expect(typeof state).toBe('string')

    // Validate state
    const isValid = await userService.validateOAuthState(state)
    expect(isValid).toBe(true)

    // State should be consumed (one-time use)
    const isValidAgain = await userService.validateOAuthState(state)
    expect(isValidAgain).toBe(false)
  })

  test('should encrypt and decrypt tokens', async () => {
    const githubUser: GitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/images/error/testuser_happy.gif'
    }

    const originalToken = 'very-secret-access-token'
    const user = await userService.createOrUpdateUser(
      githubUser,
      originalToken,
      'refresh-token',
      ['repo'],
      new Date(Date.now() + 3600000)
    )

    // Token should be decrypted correctly when retrieved
    expect(user.access_token).toBe(originalToken)

    // Verify token is encrypted in database
    const db = dbManager.getDatabase()
    const stmt = db.prepare('SELECT access_token FROM users WHERE id = ?')
    const result = stmt.get(user.id) as any
    expect(result.access_token).not.toBe(originalToken) // Should be encrypted
  })
})

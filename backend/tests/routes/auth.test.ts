import { test, expect, describe, beforeEach } from 'bun:test'
import '../setup' // Import setup to set environment variables
import { Hono } from 'hono'
import authRoutes from '../../src/routes/auth'
import { DatabaseManager } from '../../src/db/database'
import { UserService } from '../../src/services/user'

// Setup test database
const dbManager = DatabaseManager.getInstance()
dbManager.runMigrations()

describe('Auth Routes', () => {
  let app: Hono
  let userService: UserService

  beforeEach(() => {
    // Clear database
    const db = dbManager.getDatabase()
    db.exec('DELETE FROM oauth_states')
    db.exec('DELETE FROM user_sessions')
    db.exec('DELETE FROM users')

    // Setup test app
    app = new Hono()
    app.route('/auth', authRoutes)
    
    userService = new UserService()
  })

  test('should redirect to GitHub OAuth on login', async () => {
    const req = new Request('http://localhost/auth/github/login')
    const res = await app.fetch(req)

    expect(res.status).toBe(302)
    const location = res.headers.get('Location')
    expect(location).toContain('https://github.com/login/oauth/authorize')
    expect(location).toContain('client_id=test-client-id')
    // Allow additional scopes (e.g., read:org); assert required scopes are present
    expect(location).toContain('scope=')
    expect(location).toContain('repo')
    expect(location).toContain('user%3Aemail')
    expect(location).toContain('read%3Auser')
  })

  test('should return authentication status for unauthenticated user', async () => {
    const req = new Request('http://localhost/auth/status')
    const res = await app.fetch(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.authenticated).toBe(false)
  })

  test('should require authentication for /auth/me', async () => {
    const req = new Request('http://localhost/auth/me')
    const res = await app.fetch(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Authentication required')
  })

  test('should require authentication for logout', async () => {
    const req = new Request('http://localhost/auth/logout', { method: 'POST' })
    const res = await app.fetch(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Authentication required')
  })

  test('should handle OAuth callback with missing parameters', async () => {
    const req = new Request('http://localhost/auth/github/callback')
    const res = await app.fetch(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Missing required parameters')
  })

  test('should handle OAuth callback with invalid state', async () => {
    const req = new Request('http://localhost/auth/github/callback?code=test-code&state=invalid-state')
    const res = await app.fetch(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid or expired state parameter')
  })
})

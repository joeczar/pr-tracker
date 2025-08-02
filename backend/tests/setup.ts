// Mock environment variables for Bun tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = ':memory:'
process.env.GITHUB_TOKEN = 'test-token'
process.env.CORS_ORIGIN = 'http://localhost:3000'

// OAuth configuration for tests
process.env.GITHUB_OAUTH_CLIENT_ID = 'test-client-id'
process.env.GITHUB_OAUTH_CLIENT_SECRET = 'test-client-secret'
process.env.GITHUB_OAUTH_CALLBACK_URL = 'http://localhost:3000/auth/github/callback'

// Session and security configuration for tests
process.env.SESSION_SECRET = 'test-session-secret-32-characters-long'
process.env.SESSION_COOKIE_NAME = 'test_session'
process.env.SESSION_MAX_AGE = '3600' // 1 hour for tests
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
process.env.CSRF_SECRET = 'test-csrf-secret'

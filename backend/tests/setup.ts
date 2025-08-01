// Mock environment variables for Bun tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = ':memory:'
process.env.GITHUB_TOKEN = 'test-token'
process.env.CORS_ORIGIN = 'http://localhost:3000'

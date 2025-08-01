import { test, expect, describe } from 'bun:test'
import { Hono } from 'hono'

describe('Health Endpoint', () => {
  test('should return health status', async () => {
    const app = new Hono()

    app.get('/health', (c) => {
      return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      })
    })

    const req = new Request('http://localhost/health')
    const res = await app.fetch(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.version).toBe('1.0.0')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

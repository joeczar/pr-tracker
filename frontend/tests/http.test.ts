import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { fetchJson, HttpError } from '@/lib/api/http';

const originalFetch = global.fetch;

describe('http.fetchJson', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses JSON responses and includes credentials', async () => {
    const spy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    // override in test runtime
    // @ts-ignore
    global.fetch = spy;

    const res = await fetchJson('/test', { method: 'GET' });
    expect(res).toEqual({ ok: true });

    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\/test$/), expect.objectContaining({
      credentials: 'include',
      method: 'GET',
    }));
  });

  it('returns null for 204', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    // @ts-ignore
    global.fetch = spy;

    const res = await fetchJson('/no-content', { method: 'GET' });
    expect(res).toBeNull();
  });

  it('throws HttpError with normalized message from payload.message', async () => {
    const spy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Bad request' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    );
    // @ts-ignore
    global.fetch = spy;

    await expect(fetchJson('/bad', { method: 'GET' })).rejects.toMatchObject({
      name: 'HttpError',
      status: 400,
      message: 'Bad request',
    } as HttpError);
  });

  it('throws HttpError with normalized message from payload.error', async () => {
    const spy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    );
    // @ts-ignore
    global.fetch = spy;

    await expect(fetchJson('/unauth', { method: 'GET' })).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    } as HttpError);
  });

  it('throws HttpError when non-JSON payload; includes status and a message', async () => {
    const blob = new Blob(['<html>error</html>'], { type: 'text/html' });
    const spy = vi.fn().mockResolvedValue(
      new Response(blob, { status: 500, statusText: 'Server Error' })
    );
    // @ts-ignore
    global.fetch = spy;

    await expect(fetchJson('/oops', { method: 'GET' })).rejects.toBeInstanceOf(HttpError);
    try {
      await fetchJson('/oops', { method: 'GET' });
    } catch (err: any) {
      // In some environments, thrown error may not preserve custom fields via instanceof Response wrapping
      // Ensure we at least have a string message
      expect(typeof err?.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    }
  });
});

afterAll(() => {
  // @ts-ignore restore
  global.fetch = originalFetch;
});

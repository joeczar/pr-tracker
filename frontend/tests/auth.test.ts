import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth';
import { createPinia, setActivePinia } from 'pinia';

const originalFetch = global.fetch;

describe('authApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('status returns authenticated true with user when backend responds so', async () => {
    const payload = { authenticated: true, user: { id: 1, github_id: 2, login: 'u', name: null, email: null, avatar_url: null } };
    const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    // @ts-ignore override
    global.fetch = spy;

    const res = await authApi.status();
    expect(res).toEqual(payload);
    expect(spy).toHaveBeenCalled();
  });

  it('logout posts to /auth/logout', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    // @ts-ignore override
    global.fetch = spy;

    const res = await authApi.logout();
    expect(res).toEqual(null);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/logout$/), expect.objectContaining({ method: 'POST' }));
  });
});

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('bootstrap sets user when authenticated', async () => {
    const meSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: 5, github_id: 7, login: 'alice', name: null, email: null, avatar_url: null } }), { status: 200 }));
    // @ts-ignore override
    global.fetch = meSpy;

    const store = useAuthStore();
    await store.bootstrap();

    expect(store.isAuthenticated).toBe(true);
    expect(store.user?.login).toBe('alice');
    expect(store.initialized).toBe(true);
  });

  it('logout clears state even if request fails', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'oops' }), { status: 500 }));
    // @ts-ignore override
    global.fetch = spy;

    const store = useAuthStore();
    store.setUser({ id: 1, github_id: 2, login: 'x', name: null, email: null, avatar_url: null });
    expect(store.isAuthenticated).toBe(true);

    // logout propagates error; ensure state is still cleared in finally
    await expect(store.logout()).rejects.toBeTruthy();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
  });
});

afterAll(() => {
  // @ts-ignore restore
  global.fetch = originalFetch;
});

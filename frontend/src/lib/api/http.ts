// Lightweight HTTP helper with credentials and normalized error handling

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FetchJsonInit extends RequestInit {
  json?: unknown; // convenience to set JSON body
}

const API_BASE = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:3000';

export class HttpError extends Error {
  status: number;
  payload: unknown | null;
  constructor(message: string, status: number, payload: unknown | null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Convert a Response to JSON safely, returning null for empty bodies.
 */
async function safeJson(res: Response): Promise<unknown | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Normalizes error payload shape from backend { error, message?, details? }
 */
function extractErrorMessage(payload: unknown, res: Response): string {
  if (!payload) return res.statusText;
  if (typeof payload === 'string') return payload;
  const obj = payload as { message?: string; error?: string };
  return obj.message || obj.error || res.statusText;
}

export async function fetchJson(path: string, init: FetchJsonInit = {}) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  // Normalize init.body to avoid null typing issues
  let body: BodyInit | undefined = (init.body === null ? undefined : (init.body as BodyInit | undefined));

  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }

  const res = await fetch(API_BASE + path, {
    ...init,
    headers,
    body,
    // Always include cookies for cross-origin requests (auth/session)
    credentials: 'include',
    // Avoid sending a body for GET/HEAD which can cause server/CORS issues
    method: init.method ?? 'GET',
  });

  if (!res.ok) {
    const payload = await safeJson(res);
    const message = extractErrorMessage(payload, res);
    throw new HttpError(message, res.status, payload);
  }

  // No content
  if (res.status === 204) {
    return null;
  }

  return safeJson(res);
}

// Convenience methods
export const http = {
  get: (path: string, init?: FetchJsonInit) => fetchJson(path, { ...init, method: 'GET' }),
  post: (path: string, json?: unknown, init?: FetchJsonInit) =>
    fetchJson(path, { ...init, method: 'POST', json }),
  put: (path: string, json?: unknown, init?: FetchJsonInit) =>
    fetchJson(path, { ...init, method: 'PUT', json }),
  patch: (path: string, json?: unknown, init?: FetchJsonInit) =>
    fetchJson(path, { ...init, method: 'PATCH', json }),
  delete: (path: string, init?: FetchJsonInit) => fetchJson(path, { ...init, method: 'DELETE' }),
};

export { API_BASE };

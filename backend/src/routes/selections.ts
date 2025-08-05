import { Hono } from 'hono';
import { SelectionService } from '../services/selection';
import { requireAuth } from '../middleware/auth';
import type { Context } from 'hono';

type AuthedUser = { id: number };

const selections = new Hono();

// All routes require auth
selections.use('*', requireAuth);

// GET /api/selections/active -> { selection, items }
selections.get('/active', async (c: Context) => {
  const user = (c.get as unknown as (k: string) => AuthedUser | undefined)('user');
  if (!user) return c.json({ selection: null, items: [] });

  const svc = new SelectionService();
  const { selection, items } = svc.getActiveSelectionByUserId(user.id);
  return c.json({ selection, items });
});

// POST /api/selections/active -> create empty active selection (if none) and return
selections.post('/active', async (c: Context) => {
  const user = (c.get as unknown as (k: string) => AuthedUser | undefined)('user');
  if (!user) return c.json({ selection: null, items: [] });

  const svc = new SelectionService();
  const selection = svc.ensureActiveSelection(user.id);
  const { items } = svc.getActiveSelectionByUserId(user.id);
  return c.json({ selection, items });
});

// DELETE /api/selections/active -> clear active selection (items and selection)
selections.delete('/active', async (c: Context) => {
  const user = (c.get as unknown as (k: string) => AuthedUser | undefined)('user');
  if (!user) return c.json({ success: true });

  const svc = new SelectionService();
  svc.clearActiveSelection(user.id);
  return c.json({ success: true });
});

// POST /api/selections/active/items -> add items [{ repository_id, pr_number }]
selections.post('/active/items', async (c: Context) => {
  const user = (c.get as unknown as (k: string) => AuthedUser | undefined)('user');
  if (!user) return c.json({ added: 0 });

  const body = (await c.req.json().catch(() => null)) as { repository_id: number; pr_number: number }[] | null;
  if (!Array.isArray(body)) {
    return c.json({ error: 'Invalid body; expected an array of { repository_id, pr_number }' }, 400);
  }

  // Basic validation
  const items = body.filter((x) => x && Number.isInteger(x.repository_id) && Number.isInteger(x.pr_number));
  const svc = new SelectionService();
  const { added } = svc.addItems(user.id, items);
  const { selection, items: current } = svc.getActiveSelectionByUserId(user.id);
  return c.json({ added, selection, items: current });
});

// DELETE /api/selections/active/items -> remove items [{ repository_id, pr_number }]
selections.delete('/active/items', async (c: Context) => {
  const user = (c.get as unknown as (k: string) => AuthedUser | undefined)('user');
  if (!user) return c.json({ removed: 0 });

  const body = (await c.req.json().catch(() => null)) as { repository_id: number; pr_number: number }[] | null;
  if (!Array.isArray(body)) {
    return c.json({ error: 'Invalid body; expected an array of { repository_id, pr_number }' }, 400);
  }

  const items = body.filter((x) => x && Number.isInteger(x.repository_id) && Number.isInteger(x.pr_number));
  const svc = new SelectionService();
  const { removed } = svc.removeItems(user.id, items);
  const { selection, items: current } = svc.getActiveSelectionByUserId(user.id);
  return c.json({ removed, selection, items: current });
});

export default selections;

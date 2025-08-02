import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { formatErrorResponse } from './utils/errors.js';

// Initialize database
import { DatabaseManager } from './db/database.js';
const dbManager = DatabaseManager.getInstance();
dbManager.runMigrations();

import { githubRoutes } from './routes/github.js';
import { repositoryRoutes } from './routes/repositories.js';
import { pullRequestRoutes } from './routes/pull-requests.js';
import { reviewRoutes } from './routes/reviews.js';
import { analyticsRoutes } from './routes/analytics.js';
import { syncRoutes } from './routes/sync.js';
import authRoutes from './routes/auth.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow cookies for authentication
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Authentication routes
app.route('/auth', authRoutes);

// API routes
app.route('/api/github', githubRoutes);
app.route('/api/repositories', repositoryRoutes);
app.route('/api/pull-requests', pullRequestRoutes);
app.route('/api/reviews', reviewRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/sync', syncRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return formatErrorResponse(err, c);
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};

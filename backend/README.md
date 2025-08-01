# PR Tracker Backend

A Hono-based TypeScript backend for tracking GitHub Pull Request metrics and analytics.

## Features

- GitHub API integration for PR and review data collection
- SQLite database for local data storage
- Real-time metrics calculation and trend analysis
- Rate-limited background synchronization
- RESTful API for frontend integration

## Setup

### Prerequisites

- Node.js 18+ or Bun runtime
- GitHub Personal Access Token with repo permissions

### Installation

1. Install dependencies:
```bash
bun install
# or
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your GitHub token and configuration
```

3. Initialize database:
```bash
bun run db:migrate
```

4. Start development server:
```bash
bun run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Required |
| `DATABASE_URL` | SQLite database file path | `./data/pr-tracker.db` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |
| `GITHUB_API_RATE_LIMIT` | GitHub API rate limit | `5000` |
| `SYNC_INTERVAL_MINUTES` | Background sync interval | `60` |
| `MAX_CONCURRENT_SYNCS` | Max concurrent sync operations | `3` |
| `LOG_LEVEL` | Logging level | `info` |

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Repositories
- `GET /api/repositories` - List tracked repositories
- `POST /api/repositories` - Add repository to track
- `GET /api/repositories/:id` - Get repository details
- `DELETE /api/repositories/:id` - Remove repository

### Pull Requests
- `GET /api/pull-requests/repository/:repositoryId` - List PRs for repository
- `GET /api/pull-requests/repository/:repositoryId/metrics` - Get PR metrics
- `GET /api/pull-requests/repository/:repositoryId/stats` - Get PR statistics summary
- `GET /api/pull-requests/:id` - Get PR details
- `POST /api/pull-requests/repository/:repositoryId/sync` - Sync PRs from GitHub

### Reviews
- `GET /api/reviews/pull-request/:pullRequestId` - List reviews for PR
- `GET /api/reviews/repository/:repositoryId/metrics` - Get review metrics
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews/pull-request/:pullRequestId/sync` - Sync reviews for PR

### Analytics
- `GET /api/analytics/repository/:repositoryId/trends` - Get trend analysis
- `POST /api/analytics/compare` - Compare multiple repositories

### Sync Management
- `POST /api/sync/repository/:repositoryId` - Queue sync job
- `GET /api/sync/job/:jobId` - Get sync job status
- `GET /api/sync/repository/:repositoryId/history` - Get sync history
- `GET /api/sync/rate-limit` - Get rate limit status
- `POST /api/sync/periodic/start` - Start periodic sync

### GitHub Integration
- `GET /api/github/test` - Test GitHub API connection
- `GET /api/github/repos/:owner/:repo` - Get GitHub repository info
- `GET /api/github/repos/:owner/:repo/pulls` - Get GitHub PRs
- `GET /api/github/repos/:owner/:repo/pulls/:pull_number` - Get PR details
- `GET /api/github/repos/:owner/:repo/pulls/:pull_number/files` - Get PR files
- `GET /api/github/rate-limit` - Get GitHub rate limit info

## Database Schema

The application uses SQLite with the following tables:

- `repositories` - Tracked GitHub repositories
- `pull_requests` - PR data with metrics
- `reviews` - Code review data and comments

## Development

### Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:migrate` - Run database migrations
- `bun test` - Run test suite with Bun's built-in test runner
- `bun test --watch` - Run tests in watch mode
- `bun test --coverage` - Run tests with coverage report

### Project Structure

```
src/
├── db/           # Database management and migrations
├── routes/       # API route handlers
├── services/     # Business logic and external integrations
└── index.ts      # Application entry point
```

## Deployment

The backend is designed to be deployed on platforms that support Node.js or Bun:

- **Development**: Local Bun/Node.js server
- **Production**: Cloudflare Workers, Vercel, Railway, or similar

For Cloudflare Workers deployment, see the included `wrangler.toml` configuration.

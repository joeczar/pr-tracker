# GitHub PR Progress Tracker - Development Plan

## Context & Purpose

Building a progress tracking system for ADHD/bipolar developers to improve code review skills through data visualization and gamified progress tracking. Based on research showing that smaller PRs, faster review cycles, and structured feedback loops significantly improve code quality and developer satisfaction.

## Core Problem
- Large PRs are harder to review thoroughly 
- ADHD developers need external structure and immediate feedback
- Teams lack visibility into review process improvements
- No systematic way to track code review skill development

## Key Metrics to Track

### PR Creation to Merge Time
- Primary indicator of team velocity
- Shows impact of smaller PR strategies
- Baseline: typical 3-7 days, target: under 24 hours

### Review Comment Volume & Depth
- Comment count per PR
- Thread depth (replies indicating thorough discussion)
- Measures engagement quality over time

### PR Size Metrics
- Lines added/deleted
- Files changed
- Correlation with review time

### Commit Patterns
- Number of commits per PR
- Average commit size
- Tracks atomic commit adoption

## Technical Approach

### Vue + Hono Architecture
- Vue frontend for ADHD-friendly UI (immediate feedback, visual progress)
- Hono backend for GitHub API aggregation and rate limit management
- SQLite for simple deployment and historical data storage

### Why This Stack:
- No complex infrastructure needed
- Fast development iteration
- Easy deployment for small teams
- Handles GitHub API rate limits efficiently

## User Journey

1. **Setup:** Connect GitHub repo, configure tracking
2. **Data Collection:** Background sync of PR/review data
3. **Progress View:** Visual dashboards showing improvement trends
4. **Insights:** Correlations between PR size and review quality

## Success Criteria

- 40% reduction in average PR review time
- 60% decrease in PR size (lines of code)
- Increased review comment engagement
- Developer satisfaction with review process

## MVP Scope

Track 1-2 repositories, visualize core metrics over time, basic trend analysis. Focus on proving the value of systematic PR size reduction and review process improvement.

---

## Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Git
- GitHub Personal Access Token with repo permissions

### Project Structure
```
pr-tracker/
├── frontend/           # Vue 3 + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/     # Pinia state management
│   │   └── types/      # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Hono + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   ├── services/   # GitHub API integration
│   │   ├── db/         # SQLite schema & queries
│   │   └── types/      # Shared TypeScript types
│   ├── package.json
│   └── wrangler.toml   # Cloudflare Workers config
├── shared/             # Shared types & utilities
│   └── types/
└── docs/
```

### Initial Setup Commands

```bash
# Clone and setup
git clone <repo-url> pr-tracker
cd pr-tracker

# Backend setup
cd backend
pnpm install
pnpm dev

# Frontend setup (new terminal)
cd ../frontend  
pnpm install
pnpm dev

# Database initialization
cd ../backend
pnpm db:migrate
```

### Environment Configuration

#### Backend (.env)
```env
GITHUB_TOKEN=ghp_your_token_here
DATABASE_URL=./data/pr-tracker.db
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=PR Progress Tracker
```

### Development Workflow

#### Phase 1: Core Infrastructure (Week 1)
- [ ] Project scaffolding with Vite + Hono
- [ ] SQLite schema design
- [ ] GitHub API authentication
- [ ] Basic PR data fetching

#### Phase 2: Data Collection (Week 2)
- [ ] PR metrics calculation
- [ ] Background sync service
- [ ] Rate limit handling
- [ ] Data persistence layer

#### Phase 3: Frontend Dashboard (Week 3)
- [ ] Vue components for metrics display
- [ ] Chart.js integration for visualizations
- [ ] Responsive ADHD-friendly UI
- [ ] Real-time data updates

#### Phase 4: Analytics & Insights (Week 4)
- [ ] Trend analysis algorithms
- [ ] Progress tracking features
- [ ] Export functionality
- [ ] Performance optimizations

### Key Dependencies

#### Frontend
```json
{
  "vue": "^3.3.0",
  "vue-router": "^4.2.0",
  "pinia": "^2.1.0",
  "@vueuse/core": "^10.0.0",
  "chart.js": "^4.3.0",
  "tailwindcss": "^3.3.0"
}
```

#### Backend
```json
{
  "hono": "^3.4.0",
  "@octokit/rest": "^20.0.0",
  "better-sqlite3": "^8.14.0",
  "zod": "^3.21.0",
  "date-fns": "^2.30.0"
}
```

### Database Schema (SQLite)

```sql
-- repositories table
CREATE TABLE repositories (
  id INTEGER PRIMARY KEY,
  github_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- pull_requests table  
CREATE TABLE pull_requests (
  id INTEGER PRIMARY KEY,
  github_id INTEGER UNIQUE,
  repository_id INTEGER,
  number INTEGER,
  title TEXT,
  state TEXT,
  created_at DATETIME,
  merged_at DATETIME,
  lines_added INTEGER,
  lines_deleted INTEGER,
  files_changed INTEGER,
  commits_count INTEGER,
  FOREIGN KEY (repository_id) REFERENCES repositories(id)
);

-- reviews table
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  github_id INTEGER UNIQUE,
  pull_request_id INTEGER,
  reviewer_login TEXT,
  state TEXT,
  submitted_at DATETIME,
  comments_count INTEGER,
  FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id)
);
```

### Deployment Strategy

#### Development
- Frontend: Vite dev server (localhost:5173)
- Backend: Hono dev server (localhost:3000)
- Database: Local SQLite file

#### Production (MVP)
- Frontend: Vercel/Netlify static hosting
- Backend: Cloudflare Workers
- Database: Cloudflare D1 (SQLite-compatible)

### Testing Strategy

- **Unit Tests**: Vitest for both frontend and backend
- **Integration Tests**: GitHub API mocking with MSW
- **E2E Tests**: Playwright for critical user flows
- **Type Safety**: Strict TypeScript, no `any` types

### Performance Considerations

- GitHub API rate limiting (5000 requests/hour)
- Incremental data sync (only fetch new PRs)
- Frontend virtualization for large datasets
- SQLite query optimization with proper indexes

### Security Notes

- GitHub tokens stored securely (environment variables)
- CORS configuration for frontend-backend communication
- Input validation with Zod schemas
- No sensitive data in client-side code
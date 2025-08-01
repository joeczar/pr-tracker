# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Installation
- `pnpm run install:all` - Install dependencies for all workspaces (root, backend, frontend)
- `pnpm run db:migrate` - Initialize/migrate SQLite database

### Development
- `pnpm run dev` - Start both backend (port 3000) and frontend (port 5173) in development mode
- `pnpm run dev:backend` - Start only backend server with hot reload (Bun)
- `pnpm run dev:frontend` - Start only frontend dev server (Vite)

### Building and Testing
- `pnpm run build` - Build both backend and frontend for production
- `pnpm run test` - Run tests for both applications
- `pnpm run lint` - Lint both applications (backend may fail gracefully)
- `cd frontend && pnpm run type-check` - TypeScript type checking for frontend

### Database Operations
- `pnpm run db:migrate` - Run database migrations
- Backend uses SQLite with manual schema management in `/backend/src/db/`

## Architecture Overview

### Project Structure
- **Monorepo**: Uses pnpm workspaces with separate frontend, backend, and shared packages
- **Backend**: Hono framework with TypeScript, running on Bun runtime
- **Frontend**: Vue 3 + TypeScript + Vite + Tailwind CSS + Pinia for state management
- **Shared**: Common TypeScript types used across frontend and backend

### Backend Architecture (`backend/`)
- **Framework**: Hono (lightweight web framework)
- **Runtime**: Bun (JavaScript runtime)
- **Database**: SQLite with custom database manager
- **API Structure**: RESTful routes organized by domain:
  - `/api/github` - GitHub API integration
  - `/api/repositories` - Repository management
  - `/api/pull-requests` - PR data and metrics
- **Services**: GitHub API integration, repository management, PR analytics
- **Database**: Manual schema in `src/db/database.ts`, migrations in `src/db/migrate.ts`

### Frontend Architecture (`frontend/`)
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia stores for repositories and pull requests
- **Routing**: Vue Router with views for Dashboard, Repositories, RepositoryDetail
- **Styling**: Tailwind CSS with custom components
- **Charts**: Chart.js via vue-chartjs for data visualization
- **API Client**: Axios-based service in `src/services/api.ts`

### Shared Types (`shared/`)
- Central TypeScript definitions for API contracts
- Database entity types (Repository, PullRequest, Review)
- GitHub API response types
- Metrics and analytics types

### Key Features
- GitHub PR tracking and metrics analysis
- ADHD-friendly UI with immediate feedback
- Data visualization for PR trends and review metrics
- SQLite database for local data storage
- GitHub API integration with personal access tokens

### Environment Configuration
- Backend requires `GITHUB_TOKEN` environment variable
- Frontend connects to backend via `VITE_API_BASE_URL`
- CORS configured for local development (port 5173)

### Task Files and Planning
- after creating a plan create a markdown taks file
- save it in .claude/working/tasks
- break the tasks down into atomic commits
- plan PR's small >500 lines and focused
- used trunk based development
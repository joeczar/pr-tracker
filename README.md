# PR Progress Tracker

A GitHub PR progress tracking system designed for ADHD/bipolar developers to improve code review skills through data visualization and gamified progress tracking.

## Features

- 📊 **PR Metrics Tracking**: Monitor PR size, review time, and merge patterns
- 🎯 **ADHD-Friendly UI**: Immediate feedback and visual progress indicators
- 📈 **Trend Analysis**: Visualize improvements over time
- 🔄 **GitHub Integration**: Automatic data sync from GitHub repositories
- 🚀 **Fast Setup**: Simple deployment with SQLite and modern web stack

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite + Tailwind CSS
- **Backend**: Hono + TypeScript + SQLite
- **API**: GitHub REST API integration
- **Charts**: Chart.js for data visualization

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- GitHub Personal Access Token with repo permissions

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url> pr-tracker
   cd pr-tracker
   pnpm run install:all
   ```

2. **Set up environment variables**:
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your GitHub token
   
   # Frontend configuration
   cp frontend/.env.example frontend/.env
   ```

3. **Initialize database**:
   ```bash
   pnpm run db:migrate
   ```

4. **Start development servers**:
   ```bash
   pnpm run dev
   ```

   This will start:
   - Backend API server on http://localhost:3000
   - Frontend dev server on http://localhost:5173

## Environment Configuration

### Backend (.env)
```env
GITHUB_TOKEN=ghp_your_token_here
DATABASE_URL=./data/pr-tracker.db
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=PR Progress Tracker
```

## Usage

1. **Add Repository**: Navigate to the Repositories page and add a GitHub repository to track
2. **Sync Data**: The system will automatically fetch PR data from GitHub
3. **View Metrics**: Check the dashboard for PR size trends, review times, and other metrics
4. **Track Progress**: Monitor improvements in your code review process over time

## Development

### Available Scripts

- `pnpm run dev` - Start both frontend and backend in development mode
- `pnpm run build` - Build both applications for production
- `pnpm run test` - Run tests for both applications
- `pnpm run db:migrate` - Run database migrations
- `pnpm run lint` - Lint both applications

### Project Structure

```
pr-tracker/
├── frontend/           # Vue 3 + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/     # Pinia state management
│   │   └── types/      # TypeScript definitions
├── backend/            # Hono + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   ├── services/   # GitHub API integration
│   │   ├── db/         # SQLite schema & queries
│   │   └── types/      # Shared TypeScript types
├── shared/             # Shared types & utilities
│   └── types/
└── docs/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

# PR Progress Tracker

A GitHub PR progress tracking system designed for ADHD/bipolar developers to improve code review skills through data visualization and gamified progress tracking. Features a cyberpunk terminal-themed interface with full accessibility compliance.

## ✨ Features

### Core Functionality
- 📊 **PR Metrics Tracking**: Monitor PR size, review time, and merge patterns
- 🎯 **ADHD-Friendly UI**: Immediate feedback and visual progress indicators
- 📈 **Trend Analysis**: Visualize improvements over time
- 🔄 **GitHub Integration**: Automatic data sync from GitHub repositories
- 🚀 **Fast Setup**: Simple deployment with SQLite and modern web stack

### Accessibility & UX
- ♿ **WCAG 2.1 AA Compliant**: Full accessibility support with high contrast ratios
- ⌨️ **Keyboard Navigation**: Complete keyboard accessibility with terminal-style shortcuts
- 🔊 **Screen Reader Support**: Semantic HTML and ARIA labels throughout
- 🎨 **Cyberpunk Terminal Theme**: Distinctive aesthetic with accessibility-first design
- 🌓 **Dark/Light Themes**: Both themes maintain accessibility standards
- 📱 **Responsive Design**: Mobile-first approach with touch-friendly interfaces

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vue 3 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS Properties
- **UI Components**: Shadcn-vue with custom cyberpunk variants
- **State Management**: Pinia
- **Charts**: Chart.js for data visualization
- **Accessibility**: Built-in WCAG 2.1 AA compliance

### Backend
- **Runtime**: Bun + Hono framework
- **Language**: TypeScript
- **Database**: SQLite with migrations
- **API Integration**: GitHub REST API
- **Validation**: Zod schemas

### Development Tools
- **Package Manager**: pnpm (frontend) + bun (backend)
- **Build Tool**: Vite (frontend) + Bun (backend)
- **Linting**: ESLint + TypeScript strict mode
- **Testing**: Vitest (frontend) + Bun test (backend)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18+ (required for both frontend and backend)
- **Bun**: Latest version (backend runtime)
- **pnpm**: Recommended package manager for frontend
- **GitHub Personal Access Token**: With `repo` permissions for API access

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/joeczar/pr-tracker.git
   cd pr-tracker
   ```

2. **Install all dependencies**:
   ```bash
   # Install root dependencies and all workspace packages
   pnpm run install:all
   ```

3. **Set up environment variables**:
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your GitHub token:
   # GITHUB_TOKEN=ghp_your_token_here

   # Frontend configuration (optional)
   cp frontend/.env.example frontend/.env
   ```

4. **Initialize the database**:
   ```bash
   pnpm run db:migrate
   ```

5. **Start development servers**:
   ```bash
   pnpm run dev
   ```

   This will start:
   - **Backend API**: http://localhost:3000
   - **Frontend App**: http://localhost:5173

### First-Time Setup

1. Navigate to http://localhost:5173
2. Use keyboard shortcut `Ctrl/Cmd + R` to access Repository Manager
3. Add your first GitHub repository to start tracking PRs
4. The system will automatically sync PR data from GitHub

## ⚙️ Configuration

### Backend Environment (.env)
```env
# GitHub API Configuration
GITHUB_TOKEN=ghp_your_token_here

# Database Configuration
DATABASE_URL=./data/pr-tracker.db

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Optional: Logging and Debug
LOG_LEVEL=info
NODE_ENV=development
```

### Frontend Environment (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Application Configuration
VITE_APP_NAME=PR Progress Tracker
VITE_APP_VERSION=1.0.0

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## 📖 Usage Guide

### Getting Started
1. **Add Repository**: Use `Ctrl/Cmd + R` or navigate to Repositories page
2. **Sync Data**: System automatically fetches PR data from GitHub
3. **View Dashboard**: Use `Ctrl/Cmd + D` to access metrics overview
4. **Track Progress**: Monitor improvements in code review process over time

### Keyboard Shortcuts (Terminal Style)
- `Ctrl/Cmd + D` - Dashboard
- `Ctrl/Cmd + R` - Repository Manager
- `Ctrl/Cmd + H` - Help Dialog
- `Ctrl/Cmd + ~` - Toggle Console
- `Alt + C` - Command Palette (coming soon)
- `Esc` - Close dialogs/modals

### Accessibility Features
- **Screen Reader Support**: Full NVDA, JAWS, and VoiceOver compatibility
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: WCAG 2.1 AA compliant color schemes
- **Focus Management**: Visible focus indicators and logical tab order
- **Reduced Motion**: Respects `prefers-reduced-motion` settings

## 🔧 Development

### Available Scripts

#### Root Level Commands
- `pnpm run dev` - Start both frontend and backend in development mode
- `pnpm run build` - Build both applications for production
- `pnpm run test` - Run tests for both applications
- `pnpm run lint` - Lint both applications
- `pnpm run install:all` - Install dependencies for all packages
- `pnpm run db:migrate` - Run database migrations
- `pnpm run clean` - Clean all build artifacts and node_modules

#### Frontend Specific
- `cd frontend && pnpm run dev` - Start frontend development server
- `cd frontend && pnpm run build` - Build frontend for production
- `cd frontend && pnpm run test` - Run frontend tests with Vitest
- `cd frontend && pnpm run lint` - Lint frontend code

#### Backend Specific
- `cd backend && bun run dev` - Start backend development server
- `cd backend && bun run build` - Build backend for production
- `cd backend && bun run test` - Run backend tests
- `cd backend && bun run db:migrate` - Run database migrations

### Project Structure

```
pr-tracker/
├── 📁 frontend/                    # Vue 3 + TypeScript + Vite
│   ├── 📁 src/
│   │   ├── 📁 components/          # Vue components
│   │   │   ├── 📁 ui/              # Reusable UI components
│   │   │   │   ├── 📁 button/      # Button variants
│   │   │   │   ├── 📁 card/        # Card components
│   │   │   │   ├── 📁 input/       # Input components
│   │   │   │   └── 📁 ascii/       # ASCII art components
│   │   │   └── 📁 features/        # Feature-specific components
│   │   ├── 📁 views/               # Page components
│   │   ├── 📁 stores/              # Pinia state management
│   │   ├── 📁 composables/         # Vue composables
│   │   ├── 📁 lib/                 # Utility functions
│   │   ├── 📁 types/               # TypeScript definitions
│   │   └── 📄 style.css            # Global styles & design system
│   ├── 📄 tailwind.config.js       # Tailwind configuration
│   ├── 📄 components.json          # Shadcn-vue configuration
│   └── 📄 package.json
├── 📁 backend/                     # Hono + TypeScript + Bun
│   ├── 📁 src/
│   │   ├── 📁 routes/              # API route handlers
│   │   ├── 📁 services/            # Business logic & GitHub API
│   │   ├── 📁 db/                  # SQLite schema & queries
│   │   ├── 📁 types/               # Backend TypeScript types
│   │   └── 📁 middleware/          # Custom middleware
│   ├── 📁 data/                    # SQLite database files
│   └── 📄 package.json
├── 📁 shared/                      # Shared types & utilities
│   └── 📁 types/                   # Common TypeScript definitions
├── 📄 DESIGN_SYSTEM.md             # Accessibility design system
├── 📄 development_plan.md          # Development roadmap
├── 📄 package.json                 # Root package configuration
└── 📄 pnpm-workspace.yaml          # Workspace configuration
```

## 🎨 Design System

This project uses a comprehensive accessibility-first design system with a cyberpunk terminal theme. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for detailed guidelines including:

- **Color Palette**: WCAG 2.1 AA compliant colors with contrast ratios
- **Typography**: Accessible font scales and terminal-optimized typefaces
- **Components**: Styled UI components with cyberpunk aesthetics
- **Accessibility**: Focus management, keyboard navigation, screen reader support
- **Themes**: Dark and light variants maintaining accessibility standards

### Key Design Principles
- **Accessibility First**: WCAG 2.1 AA compliance throughout
- **Terminal Aesthetic**: Monospace fonts, glow effects, cyberpunk colors
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Performance**: Optimized animations and efficient rendering

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: All text meets 4.5:1 ratio (7:1+ for most elements)
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Readers**: Semantic HTML with ARIA labels
- **Focus Management**: Visible focus indicators and logical tab order

### Assistive Technology Support
- **Screen Readers**: NVDA, JAWS, VoiceOver compatibility
- **Keyboard Only**: Full functionality without mouse
- **Voice Control**: Proper labeling for voice navigation
- **High Contrast**: System high contrast mode support

### Inclusive Design Features
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Large Text**: Scalable interface supporting zoom up to 200%
- **Color Independence**: Information not conveyed by color alone
- **Clear Language**: Simple, direct interface text

## 🧪 Testing

### Accessibility Testing
```bash
# Install accessibility testing tools
pnpm add -D @axe-core/playwright axe-core

# Run accessibility tests
pnpm run test:a11y
```

### Manual Testing Checklist
- [ ] Keyboard navigation through all interactive elements
- [ ] Screen reader compatibility (test with NVDA/VoiceOver)
- [ ] Color contrast validation with tools like Colour Contrast Analyser
- [ ] High contrast mode testing
- [ ] Zoom testing up to 200%
- [ ] Reduced motion preference testing

### Browser Testing
- **Chrome**: 90+ (primary development target)
- **Firefox**: 88+ (full feature support)
- **Safari**: 14+ (WebKit compatibility)
- **Edge**: 90+ (Chromium-based)

## 🤝 Contributing

We welcome contributions that maintain our accessibility standards and cyberpunk aesthetic!

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** the design system guidelines in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
4. **Test** accessibility compliance:
   - Run automated tests: `pnpm run test:a11y`
   - Manual keyboard testing
   - Screen reader testing
5. **Add tests** for new functionality
6. **Commit** with conventional commits: `feat: add amazing feature`
7. **Submit** a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Accessibility**: WCAG 2.1 AA compliance required
- **Testing**: Unit tests for new features
- **Documentation**: Update relevant docs

### Design Contributions
- Follow the cyberpunk terminal aesthetic
- Maintain WCAG 2.1 AA contrast ratios
- Test with screen readers
- Ensure keyboard accessibility
- Document new components in design system

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Accessibility**: Built with guidance from WCAG 2.1 guidelines
- **Design**: Inspired by cyberpunk terminal aesthetics
- **Community**: Thanks to all contributors and accessibility advocates
- **Tools**: Powered by Vue 3, Tailwind CSS, and modern web standards

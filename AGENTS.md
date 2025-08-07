AGENTS

Build/Lint/Test
- Setup: pnpm run install:all; pnpm run db:migrate
- Dev: pnpm run dev (backend Bun on 3000, frontend Vite on 5173)
- Build: pnpm run build
- Lint: pnpm run lint; frontend types: cd frontend && pnpm run type-check
- Test (all): pnpm run test
- Test backend single: cd backend && bun test path/to.test.ts -t "name"
- Test frontend unit single: cd frontend && pnpm vitest path/to.test.ts -t "name"
- Test frontend e2e: cd frontend && pnpm playwright test [spec|--ui|--debug]

MCP
- Playwright MCP is configured for Cursor in `.cursor/mcp.json`.
- Cursor will launch `npx mcp-server-playwright` automatically.
- Set `PLAYWRIGHT_BROWSERS_PATH=0` to download browsers in project.

Code Style
- TypeScript strict, prefer explicit types; shared types in shared/types; zod for validation
- Imports: path-based within package; keep side-effect-free; group: std, external, internal; no unused imports
- Formatting: Prettier via eslint configs; 2-space indent; single quotes; semicolons avoided per existing code
- Vue: Composition API, <script setup>, Pinia stores; Tailwind utility-first; shadcn-vue components
- Naming: camelCase vars/functions, PascalCase components/types, kebab-case files; constants UPPER_SNAKE
- Errors: use backend/src/utils/errors.ts; return typed errors; never leak secrets; handle API errors with safe messages
- API: Frontend uses frontend/src/lib/api/*; never call backend directly; use query keys in frontend/src/lib/api/queryKeys.ts
- Testing: Vitest + Vue Test Utils for unit; Playwright for e2e; Bun test for backend; keep tests isolated and deterministic
- Commits/PRs: trunk-based, small (<500 LOC), atomic; add task file under .claude/working/tasks when planning
- Security: do not log tokens; backend requires GITHUB_TOKEN; frontend uses VITE_API_BASE_URL env

Notes
- No .cursor or Copilot instruction files present
- If unsure, mirror patterns in neighboring files and scripts
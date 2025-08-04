Title: Add PAT Settings Userflow and "How to" Guide

Summary
Design and implement the Personal Access Token (PAT) management UX in Settings, aligned with current backend endpoints, and add a comprehensive "How to" guide explaining what PATs are, when to use them, where to create them, and which scopes are required.

Status
- Backend endpoints implemented and reviewed.
- Frontend modal exists with basic flows.
- This task adds the Settings card and an integrated "How to" guide, and ensures API bindings align.

Objectives
1) Implement Settings view PAT card:
   - States: Not configured, Connected (valid), Needs attention (invalid).
   - Actions: Connect/Rotate token (opens modal), Validate now, Remove.
2) Integrate “How to add a GitHub PAT” guide:
   - Present in Settings card (link opens modal with guide expanded).
   - Present inside GitHubSettingsModal as collapsible, with full content.
3) Confirm frontend API bindings with backend:
   - POST /api/github/pat/store, GET /api/github/pat/validate, DELETE /api/github/pat/remove.
4) Optional backend enhancement (if needed): Accept fine‑grained token prefix (github_pat_) in addition to ghp_.

Backend Endpoints (confirmed)
- POST /api/github/pat/store
  - Body: { pat: string }, requires "ghp_" prefix currently.
  - Validates with GitHub then encrypts and stores.
  - Success: { success: true, message }
  - 400: { error, details? }, 500: { error, message }
- GET /api/github/pat/validate
  - No token: { valid: false, message: 'No Personal Access Token stored' }
  - Valid token: { valid: true, pat_user: { login, id, name } }
  - Invalid token: { valid: false, message, error? }
- DELETE /api/github/pat/remove
  - Success: { success: true, message }, 500: { error, message }

UI/UX Deliverables

A) Settings view card (GitHub Personal Access Token)
- Use shadcn-vue components already in repo: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, Separator.
- Not configured:
  - Badge (secondary): Not configured.
  - Copy: “Connect a GitHub PAT to access private organizations and repositories. Your token is encrypted and never displayed.”
  - Actions: [Connect with PAT] (Button primary), [How to add a GitHub PAT] (link/button that opens modal with guide expanded).
- Connected (valid):
  - Badge (success): Connected.
  - Show PAT user login and optional name.
  - Actions: [Rotate token] (Button default/primary), [Validate now] (Button outline), [Remove] (Button destructive).
  - Small link: [Review scopes] opens modal guide.
- Needs attention (invalid):
  - Badge (destructive or warning style): Needs attention.
  - Show message from validate response.
  - Actions: [Rotate token], [Remove], [How to add a GitHub PAT].

B) GitHubSettingsModal enhancements
- Keep existing Dialog, Input, Label components (shadcn-vue based) and Terminal theme wrappers.
- Add a collapsible “How to add a GitHub PAT” under the input (default collapsed) implemented with a simple toggle or future Accordion.
- When opened via Settings card “How to” link, auto-expand the guide via prop: autoExpandHowTo.
- Maintain behaviors: validation, storing/removing, success banners, auto-close after 2s.

“How to” Guide Content (copy)
- What is a GitHub Personal Access Token?
  A PAT is a string that acts like a password for your GitHub account in apps and scripts. PR Tracker uses a PAT to access private organizations and repositories and to improve reliability when OAuth scopes are insufficient or rate limits are hit.
- When should I add a PAT?
  - You need to see/sync private orgs and repositories.
  - Organization lists are incomplete.
  - You frequently hit GitHub API rate limits.
- Where do I create a PAT?
  - Create/manage: https://github.com/settings/tokens
  - Choose “Fine‑grained tokens” to restrict to specific repos/orgs or “Classic tokens” for a simpler setup.
- Required scopes
  - repo: read private repositories.
  - read:org: list org memberships and access org repositories.
  Fine‑grained tokens: ensure repository access and organization permissions match your needs. Classic tokens: “repo” includes private repo read; add “read:org” explicitly.
- Security and storage
  - Your token is encrypted at rest and never displayed again.
  - You can remove your PAT at any time in Settings.
  - Treat your PAT like a password.
- Troubleshooting
  - Invalid format: tokens should start with ghp_ (classic). Fine‑grained tokens often begin with github_pat_ and are currently rejected by validation. If your org requires fine‑grained tokens, use a classic token for now or request support to extend accepted formats.
  - Unable to authenticate: ensure token is active, has required scopes, and isn’t expired/revoked.
  - Orgs missing: confirm read:org scope and active org membership; fine‑grained tokens require explicit org access.
  - Private repos missing: confirm repo scope or repo selection in fine‑grained configuration.
- Quick checklist before saving
  - Token starts with ghp_.
  - Scopes include repo and read:org.
  - Fine‑grained: confirm repo+org permissions cover your needs.

Frontend Tasks
- API bindings (src/lib/api/github.ts):
  - pat.store(pat: string): POST /api/github/pat/store
  - pat.validate(): GET /api/github/pat/validate
  - pat.remove(): DELETE /api/github/pat/remove
- Settings view (src/views/Settings.vue):
  - Add GitHub PAT card with shadcn components:
    - Card + CardHeader/CardTitle/CardDescription for section.
    - CardContent shows status using Badge and any details.
    - CardFooter holds Buttons for actions (primary/outline/destructive as specified).
    - Separator for visual grouping where needed.
  - Wire “Connect with PAT” to open GitHubSettingsModal.
  - Wire “How to add a GitHub PAT” link to open modal and expand guide via prop autoExpandHowTo.
- GitHubSettingsModal.vue:
  - Add collapsible “How to” section and prop autoExpandHowTo to auto‑expand when opened from Settings card.
  - Continue using Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label.
  - Keep existing short bullet guidance near the input.
- Inline CTA (optional):
  - In AddRepositoryPickerDialog and places fetching orgs/repos, show a hint with “Add PAT” button on missing access errors, linking to modal.

Backend Tasks (optional)
- Consider accepting fine‑grained token prefix github_pat_ in /pat/store if needed.
- Enhance /pat/validate to additionally return granted scopes by reading response headers from a GET /user call.

Testing
- Unit:
  - API bindings handle 200/400/500 and bubble messages.
  - Modal shows guide, validates client checks, handles success/error states.
- E2E (frontend/e2e/specs/settings.spec.ts):
  - Not configured → open How to → connect with valid PAT → Connected state shows login.
  - Invalid format shows error.
  - Invalid PAT shows error.
  - Remove → Not configured.
  - Validate now updates state.
- Backend integration:
  - /pat/store validates and encrypts.
  - /pat/validate returns expected shapes for no token/valid/invalid cases.
  - /pat/remove clears token.

Acceptance Criteria
- Users can understand what PATs are, when to use them, where to create them, and which scopes are required from within the app.
- Users can connect, validate, rotate, and remove a PAT from Settings.
- The modal’s guide is accessible via Settings and self‑contained within the modal.
- API flows match the existing backend routes and error shapes.

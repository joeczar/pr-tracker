/**
 * Centralized query keys for @tanstack/vue-query
 * Use functions to include parameters so keys are stable and typed.
 */
export const qk = {
  repositories: {
    list: () => ['repositories', 'list'] as const,
    byId: (id: number) => ['repositories', 'byId', id] as const,
  },
  prs: {
    byRepo: (repoId: number, params?: { state?: 'open' | 'closed' | 'merged'; limit?: number; offset?: number }) =>
      ['prs', 'byRepo', repoId, params || {}] as const,
    stats: (repoId: number) => ['prs', 'stats', repoId] as const,
    metrics: (repoId: number, days: number) => ['prs', 'metrics', repoId, days] as const,
    byId: (id: number) => ['prs', 'byId', id] as const,
  },
  reviews: {
    byPr: (prId: number) => ['reviews', 'byPr', prId] as const,
    metrics: (repoId: number, days: number) => ['reviews', 'metrics', repoId, days] as const,
    byId: (id: number) => ['reviews', 'byId', id] as const,
  },
  analytics: {
    trends: (repoId: number, days: number) => ['analytics', 'trends', repoId, days] as const,
    compare: (repoIds: number[], days?: number) => ['analytics', 'compare', { repoIds: [...repoIds].sort(), days }] as const,
  },
  sync: {
    history: (repoId: number, limit: number) => ['sync', 'history', repoId, limit] as const,
    job: (jobId: string) => ['sync', 'job', jobId] as const,
    rateLimit: () => ['sync', 'rateLimit'] as const,
  },
  github: {
    test: () => ['github', 'test'] as const,
    rateLimit: () => ['github', 'rateLimit'] as const,
    repositories: (params: {
      page?: number;
      per_page?: number;
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      affiliation?: string;
      visibility?: 'all' | 'public' | 'private';
    }) => ['github', 'repositories', params] as const,
    repo: (owner: string, name: string) => ['github', 'repo', owner, name] as const,
    pulls: (owner: string, name: string, params?: { state?: 'open' | 'closed' | 'all'; page?: number; per_page?: number }) =>
      ['github', 'pulls', owner, name, params || {}] as const,
    pull: (owner: string, name: string, number: number) => ['github', 'pull', owner, name, number] as const,
    pullFiles: (owner: string, name: string, number: number) => ['github', 'pullFiles', owner, name, number] as const,
  },
} as const;

export type QueryKey = ReturnType<
  | typeof qk.repositories.list
  | typeof qk.repositories.byId
  | typeof qk.prs.byRepo
  | typeof qk.prs.stats
  | typeof qk.prs.metrics
  | typeof qk.prs.byId
  | typeof qk.reviews.byPr
  | typeof qk.reviews.metrics
  | typeof qk.reviews.byId
  | typeof qk.analytics.trends
  | typeof qk.analytics.compare
  | typeof qk.sync.history
  | typeof qk.sync.job
  | typeof qk.sync.rateLimit
  | typeof qk.github.test
  | typeof qk.github.rateLimit
  | typeof qk.github.repositories
  | typeof qk.github.repo
  | typeof qk.github.pulls
  | typeof qk.github.pull
  | typeof qk.github.pullFiles
>;

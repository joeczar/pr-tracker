import { http } from './http';

export interface RecentPR {
  id: number | string;
  title: string;
  state: 'open' | 'merged' | 'closed' | 'draft' | 'review';
  comments: number;
  updatedAt: string;
}

export interface RepositoryStats {
  prs: number;
  avgCommentsPerPR: number;
  changeRequestRate: number; // percent 0-100
  lastSync: string;
}

export type Repository = {
  id: number;
  owner: string;
  name: string;
  full_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  stats?: RepositoryStats;
  recent?: RecentPR[];
};

export const repositoriesApi = {
  list: () => http.get('/api/repositories') as Promise<Repository[]>,

  // Enhanced list that includes stats and recent PRs
  listWithDetails: async (): Promise<Repository[]> => {
    const repositories = await http.get('/api/repositories') as Repository[];

    // Fetch additional data for each repository
    const enrichedRepos = await Promise.all(
      repositories.map(async (repo) => {
        try {
          // Fetch stats, metrics, and recent PRs in parallel
          const [statsResponse, metricsResponse, recentPRsResponse] = await Promise.all([
            http.get(`/api/pull-requests/repository/${repo.id}/stats`).catch(() => null),
            http.get(`/api/pull-requests/repository/${repo.id}/metrics?days=30`).catch(() => null),
            http.get(`/api/pull-requests/repository/${repo.id}?limit=5`).catch(() => [])
          ]);

          // Transform stats to match RepositoryStats interface
          const stats: RepositoryStats | undefined = statsResponse ? {
            prs: statsResponse.total || 0,
            avgCommentsPerPR: metricsResponse?.avg_comments_per_pr || 0,
            changeRequestRate: metricsResponse ? Math.round((metricsResponse.avg_reviews_per_pr || 0) * 10) : 0, // Rough approximation
            lastSync: new Date().toISOString().split('T')[0] // TODO: Get actual sync time from sync history
          } : {
            // Provide default stats when no data is available (likely needs sync)
            prs: 0,
            avgCommentsPerPR: 0,
            changeRequestRate: 0,
            lastSync: 'Never'
          };

          // Transform recent PRs to match RecentPR interface
          const recent: RecentPR[] = Array.isArray(recentPRsResponse)
            ? recentPRsResponse.slice(0, 3).map((pr: any) => ({
                id: pr.number || pr.id,
                title: pr.title || 'Untitled PR',
                state: pr.state === 'merged' ? 'merged' :
                       pr.state === 'closed' ? 'closed' : 'open',
                comments: 0, // Individual PR comment counts would need separate API calls
                updatedAt: pr.updated_at ? new Date(pr.updated_at).toLocaleDateString() : 'Unknown'
              }))
            : [];

          return {
            ...repo,
            stats,
            recent: recent.length > 0 ? recent : undefined
          };
        } catch (error) {
          console.warn(`Failed to fetch details for repository ${repo.id}:`, error);
          return repo; // Return basic repo data if enrichment fails
        }
      })
    );

    return enrichedRepos;
  },

  create: (input: { owner: string; name: string }) =>
    http.post('/api/repositories', input) as Promise<Repository>,
  get: (id: number) => http.get(`/api/repositories/${id}`) as Promise<Repository>,
  remove: (id: number) => http.delete(`/api/repositories/${id}`) as Promise<{ success: true }>,
};

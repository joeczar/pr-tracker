import { http } from './http';

export type PullRequest = {
  id: number;
  repository_id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author_login?: string;
  created_at?: string;
  updated_at?: string;
  merged_at?: string | null;
};

export type PullRequestStats = {
  total: number;
  open: number;
  merged: number;
  closed: number;
  merge_rate: number;
};

export const pullRequestsApi = {
  listByRepo: (
    repositoryId: number,
    query?: { state?: 'open' | 'closed' | 'merged'; limit?: number; offset?: number }
  ) => {
    const params = new URLSearchParams();
    if (query?.state) params.set('state', query.state);
    if (query?.limit != null) params.set('limit', String(query.limit));
    if (query?.offset != null) params.set('offset', String(query.offset));
    const qs = params.toString();
    return http.get(
      `/api/pull-requests/repository/${repositoryId}${qs ? `?${qs}` : ''}`
    ) as Promise<PullRequest[]>;
  },

  metricsByRepo: (repositoryId: number, days?: number) => {
    const qs = days != null ? `?days=${days}` : '';
    return http.get(
      `/api/pull-requests/repository/${repositoryId}/metrics${qs}`
    ) as Promise<any>;
  },

  get: (id: number) => http.get(`/api/pull-requests/${id}`) as Promise<PullRequest>,

  syncRepo: (repositoryId: number) =>
    http.post(`/api/pull-requests/repository/${repositoryId}/sync`) as Promise<any>,

  statsByRepo: (repositoryId: number) =>
    http.get(`/api/pull-requests/repository/${repositoryId}/stats`) as Promise<PullRequestStats>,

  authorsByRepo: (repositoryId: number, state?: 'open' | 'closed' | 'merged' | 'all') => {
    const params = new URLSearchParams()
    if (state && state !== 'all') params.set('state', state)
    const qs = params.toString()
    return http.get(`/api/pull-requests/repository/${repositoryId}/authors${qs ? `?${qs}` : ''}`) as Promise<{ authors: string[] }>
  },
};

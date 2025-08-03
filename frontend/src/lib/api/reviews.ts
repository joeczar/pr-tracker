import { http } from './http';

export type Review = {
  id: number;
  pull_request_id: number;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  author_login?: string;
  submitted_at?: string;
  body?: string | null;
};

export const reviewsApi = {
  listByPullRequest: (pullRequestId: number) =>
    http.get(`/api/reviews/pull-request/${pullRequestId}`) as Promise<Review[]>,

  metricsByRepo: (repositoryId: number, days?: number) => {
    const qs = days != null ? `?days=${days}` : '';
    return http.get(`/api/reviews/repository/${repositoryId}/metrics${qs}`) as Promise<any>;
  },

  get: (id: number) => http.get(`/api/reviews/${id}`) as Promise<Review>,

  syncForPullRequest: (pullRequestId: number) =>
    http.post(`/api/reviews/pull-request/${pullRequestId}/sync`) as Promise<any>,
};

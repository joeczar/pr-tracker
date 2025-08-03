import { http } from './http';

export type TrendPoint = {
  date: string;
  value: number;
  label?: string;
};

export type TrendsResponse = {
  repository_id: number;
  series: { key: string; points: TrendPoint[] }[];
};

export type CompareRequest = { repository_ids: number[]; days?: number };
export type CompareResponse = Array<{
  repository_id: number;
  metrics: Record<string, number>;
}>;

export const analyticsApi = {
  trendsByRepo: (repositoryId: number, days?: number) => {
    const qs = days != null ? `?days=${days}` : '';
    return http.get(
      `/api/analytics/repository/${repositoryId}/trends${qs}`
    ) as Promise<TrendsResponse>;
  },

  compare: (input: CompareRequest) =>
    http.post('/api/analytics/compare', input) as Promise<CompareResponse>,
};

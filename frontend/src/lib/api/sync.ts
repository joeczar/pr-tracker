import { http } from './http';

export type QueueSyncResponse = { success: boolean; job_id: string };
export type SyncJobStatus =
  | { job_id: string; status: 'queued' | 'running' | 'completed' | 'failed'; started_at?: string; finished_at?: string; message?: string }
  | { error: string };

export type RepoSyncHistoryItem = {
  id: string;
  repository_id: number;
  type: 'full' | 'incremental';
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at?: string;
  finished_at?: string;
  message?: string | null;
};

export const syncApi = {
  queueRepoSync: (repositoryId: number, type?: 'full' | 'incremental') =>
    http.post(`/api/sync/repository/${repositoryId}`, type ? { type } : undefined) as Promise<QueueSyncResponse>,

  jobStatus: (jobId: string) => http.get(`/api/sync/job/${jobId}`) as Promise<SyncJobStatus>,

  repoHistory: (repositoryId: number, limit?: number) => {
    const qs = limit != null ? `?limit=${limit}` : '';
    return http.get(`/api/sync/repository/${repositoryId}/history${qs}`) as Promise<RepoSyncHistoryItem[]>;
  },

  startPeriodic: (interval_minutes: number) =>
    http.post('/api/sync/periodic/start', { interval_minutes }) as Promise<{ success: boolean; message?: string }>,
};

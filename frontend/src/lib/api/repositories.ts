import { http } from './http';

export type Repository = {
  id: number;
  owner: string;
  name: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
};

export const repositoriesApi = {
  list: () => http.get('/api/repositories') as Promise<Repository[]>,
  create: (input: { owner: string; name: string }) =>
    http.post('/api/repositories', input) as Promise<Repository>,
  get: (id: number) => http.get(`/api/repositories/${id}`) as Promise<Repository>,
  remove: (id: number) => http.delete(`/api/repositories/${id}`) as Promise<{ success: true }>,
};

import { http } from './http';

export type GitHubRateLimit = {
  resources: {
    core: { limit: number; remaining: number; reset: number; used: number };
    search?: { limit: number; remaining: number; reset: number; used: number };
    [k: string]: any;
  };
  rate: { limit: number; remaining: number; reset: number; used: number };
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; id: number; avatar_url?: string };
  private: boolean;
  description?: string | null;
  html_url: string;
  forks_count?: number;
  stargazers_count?: number;
  watchers_count?: number;
  open_issues_count?: number;
  updated_at?: string;
};

export type GitHubOrganization = {
  login: string;
  id: number;
  avatar_url?: string;
};

export type GitHubPull = {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user?: { login: string; id: number; avatar_url?: string };
  created_at?: string;
  updated_at?: string;
  merged_at?: string | null;
};

export type GitHubPullFile = {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
  raw_url?: string;
  blob_url?: string;
};


export const githubApi = {
  test: () => http.get('/api/github/test') as Promise<{ success: boolean; user?: any }>,

  rateLimit: () => http.get('/api/github/rate-limit') as Promise<GitHubRateLimit>,

  // Personal Access Token management
  pat: {
    store: (pat: string) => http.post('/api/github/pat/store', { pat }) as Promise<{ success: boolean; message: string }>,
    validate: () => http.get('/api/github/pat/validate') as Promise<{ valid: boolean; message?: string; pat_user?: { login: string; id: number; name: string | null } }>,
    remove: () => http.delete('/api/github/pat/remove') as Promise<{ success: boolean; message: string }>
  },

  getRepo: (owner: string, repo: string) =>
    http.get(`/api/github/repos/${owner}/${repo}`) as Promise<GitHubRepo>,

  listPulls: (
    owner: string,
    repo: string,
    opts?: { state?: 'open' | 'closed' | 'all'; page?: number; per_page?: number }
  ) => {
    const params = new URLSearchParams();
    if (opts?.state) params.set('state', opts.state);
    if (opts?.page != null) params.set('page', String(opts.page));
    if (opts?.per_page != null) params.set('per_page', String(opts.per_page));
    const qs = params.toString();
    return http.get(
      `/api/github/repos/${owner}/${repo}/pulls${qs ? `?${qs}` : ''}`
    ) as Promise<GitHubPull[]>;
  },

  getPull: (owner: string, repo: string, number: number) =>
    http.get(`/api/github/repos/${owner}/${repo}/pulls/${number}`) as Promise<GitHubPull>,

  getPullFiles: (owner: string, repo: string, number: number) =>
    http.get(`/api/github/repos/${owner}/${repo}/pulls/${number}/files`) as Promise<GitHubPullFile[]>,

  listOrganizations: () =>
    http.get('/api/github/organizations') as Promise<{ organizations: GitHubOrganization[] }>,

  listOrgRepos: (
    org: string,
    opts?: {
      page?: number;
      per_page?: number;
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member';
    }
  ) => {
    const params = new URLSearchParams();
    if (opts?.page != null) params.set('page', String(opts.page));
    if (opts?.per_page != null) params.set('per_page', String(opts.per_page));
    if (opts?.sort) params.set('sort', opts.sort);
    if (opts?.direction) params.set('direction', opts.direction);
    if (opts?.type) params.set('type', opts.type);
    const qs = params.toString();
    return http.get(
      `/api/github/orgs/${org}/repos${qs ? `?${qs}` : ''}`
    ) as Promise<{
      repositories: GitHubRepo[];
      pagination?: { page: number; per_page: number; has_next_page?: boolean };
    }>;
  },

  listAccessibleRepositories: (opts?: {
    page?: number;
    per_page?: number;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    affiliation?: string;
    visibility?: 'all' | 'public' | 'private';
  }) => {
    const params = new URLSearchParams();
    if (opts?.page != null) params.set('page', String(opts.page));
    if (opts?.per_page != null) params.set('per_page', String(opts.per_page));
    if (opts?.sort) params.set('sort', opts.sort);
    if (opts?.direction) params.set('direction', opts.direction);
    if (opts?.affiliation) params.set('affiliation', opts.affiliation);
    if (opts?.visibility) params.set('visibility', opts.visibility);
    const qs = params.toString();
    return http.get(`/api/github/repositories${qs ? `?${qs}` : ''}`) as Promise<{
      repositories: GitHubRepo[];
      pagination?: { page: number; per_page: number; total?: number; next_page?: number | null };
    }>;
  },
};

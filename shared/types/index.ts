// Database entity types
export interface Repository {
  id: number
  github_id: number
  name: string
  full_name: string
  created_at: string
}

export interface PullRequest {
  id: number
  github_id: number
  repository_id: number
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  created_at: string
  merged_at: string | null
  lines_added: number
  lines_deleted: number
  files_changed: number
  commits_count: number
}

export interface Review {
  id: number
  github_id: number
  pull_request_id: number
  reviewer_login: string
  state: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'
  submitted_at: string
  comments_count: number
}

// API request/response types
export interface AddRepositoryRequest {
  owner: string
  name: string
}

export interface PullRequestFilters {
  state?: 'open' | 'closed' | 'merged'
  limit?: number
  offset?: number
}

export interface RepositoryMetrics {
  repository_id: number
  total_prs: number
  avg_merge_time_hours: number
  avg_lines_added: number
  avg_lines_deleted: number
  avg_files_changed: number
  avg_commits_per_pr: number
  avg_reviews_per_pr: number
  avg_comments_per_pr: number
  period_days: number
}

export interface PullRequestTrend {
  date: string
  count: number
  avg_size: number
  avg_merge_time: number
}

export interface ReviewMetrics {
  total_reviews: number
  avg_time_to_first_review_hours: number
  review_participation_rate: number
  most_active_reviewers: Array<{
    login: string
    review_count: number
  }>
}

// GitHub API response types (simplified)
export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  owner: GitHubUser
  private: boolean
  created_at: string
  updated_at: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  created_at: string
  merged_at: string | null
  user: GitHubUser
  additions: number
  deletions: number
  changed_files: number
  commits: number
}

// Error types
export interface ApiError {
  error: string
  message?: string
  details?: unknown
}

// Sync operation types
export interface SyncResult {
  success: boolean
  processed: number
  created: number
  updated: number
  errors: string[]
}

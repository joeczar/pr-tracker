import { DatabaseManager } from '../db/database.js'
import { GitHubService } from './github.js'
import { RepositoryService } from './repository.js'
import type { PullRequest, PullRequestFilters, RepositoryMetrics, SyncResult } from '@shared/types/index.js'

export class PullRequestService {
  private db = DatabaseManager.getInstance().getDatabase()
  private githubService = new GitHubService()
  private repositoryService = new RepositoryService()

  async getPullRequestsByRepository(
    repositoryId: number, 
    filters: PullRequestFilters = {}
  ): Promise<PullRequest[]> {
    let query = `SELECT * FROM pull_requests WHERE repository_id = ?`
    const params: unknown[] = [repositoryId]

    if (filters.state) {
      query += ` AND state = ?`
      params.push(filters.state)
    }

    query += ` ORDER BY created_at DESC`

    if (filters.limit) {
      query += ` LIMIT ?`
      params.push(filters.limit)
    }

    if (filters.offset) {
      query += ` OFFSET ?`
      params.push(filters.offset)
    }

    const stmt = this.db.prepare(query)
    return stmt.all(...params) as PullRequest[]
  }

  async getPullRequestById(id: number): Promise<PullRequest | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM pull_requests WHERE id = ?
    `)
    
    const result = stmt.get(id) as PullRequest | undefined
    return result || null
  }

  async getRepositoryMetrics(repositoryId: number, days: number = 30): Promise<RepositoryMetrics> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_prs,
        AVG(
          CASE 
            WHEN merged_at IS NOT NULL 
            THEN (julianday(merged_at) - julianday(created_at)) * 24 
            ELSE NULL 
          END
        ) as avg_merge_time_hours,
        AVG(lines_added) as avg_lines_added,
        AVG(lines_deleted) as avg_lines_deleted,
        AVG(files_changed) as avg_files_changed,
        AVG(commits_count) as avg_commits_per_pr
      FROM pull_requests 
      WHERE repository_id = ? 
        AND created_at >= ?
    `)
    
    const result = stmt.get(repositoryId, cutoffDate.toISOString()) as any

    // Get review metrics
    const reviewStmt = this.db.prepare(`
      SELECT
        AVG(review_count) as avg_reviews_per_pr,
        AVG(comments_count) as avg_comments_per_pr
      FROM (
        SELECT
          pr.id,
          COUNT(r.id) as review_count,
          COALESCE(SUM(r.comments_count), 0) as comments_count
        FROM pull_requests pr
        LEFT JOIN reviews r ON pr.id = r.pull_request_id
        WHERE pr.repository_id = ?
          AND pr.created_at >= ?
        GROUP BY pr.id
      )
    `)

    const reviewResult = reviewStmt.get(repositoryId, cutoffDate.toISOString()) as any

    return {
      repository_id: repositoryId,
      total_prs: result.total_prs || 0,
      avg_merge_time_hours: result.avg_merge_time_hours || 0,
      avg_lines_added: result.avg_lines_added || 0,
      avg_lines_deleted: result.avg_lines_deleted || 0,
      avg_files_changed: result.avg_files_changed || 0,
      avg_commits_per_pr: result.avg_commits_per_pr || 0,
      avg_reviews_per_pr: reviewResult.avg_reviews_per_pr || 0,
      avg_comments_per_pr: reviewResult.avg_comments_per_pr || 0,
      period_days: days,
    }
  }

  async syncPullRequests(repositoryId: number): Promise<SyncResult> {
    const repository = await this.repositoryService.getRepositoryById(repositoryId)
    if (!repository) {
      throw new Error('Repository not found')
    }

    const [owner, repo] = repository.full_name.split('/')
    const result: SyncResult = {
      success: true,
      processed: 0,
      created: 0,
      updated: 0,
      errors: []
    }

    try {
      // Fetch PRs from GitHub
      const githubPRs = await this.githubService.getPullRequests(owner, repo, {
        state: 'all',
        per_page: 100
      })

      for (const githubPR of githubPRs) {
        try {
          result.processed++

          // Check if PR already exists
          const existingPR = await this.getPullRequestByGitHubId(githubPR.id)

          // Determine the correct state
          const prState: 'open' | 'closed' | 'merged' =
            githubPR.state === 'closed' && githubPR.merged_at ? 'merged' : githubPR.state as 'open' | 'closed'

          if (existingPR) {
            // Update existing PR
            await this.updatePullRequest(existingPR.id, {
              state: prState,
              merged_at: githubPR.merged_at,
              lines_added: (githubPR as any).additions || 0,
              lines_deleted: (githubPR as any).deletions || 0,
              files_changed: (githubPR as any).changed_files || 0,
              commits_count: (githubPR as any).commits || 0,
            })
            result.updated++
          } else {
            // Create new PR
            await this.createPullRequest({
              github_id: githubPR.id,
              repository_id: repositoryId,
              number: githubPR.number,
              title: githubPR.title,
              state: prState,
              created_at: githubPR.created_at,
              merged_at: githubPR.merged_at,
              lines_added: (githubPR as any).additions || 0,
              lines_deleted: (githubPR as any).deletions || 0,
              files_changed: (githubPR as any).changed_files || 0,
              commits_count: (githubPR as any).commits || 0,
            })
            result.created++
          }
        } catch (error) {
          result.errors.push(`Failed to sync PR #${githubPR.number}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      result.success = false
      result.errors.push(`Failed to fetch PRs from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private async getPullRequestByGitHubId(githubId: number): Promise<PullRequest | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM pull_requests WHERE github_id = ?
    `)
    
    const result = stmt.get(githubId) as PullRequest | undefined
    return result || null
  }

  private async createPullRequest(data: Omit<PullRequest, 'id'>): Promise<PullRequest> {
    const stmt = this.db.prepare(`
      INSERT INTO pull_requests (
        github_id, repository_id, number, title, state,
        created_at, merged_at, lines_added, lines_deleted,
        files_changed, commits_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      data.github_id,
      data.repository_id,
      data.number,
      data.title,
      data.state,
      data.created_at,
      data.merged_at,
      data.lines_added,
      data.lines_deleted,
      data.files_changed,
      data.commits_count
    )

    const createdPR = await this.getPullRequestById(result.lastInsertRowid as number)
    if (!createdPR) {
      throw new Error('Failed to create pull request')
    }
    return createdPR
  }

  private async updatePullRequest(id: number, updates: Partial<PullRequest>): Promise<PullRequest> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)

    const stmt = this.db.prepare(`
      UPDATE pull_requests
      SET ${setClause}
      WHERE id = ?
    `)

    stmt.run(...values, id)
    const updatedPR = await this.getPullRequestById(id)
    if (!updatedPR) {
      throw new Error('Failed to update pull request')
    }
    return updatedPR
  }
}

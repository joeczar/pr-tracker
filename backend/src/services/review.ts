import { DatabaseManager } from '../db/database.js'
import { GitHubService } from './github.js'
import { PullRequestService } from './pull-request.js'
import type { Review, ReviewMetrics } from '@shared/types/index.js'

export class ReviewService {
  private db = DatabaseManager.getInstance().getDatabase()
  private githubService = new GitHubService()
  private pullRequestService = new PullRequestService()

  async getReviewsByPullRequest(pullRequestId: number): Promise<Review[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews 
      WHERE pull_request_id = ? 
      ORDER BY submitted_at DESC
    `)
    
    return stmt.all(pullRequestId) as Review[]
  }

  async getReviewById(id: number): Promise<Review | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews WHERE id = ?
    `)
    
    const result = stmt.get(id) as Review | undefined
    return result || null
  }

  async getReviewMetrics(repositoryId: number, days: number = 30): Promise<ReviewMetrics> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    // Get total reviews and average time to first review
    const reviewStatsStmt = this.db.prepare(`
      SELECT 
        COUNT(r.id) as total_reviews,
        AVG(
          (julianday(r.submitted_at) - julianday(pr.created_at)) * 24
        ) as avg_time_to_first_review_hours
      FROM reviews r
      JOIN pull_requests pr ON r.pull_request_id = pr.id
      WHERE pr.repository_id = ? 
        AND r.submitted_at >= ?
        AND r.id = (
          SELECT MIN(r2.id) 
          FROM reviews r2 
          WHERE r2.pull_request_id = r.pull_request_id
        )
    `)
    
    const reviewStats = reviewStatsStmt.get(repositoryId, cutoffDate.toISOString()) as any
    
    // Get review participation rate
    const participationStmt = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT pr.id) as total_prs,
        COUNT(DISTINCT r.pull_request_id) as reviewed_prs
      FROM pull_requests pr
      LEFT JOIN reviews r ON pr.id = r.pull_request_id
      WHERE pr.repository_id = ? 
        AND pr.created_at >= ?
    `)
    
    const participation = participationStmt.get(repositoryId, cutoffDate.toISOString()) as any
    
    // Get most active reviewers
    const activeReviewersStmt = this.db.prepare(`
      SELECT 
        r.reviewer_login as login,
        COUNT(r.id) as review_count
      FROM reviews r
      JOIN pull_requests pr ON r.pull_request_id = pr.id
      WHERE pr.repository_id = ? 
        AND r.submitted_at >= ?
      GROUP BY r.reviewer_login
      ORDER BY review_count DESC
      LIMIT 5
    `)
    
    const activeReviewers = activeReviewersStmt.all(repositoryId, cutoffDate.toISOString()) as Array<{
      login: string
      review_count: number
    }>
    
    const participationRate = participation.total_prs > 0 
      ? (participation.reviewed_prs / participation.total_prs) * 100 
      : 0
    
    return {
      total_reviews: reviewStats.total_reviews || 0,
      avg_time_to_first_review_hours: reviewStats.avg_time_to_first_review_hours || 0,
      review_participation_rate: participationRate,
      most_active_reviewers: activeReviewers
    }
  }

  async syncReviewsForPullRequest(pullRequestId: number): Promise<{
    created: number
    updated: number
    errors: string[]
  }> {
    const pullRequest = await this.pullRequestService.getPullRequestById(pullRequestId)
    if (!pullRequest) {
      throw new Error('Pull request not found')
    }

    // Get repository info to extract owner/repo
    const repoStmt = this.db.prepare(`
      SELECT full_name FROM repositories WHERE id = ?
    `)
    const repo = repoStmt.get(pullRequest.repository_id) as { full_name: string } | undefined
    
    if (!repo) {
      throw new Error('Repository not found')
    }

    const [owner, repoName] = repo.full_name.split('/')
    const result = { created: 0, updated: 0, errors: [] as string[] }

    try {
      // Get PR details including reviews
      const prDetails = await this.githubService.getPullRequestDetails(
        owner, 
        repoName, 
        pullRequest.number
      )

      for (const githubReview of prDetails.reviews) {
        try {
          // Skip reviews without a submitted date (draft reviews)
          if (!githubReview.submitted_at) {
            continue
          }

          const existingReview = await this.getReviewByGitHubId(githubReview.id)
          
          if (existingReview) {
            // Update existing review
            await this.updateReview(existingReview.id, {
              state: githubReview.state as Review['state'],
              submitted_at: githubReview.submitted_at,
              comments_count: await this.getReviewCommentsCount(
                owner, 
                repoName, 
                pullRequest.number, 
                githubReview.id
              )
            })
            result.updated++
          } else {
            // Create new review
            await this.createReview({
              github_id: githubReview.id,
              pull_request_id: pullRequestId,
              reviewer_login: githubReview.user?.login || 'unknown',
              state: githubReview.state as Review['state'],
              submitted_at: githubReview.submitted_at,
              comments_count: await this.getReviewCommentsCount(
                owner, 
                repoName, 
                pullRequest.number, 
                githubReview.id
              )
            })
            result.created++
          }
        } catch (error) {
          result.errors.push(`Failed to sync review ${githubReview.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch reviews from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private async getReviewByGitHubId(githubId: number): Promise<Review | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews WHERE github_id = ?
    `)
    
    const result = stmt.get(githubId) as Review | undefined
    return result || null
  }

  private async createReview(data: Omit<Review, 'id'>): Promise<Review> {
    const stmt = this.db.prepare(`
      INSERT INTO reviews (
        github_id, pull_request_id, reviewer_login, 
        state, submitted_at, comments_count
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      data.github_id,
      data.pull_request_id,
      data.reviewer_login,
      data.state,
      data.submitted_at,
      data.comments_count
    )
    
    const createdReview = await this.getReviewById(result.lastInsertRowid as number)
    if (!createdReview) {
      throw new Error('Failed to create review')
    }
    return createdReview
  }

  private async updateReview(id: number, updates: Partial<Review>): Promise<Review> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)

    const stmt = this.db.prepare(`
      UPDATE reviews
      SET ${setClause}
      WHERE id = ?
    `)

    stmt.run(...values, id)
    const updatedReview = await this.getReviewById(id)
    if (!updatedReview) {
      throw new Error('Failed to update review')
    }
    return updatedReview
  }

  private async getReviewCommentsCount(
    owner: string, 
    repo: string, 
    pullNumber: number, 
    reviewId: number
  ): Promise<number> {
    try {
      const comments = await this.githubService.getReviewComments(owner, repo, pullNumber)
      return comments.filter(comment => comment.pull_request_review_id === reviewId).length
    } catch (error) {
      console.warn(`Failed to get review comments count for review ${reviewId}:`, error)
      return 0
    }
  }
}

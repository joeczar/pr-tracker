import { DatabaseManager } from '../db/database.js'
import type { TrendAnalysis, PullRequestTrend } from '@shared/types/index.js'

export class AnalyticsService {
  private db = DatabaseManager.getInstance().getDatabase()

  async getTrendAnalysis(repositoryId: number, days: number = 30): Promise<TrendAnalysis> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get daily trends
    const trends = await this.getDailyTrends(repositoryId, startDate, endDate)
    
    // Calculate trend directions
    const summary = this.calculateTrendSummary(trends)

    return {
      repository_id: repositoryId,
      period_days: days,
      trends,
      summary: {
        total_prs: trends.reduce((sum, trend) => sum + trend.count, 0),
        ...summary
      }
    }
  }

  private async getDailyTrends(
    repositoryId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<PullRequestTrend[]> {
    const stmt = this.db.prepare(`
      SELECT 
        DATE(pr.created_at) as date,
        COUNT(pr.id) as count,
        AVG(pr.lines_added + pr.lines_deleted) as avg_size,
        AVG(
          CASE 
            WHEN pr.merged_at IS NOT NULL 
            THEN (julianday(pr.merged_at) - julianday(pr.created_at)) * 24 
            ELSE NULL 
          END
        ) as avg_merge_time,
        AVG(COALESCE(review_stats.review_count, 0)) as avg_reviews,
        AVG(COALESCE(review_stats.comments_count, 0)) as avg_comments
      FROM pull_requests pr
      LEFT JOIN (
        SELECT 
          pull_request_id,
          COUNT(id) as review_count,
          SUM(comments_count) as comments_count
        FROM reviews
        GROUP BY pull_request_id
      ) review_stats ON pr.id = review_stats.pull_request_id
      WHERE pr.repository_id = ? 
        AND DATE(pr.created_at) >= DATE(?)
        AND DATE(pr.created_at) <= DATE(?)
      GROUP BY DATE(pr.created_at)
      ORDER BY date ASC
    `)

    const results = stmt.all(
      repositoryId, 
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0]
    ) as any[]

    // Fill in missing dates with zero values
    const trends: PullRequestTrend[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const existingData = results.find(r => r.date === dateStr)
      
      trends.push({
        date: dateStr,
        count: existingData?.count || 0,
        avg_size: existingData?.avg_size || 0,
        avg_merge_time: existingData?.avg_merge_time || 0,
        avg_reviews: existingData?.avg_reviews || 0,
        avg_comments: existingData?.avg_comments || 0
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return trends
  }

  private calculateTrendSummary(trends: PullRequestTrend[]): {
    size_trend: 'increasing' | 'decreasing' | 'stable'
    merge_time_trend: 'increasing' | 'decreasing' | 'stable'
    review_engagement_trend: 'increasing' | 'decreasing' | 'stable'
  } {
    if (trends.length < 2) {
      return {
        size_trend: 'stable',
        merge_time_trend: 'stable',
        review_engagement_trend: 'stable'
      }
    }

    // Calculate trends using linear regression slope
    const sizeTrend = this.calculateTrend(trends.map((t, i) => ({ x: i, y: t.avg_size })))
    const mergeTimeTrend = this.calculateTrend(trends.map((t, i) => ({ x: i, y: t.avg_merge_time })))
    const reviewEngagementTrend = this.calculateTrend(trends.map((t, i) => ({ 
      x: i, 
      y: t.avg_reviews + t.avg_comments 
    })))

    return {
      size_trend: this.classifyTrend(sizeTrend),
      merge_time_trend: this.classifyTrend(mergeTimeTrend),
      review_engagement_trend: this.classifyTrend(reviewEngagementTrend)
    }
  }

  private calculateTrend(points: { x: number; y: number }[]): number {
    const n = points.length
    if (n < 2) return 0

    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)

    // Linear regression slope: (n*ΣXY - ΣX*ΣY) / (n*ΣXX - (ΣX)²)
    const numerator = n * sumXY - sumX * sumY
    const denominator = n * sumXX - sumX * sumX

    return denominator === 0 ? 0 : numerator / denominator
  }

  private classifyTrend(slope: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = 0.1 // Adjust this threshold as needed
    
    if (slope > threshold) return 'increasing'
    if (slope < -threshold) return 'decreasing'
    return 'stable'
  }

  async getRepositoryComparison(repositoryIds: number[], days: number = 30): Promise<{
    repositories: Array<{
      repository_id: number
      metrics: {
        avg_pr_size: number
        avg_merge_time: number
        avg_reviews_per_pr: number
        review_participation_rate: number
      }
    }>
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const results = []

    for (const repositoryId of repositoryIds) {
      const stmt = this.db.prepare(`
        SELECT 
          AVG(pr.lines_added + pr.lines_deleted) as avg_pr_size,
          AVG(
            CASE 
              WHEN pr.merged_at IS NOT NULL 
              THEN (julianday(pr.merged_at) - julianday(pr.created_at)) * 24 
              ELSE NULL 
            END
          ) as avg_merge_time,
          AVG(COALESCE(review_stats.review_count, 0)) as avg_reviews_per_pr,
          (COUNT(DISTINCT review_stats.pull_request_id) * 100.0 / COUNT(DISTINCT pr.id)) as review_participation_rate
        FROM pull_requests pr
        LEFT JOIN (
          SELECT 
            pull_request_id,
            COUNT(id) as review_count
          FROM reviews
          GROUP BY pull_request_id
        ) review_stats ON pr.id = review_stats.pull_request_id
        WHERE pr.repository_id = ? 
          AND pr.created_at >= ?
      `)

      const result = stmt.get(repositoryId, cutoffDate.toISOString()) as any

      results.push({
        repository_id: repositoryId,
        metrics: {
          avg_pr_size: result.avg_pr_size || 0,
          avg_merge_time: result.avg_merge_time || 0,
          avg_reviews_per_pr: result.avg_reviews_per_pr || 0,
          review_participation_rate: result.review_participation_rate || 0
        }
      })
    }

    return { repositories: results }
  }
}

import { DatabaseManager } from '../db/database.js'
import { PullRequestService } from './pull-request.js'
import { ReviewService } from './review.js'
import { RepositoryService } from './repository.js'
import { GitHubService } from './github.js'
import type { SyncResult } from '@shared/types/index.js'

interface SyncJob {
  id: string
  repositoryId: number
  type: 'full' | 'incremental'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  error?: string
  result?: SyncResult
}

export class SyncService {
  private db = DatabaseManager.getInstance().getDatabase()
  private pullRequestService = new PullRequestService()
  private reviewService = new ReviewService()
  private repositoryService = new RepositoryService()
  private githubService = new GitHubService()
  
  private activeJobs = new Map<string, SyncJob>()
  private rateLimitInfo = {
    remaining: 5000,
    resetTime: new Date(),
    lastCheck: new Date()
  }

  constructor() {
    // Initialize sync jobs table
    this.initializeSyncJobsTable()
    
    // Start periodic rate limit checking
    this.startRateLimitMonitoring()
  }

  private initializeSyncJobsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_jobs (
        id TEXT PRIMARY KEY,
        repository_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('full', 'incremental')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        started_at DATETIME,
        completed_at DATETIME,
        error TEXT,
        result_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_jobs_repository_id ON sync_jobs(repository_id);
      CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at);
    `)
  }

  private startRateLimitMonitoring(): void {
    // Check rate limit every 5 minutes
    setInterval(async () => {
      try {
        await this.updateRateLimitInfo()
      } catch (error) {
        console.warn('Failed to update rate limit info:', error)
      }
    }, 5 * 60 * 1000)
  }

  private async updateRateLimitInfo(): Promise<void> {
    try {
      const rateLimit = await this.githubService.getRateLimit()
      this.rateLimitInfo = {
        remaining: rateLimit.rate.remaining,
        resetTime: new Date(rateLimit.rate.reset * 1000),
        lastCheck: new Date()
      }
    } catch (error) {
      console.warn('Failed to fetch rate limit from GitHub:', error)
    }
  }

  async queueSync(repositoryId: number, type: 'full' | 'incremental' = 'incremental'): Promise<string> {
    const jobId = `sync-${repositoryId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const job: SyncJob = {
      id: jobId,
      repositoryId,
      type,
      status: 'pending'
    }

    // Store job in database
    const stmt = this.db.prepare(`
      INSERT INTO sync_jobs (id, repository_id, type, status)
      VALUES (?, ?, ?, ?)
    `)
    
    stmt.run(jobId, repositoryId, type, 'pending')
    this.activeJobs.set(jobId, job)

    // Start processing if we have rate limit available
    if (this.canMakeRequests()) {
      this.processJob(jobId).catch(error => {
        console.error(`Failed to process sync job ${jobId}:`, error)
      })
    }

    return jobId
  }

  async getSyncStatus(jobId: string): Promise<SyncJob | null> {
    // Check active jobs first
    const activeJob = this.activeJobs.get(jobId)
    if (activeJob) {
      return activeJob
    }

    // Check database
    const stmt = this.db.prepare(`
      SELECT * FROM sync_jobs WHERE id = ?
    `)
    
    const result = stmt.get(jobId) as any
    if (!result) return null

    return {
      id: result.id,
      repositoryId: result.repository_id,
      type: result.type,
      status: result.status,
      startedAt: result.started_at ? new Date(result.started_at) : undefined,
      completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
      error: result.error,
      result: result.result_json ? JSON.parse(result.result_json) : undefined
    }
  }

  async getRepositorySyncHistory(repositoryId: number, limit: number = 10): Promise<SyncJob[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_jobs 
      WHERE repository_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `)
    
    const results = stmt.all(repositoryId, limit) as any[]
    
    return results.map(result => ({
      id: result.id,
      repositoryId: result.repository_id,
      type: result.type,
      status: result.status,
      startedAt: result.started_at ? new Date(result.started_at) : undefined,
      completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
      error: result.error,
      result: result.result_json ? JSON.parse(result.result_json) : undefined
    }))
  }

  private canMakeRequests(): boolean {
    const now = new Date()
    
    // If rate limit has reset, we can make requests
    if (now >= this.rateLimitInfo.resetTime) {
      return true
    }
    
    // Check if we have remaining requests (keep a buffer of 100)
    return this.rateLimitInfo.remaining > 100
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId)
    if (!job) return

    try {
      // Update job status to running
      job.status = 'running'
      job.startedAt = new Date()
      await this.updateJobInDatabase(job)

      // Wait if we're rate limited
      await this.waitForRateLimit()

      // Sync pull requests
      const prResult = await this.pullRequestService.syncPullRequests(job.repositoryId)
      
      // Sync reviews for each PR
      const pullRequests = await this.pullRequestService.getPullRequestsByRepository(job.repositoryId, { limit: 100 })
      let totalReviewsCreated = 0
      let totalReviewsUpdated = 0
      const reviewErrors: string[] = []

      for (const pr of pullRequests) {
        try {
          const reviewResult = await this.reviewService.syncReviewsForPullRequest(pr.id)
          totalReviewsCreated += reviewResult.created
          totalReviewsUpdated += reviewResult.updated
          reviewErrors.push(...reviewResult.errors)
        } catch (error) {
          reviewErrors.push(`Failed to sync reviews for PR #${pr.number}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Combine results
      const combinedResult: SyncResult = {
        success: prResult.success && reviewErrors.length === 0,
        processed: prResult.processed + pullRequests.length,
        created: prResult.created + totalReviewsCreated,
        updated: prResult.updated + totalReviewsUpdated,
        errors: [...prResult.errors, ...reviewErrors]
      }

      // Update job as completed
      job.status = 'completed'
      job.completedAt = new Date()
      job.result = combinedResult
      await this.updateJobInDatabase(job)

    } catch (error) {
      // Update job as failed
      job.status = 'failed'
      job.completedAt = new Date()
      job.error = error instanceof Error ? error.message : 'Unknown error'
      await this.updateJobInDatabase(job)
    } finally {
      // Remove from active jobs after a delay to allow status checking
      setTimeout(() => {
        this.activeJobs.delete(jobId)
      }, 5 * 60 * 1000) // Keep for 5 minutes
    }
  }

  private async updateJobInDatabase(job: SyncJob): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE sync_jobs 
      SET status = ?, started_at = ?, completed_at = ?, error = ?, result_json = ?
      WHERE id = ?
    `)
    
    stmt.run(
      job.status,
      job.startedAt?.toISOString(),
      job.completedAt?.toISOString(),
      job.error,
      job.result ? JSON.stringify(job.result) : null,
      job.id
    )
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.canMakeRequests()) {
      return
    }

    const waitTime = this.rateLimitInfo.resetTime.getTime() - Date.now()
    if (waitTime > 0) {
      console.log(`Rate limited. Waiting ${Math.ceil(waitTime / 1000)} seconds...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  async startPeriodicSync(intervalMinutes: number = 60): Promise<void> {
    console.log(`Starting periodic sync every ${intervalMinutes} minutes`)
    
    setInterval(async () => {
      try {
        const repositories = await this.repositoryService.getAllRepositories()
        
        for (const repo of repositories) {
          if (this.canMakeRequests()) {
            await this.queueSync(repo.id, 'incremental')
          } else {
            console.log(`Skipping sync for repository ${repo.full_name} due to rate limiting`)
            break
          }
        }
      } catch (error) {
        console.error('Failed to run periodic sync:', error)
      }
    }, intervalMinutes * 60 * 1000)
  }

  getRateLimitStatus() {
    return {
      ...this.rateLimitInfo,
      canMakeRequests: this.canMakeRequests()
    }
  }
}

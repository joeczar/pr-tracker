import { DatabaseManager } from '../db/database.js'
import { GitHubService } from './github.js'
import type { Repository } from '@shared/types/index.js'

export class RepositoryService {
  private db = DatabaseManager.getInstance().getDatabase()
  private githubService = new GitHubService()

  async getAllRepositories(): Promise<Repository[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM repositories 
      ORDER BY created_at DESC
    `)
    
    return stmt.all() as Repository[]
  }

  async getRepositoryById(id: number): Promise<Repository | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM repositories WHERE id = ?
    `)
    
    const result = stmt.get(id) as Repository | undefined
    return result || null
  }

  async getRepositoryByGitHubId(githubId: number): Promise<Repository | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM repositories WHERE github_id = ?
    `)
    
    const result = stmt.get(githubId) as Repository | undefined
    return result || null
  }

  async addRepository(owner: string, name: string): Promise<Repository> {
    // First, fetch repository info from GitHub
    const githubRepo = await this.githubService.getRepository(owner, name)
    
    // Check if repository already exists
    const existing = await this.getRepositoryByGitHubId(githubRepo.id)
    if (existing) {
      throw new Error(`Repository ${githubRepo.full_name} is already being tracked`)
    }

    // Insert into database
    const stmt = this.db.prepare(`
      INSERT INTO repositories (github_id, name, full_name)
      VALUES (?, ?, ?)
    `)
    
    const result = stmt.run(githubRepo.id, githubRepo.name, githubRepo.full_name)
    
    // Return the created repository
    return this.getRepositoryById(result.lastInsertRowid as number)!
  }

  async deleteRepository(id: number): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM repositories WHERE id = ?
    `)
    
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      throw new Error('Repository not found')
    }
  }

  async updateRepository(id: number, updates: Partial<Pick<Repository, 'name' | 'full_name'>>): Promise<Repository> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    
    const stmt = this.db.prepare(`
      UPDATE repositories 
      SET ${setClause}
      WHERE id = ?
    `)
    
    const result = stmt.run(...values, id)
    
    if (result.changes === 0) {
      throw new Error('Repository not found')
    }
    
    return this.getRepositoryById(id)!
  }
}

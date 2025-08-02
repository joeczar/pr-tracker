import { DatabaseManager } from '../db/database.js'
import { GitHubService } from './github.js'
import { User } from '../types/auth.js'
import type { Repository } from '@shared/types/index.js'

export class RepositoryService {
  private db = DatabaseManager.getInstance().getDatabase()
  private githubService: GitHubService
  private user: User | null

  constructor(user?: User) {
    this.user = user || null
    this.githubService = user ? GitHubService.forUser(user) : new GitHubService()
  }

  static forUser(user: User): RepositoryService {
    return new RepositoryService(user)
  }

  async getAllRepositories(): Promise<Repository[]> {
    let stmt;

    if (this.user) {
      // Return only repositories for the authenticated user
      stmt = this.db.prepare(`
        SELECT * FROM repositories
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      return stmt.all(this.user.id) as Repository[]
    } else {
      // Legacy support - return all repositories
      stmt = this.db.prepare(`
        SELECT * FROM repositories
        ORDER BY created_at DESC
      `)
      return stmt.all() as Repository[]
    }
  }

  async getRepositoryById(id: number): Promise<Repository | null> {
    let stmt;

    if (this.user) {
      // Ensure user can only access their own repositories
      stmt = this.db.prepare(`
        SELECT * FROM repositories WHERE id = ? AND user_id = ?
      `)
      const result = stmt.get(id, this.user.id) as Repository | undefined
      return result || null
    } else {
      // Legacy support
      stmt = this.db.prepare(`
        SELECT * FROM repositories WHERE id = ?
      `)
      const result = stmt.get(id) as Repository | undefined
      return result || null
    }
  }

  async getRepositoryByGitHubId(githubId: number): Promise<Repository | null> {
    let stmt;

    if (this.user) {
      // Ensure user can only access their own repositories
      stmt = this.db.prepare(`
        SELECT * FROM repositories WHERE github_id = ? AND user_id = ?
      `)
      const result = stmt.get(githubId, this.user.id) as Repository | undefined
      return result || null
    } else {
      // Legacy support
      stmt = this.db.prepare(`
        SELECT * FROM repositories WHERE github_id = ?
      `)
      const result = stmt.get(githubId) as Repository | undefined
      return result || null
    }
  }

  async addRepository(owner: string, name: string): Promise<Repository> {
    if (!this.user) {
      throw new Error('User authentication required to add repositories')
    }

    // First, fetch repository info from GitHub
    const githubRepo = await this.githubService.getRepository(owner, name)

    // Check if repository already exists for this user
    const existing = await this.getRepositoryByGitHubId(githubRepo.id)
    if (existing) {
      throw new Error(`Repository ${githubRepo.full_name} is already being tracked`)
    }

    // Insert into database with user association
    const stmt = this.db.prepare(`
      INSERT INTO repositories (github_id, name, full_name, user_id)
      VALUES (?, ?, ?, ?)
    `)

    const result = stmt.run(githubRepo.id, githubRepo.name, githubRepo.full_name, this.user.id)

    // Return the created repository
    const createdRepo = await this.getRepositoryById(result.lastInsertRowid as number)
    if (!createdRepo) {
      throw new Error('Failed to create repository')
    }
    return createdRepo
  }

  async deleteRepository(id: number): Promise<void> {
    let stmt;

    if (this.user) {
      // Ensure user can only delete their own repositories
      stmt = this.db.prepare(`
        DELETE FROM repositories WHERE id = ? AND user_id = ?
      `)
      const result = stmt.run(id, this.user.id)

      if (result.changes === 0) {
        throw new Error('Repository not found or access denied')
      }
    } else {
      // Legacy support
      stmt = this.db.prepare(`
        DELETE FROM repositories WHERE id = ?
      `)
      const result = stmt.run(id)

      if (result.changes === 0) {
        throw new Error('Repository not found')
      }
    }
  }

  async updateRepository(id: number, updates: Partial<Pick<Repository, 'name' | 'full_name'>>): Promise<Repository> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)

    let stmt;

    if (this.user) {
      // Ensure user can only update their own repositories
      stmt = this.db.prepare(`
        UPDATE repositories
        SET ${setClause}
        WHERE id = ? AND user_id = ?
      `)
      const result = stmt.run(...values, id, this.user.id)

      if (result.changes === 0) {
        throw new Error('Repository not found or access denied')
      }
    } else {
      // Legacy support
      stmt = this.db.prepare(`
        UPDATE repositories
        SET ${setClause}
        WHERE id = ?
      `)
      const result = stmt.run(...values, id)

      if (result.changes === 0) {
        throw new Error('Repository not found')
      }
    }

    const updatedRepo = await this.getRepositoryById(id)
    if (!updatedRepo) {
      throw new Error('Failed to update repository')
    }
    return updatedRepo
  }
}

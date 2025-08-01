import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database;

  private constructor() {
    const dbPath = process.env.DATABASE_URL || './data/pr-tracker.db';

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');

    console.log(`📊 Database connected: ${dbPath}`);
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getDatabase(): Database {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }

  public runMigrations(): void {
    console.log('🔄 Running database migrations...');

    // Create repositories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create pull_requests table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pull_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        repository_id INTEGER NOT NULL,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('open', 'closed', 'merged')),
        created_at DATETIME NOT NULL,
        merged_at DATETIME,
        lines_added INTEGER DEFAULT 0,
        lines_deleted INTEGER DEFAULT 0,
        files_changed INTEGER DEFAULT 0,
        commits_count INTEGER DEFAULT 0,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        UNIQUE(repository_id, number)
      )
    `);

    // Create reviews table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        pull_request_id INTEGER NOT NULL,
        reviewer_login TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED')),
        submitted_at DATETIME NOT NULL,
        comments_count INTEGER DEFAULT 0,
        FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pull_requests_repository_id ON pull_requests(repository_id);
      CREATE INDEX IF NOT EXISTS idx_pull_requests_state ON pull_requests(state);
      CREATE INDEX IF NOT EXISTS idx_pull_requests_created_at ON pull_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_reviews_pull_request_id ON reviews(pull_request_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_login ON reviews(reviewer_login);
    `);

    console.log('✅ Database migrations completed');
  }
}

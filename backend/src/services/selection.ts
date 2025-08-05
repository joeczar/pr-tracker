import { Database } from 'bun:sqlite';
import { DatabaseManager } from '../db/database';

export interface Selection {
  id: number;
  user_id: number;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelectionItem {
  id: number;
  selection_id: number;
  repository_id: number;
  pr_number: number;
  created_at: string;
}

export class SelectionService {
  private db: Database;

  constructor() {
    this.db = DatabaseManager.getInstance().getDatabase();
  }

  getActiveSelectionByUserId(userId: number): { selection: Selection | null; items: SelectionItem[] } {
    const activeStmt = this.db.prepare(`
      SELECT s.* FROM users u
      LEFT JOIN selections s ON s.id = u.active_selection_id
      WHERE u.id = ?
    `);
    const active = activeStmt.get(userId) as Selection | null;

    if (!active) return { selection: null, items: [] };

    const itemsStmt = this.db.prepare(`
      SELECT * FROM selection_items
      WHERE selection_id = ?
      ORDER BY created_at DESC, id DESC
    `);
    const items = itemsStmt.all(active.id) as SelectionItem[];

    return { selection: active, items };
  }

  ensureActiveSelection(userId: number): Selection {
    // Try get existing active selection
    const existingStmt = this.db.prepare(`
      SELECT s.* FROM users u
      JOIN selections s ON s.id = u.active_selection_id
      WHERE u.id = ?
    `);
    const existing = existingStmt.get(userId) as Selection | null;

    if (existing) return existing;

    // Create a new selection
    this.db.exec('BEGIN');
    try {
      this.db.prepare(`
        INSERT INTO selections (user_id) VALUES (?)
      `).run(userId);

      const selection = this.db
        .prepare(`
          SELECT * FROM selections WHERE user_id = ? ORDER BY id DESC LIMIT 1
        `)
        .get(userId) as Selection | null;

      if (!selection) throw new Error('Failed to create selection');

      this.db.prepare(`
        UPDATE users SET active_selection_id = ? WHERE id = ?
      `).run(selection.id, userId);

      this.db.exec('COMMIT');
      return selection;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  clearActiveSelection(userId: number): void {
    this.db.exec('BEGIN');
    try {
      const active = this.db
        .prepare(`
          SELECT active_selection_id FROM users WHERE id = ?
        `)
        .get(userId) as { active_selection_id: number | null } | null;

      if (active?.active_selection_id) {
        // Delete items then the selection row
        this.db
          .prepare(`
            DELETE FROM selection_items WHERE selection_id = ?
          `)
          .run(active.active_selection_id);

        this.db
          .prepare(`
            DELETE FROM selections WHERE id = ?
          `)
          .run(active.active_selection_id);
      }

      // Unset active selection
      this.db
        .prepare(`
          UPDATE users SET active_selection_id = NULL WHERE id = ?
        `)
        .run(userId);

      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  addItems(userId: number, items: Array<{ repository_id: number; pr_number: number }>): { added: number } {
    const selection = this.ensureActiveSelection(userId);

    this.db.exec('BEGIN');
    try {
      let added = 0;
      const insertStmt = this.db.prepare(`
        INSERT OR IGNORE INTO selection_items (selection_id, repository_id, pr_number)
        VALUES (?, ?, ?)
      `);
      const existsStmt = this.db.prepare(`
        SELECT id FROM selection_items WHERE selection_id = ? AND repository_id = ? AND pr_number = ?
      `);
      for (const it of items) {
        insertStmt.run(selection.id, it.repository_id, it.pr_number);
        const existed = existsStmt.get(selection.id, it.repository_id, it.pr_number) as { id: number } | null;
        if (existed) added += 1;
      }
      this.db.exec('COMMIT');
      return { added };
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  removeItems(userId: number, items: Array<{ repository_id: number; pr_number: number }>): { removed: number } {
    const active = this.db
      .prepare(`
        SELECT active_selection_id FROM users WHERE id = ?
      `)
      .get(userId) as { active_selection_id: number | null } | null;

    if (!active?.active_selection_id) return { removed: 0 };

    this.db.exec('BEGIN');
    try {
      let removed = 0;
      const deleteStmt = this.db.prepare(`
        DELETE FROM selection_items
        WHERE selection_id = ? AND repository_id = ? AND pr_number = ?
      `);
      const existsStmt = this.db.prepare(`
        SELECT id FROM selection_items WHERE selection_id = ? AND repository_id = ? AND pr_number = ?
      `);
      for (const it of items) {
        deleteStmt.run(active.active_selection_id, it.repository_id, it.pr_number);
        const still = existsStmt.get(active.active_selection_id, it.repository_id, it.pr_number) as { id: number } | null;
        if (!still) removed += 1;
      }
      this.db.exec('COMMIT');
      return { removed };
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
}

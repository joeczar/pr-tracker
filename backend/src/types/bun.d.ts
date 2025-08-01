declare module 'bun:sqlite' {
  export interface Database {
    prepare(sql: string): Statement
    close(): void
    exec(sql: string): void
  }

  export interface Statement {
    run(...params: any[]): RunResult
    get(...params: any[]): any
    all(...params: any[]): any[]
    finalize(): void
  }

  export interface RunResult {
    changes: number
    lastInsertRowid: number | bigint
  }

  export class Database {
    constructor(filename?: string, options?: any)
    prepare(sql: string): Statement
    close(): void
    exec(sql: string): void
  }
}

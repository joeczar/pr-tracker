#!/usr/bin/env tsx

import 'dotenv/config'
import { DatabaseManager } from './database.js'

async function runMigrations() {
  try {
    console.log('🚀 Starting database migration...')
    
    const dbManager = DatabaseManager.getInstance()
    dbManager.runMigrations()
    
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()

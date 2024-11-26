import { NextResponse } from 'next/server'
import { SchemaManager } from '@/lib/database-management-system'

const config = {
  liquibase: {
    changeLogFile: process.env.LIQUIBASE_CHANGELOG_FILE || '',
    url: process.env.LIQUIBASE_URL || '',
    username: process.env.LIQUIBASE_USERNAME || '',
    password: process.env.LIQUIBASE_PASSWORD || ''
  },
  postgresql: {
    // PostgreSQL configuration
  },
  neo4j: {
    uri: process.env.NEO4J_URI || '',
    user: process.env.NEO4J_USER || '',
    password: process.env.NEO4J_PASSWORD || ''
  },
  storage_connection_string: process.env.STORAGE_CONNECTION_STRING || '',
  subscription_id: process.env.SUBSCRIPTION_ID || ''
}

const schemaManager = new SchemaManager(config)

export async function POST(request: Request) {
  try {
    const { version, database } = await request.json()
    const result = await schemaManager.applyMigration(version, database)
    return NextResponse.json({ success: result })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ error: 'An error occurred during migration' }, { status: 500 })
  }
}   
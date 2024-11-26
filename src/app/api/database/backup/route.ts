import { NextResponse } from 'next/server'
import { BackupManager } from '@/lib/database-management-system'

const config = {
  storage_connection_string: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  subscription_id: process.env.AZURE_SUBSCRIPTION_ID || '',
  postgresql: {
    host: process.env.POSTGRESQL_HOST || '',
    port: Number(process.env.POSTGRESQL_PORT || '5432'),
    database: process.env.POSTGRESQL_DATABASE || '',
    user: process.env.POSTGRESQL_USER || '',
    password: process.env.POSTGRESQL_PASSWORD || ''
  },
  neo4j: {
    uri: process.env.NEO4J_URI || '',
    user: process.env.NEO4J_USER || '', 
    password: process.env.NEO4J_PASSWORD || ''
  },
  liquibase: {
    changeLogFile: process.env.LIQUIBASE_CHANGELOG_FILE || ''
  }
}

const backupManager = new BackupManager(config)

export async function POST(request: Request) {
  try {
    const { type, source } = await request.json()
    const result = await backupManager.performBackup(type, source)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'An error occurred during backup' }, { status: 500 })
  }
}
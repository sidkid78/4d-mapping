import { NextResponse } from 'next/server'
import { DisasterRecovery } from '@/lib/database-management-system'

const config = {
  storage_connection_string: process.env.STORAGE_CONNECTION_STRING || '',
  subscription_id: process.env.SUBSCRIPTION_ID || '',
  postgresql: {
    host: process.env.POSTGRES_HOST || '',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || '',
    user: process.env.POSTGRES_USER || '',
    password: process.env.POSTGRES_PASSWORD || ''
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

const disasterRecovery = new DisasterRecovery(config)

export async function POST() {
  try {
    const result = await disasterRecovery.performRecoveryDrill()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Recovery drill failed:', error)
    return NextResponse.json({ error: 'An error occurred during the recovery drill' }, { status: 500 })
  }
}
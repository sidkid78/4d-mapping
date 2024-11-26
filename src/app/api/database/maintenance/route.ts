import { NextResponse } from 'next/server'
import { DatabaseMaintenance } from '@/lib/database-management-system'

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
    changeLogFile: process.env.LIQUIBASE_CHANGELOG_FILE || '',
    url: process.env.LIQUIBASE_URL || '',
    username: process.env.LIQUIBASE_USERNAME || '',
    password: process.env.LIQUIBASE_PASSWORD || ''
  }
}

const dbMaintenance = new DatabaseMaintenance(config)

export async function POST(request: Request) {
  try {
    const { database } = await request.json()

    if (database === 'postgresql') {
      const result = await dbMaintenance.performPostgresqlMaintenance()
      return NextResponse.json(result)
    } else if (database === 'neo4j') {
      const result = await dbMaintenance.performNeo4jMaintenance()
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Invalid database specified' }, { status: 400 })
    }
  } catch (error) {
    console.error('Database maintenance failed:', error)
    return NextResponse.json({ error: 'An error occurred during maintenance' }, { status: 500 })
  }
}
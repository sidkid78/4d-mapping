import { NextResponse } from 'next/server'
import { AcquisitionClauseManager } from '@/lib/acquisition-clause-manager'

const config = {
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'acquisition',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || ''
  },
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || ''
  },
  search_endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
  search_key: process.env.AZURE_SEARCH_KEY || '',
  keyvault_url: process.env.KEY_VAULT_URL || '',
  keyvault_key: process.env.KEY_VAULT_KEY || ''
}

const clauseManager = new AcquisitionClauseManager(config)

export async function POST(request: Request) {
  try {
    const clauseData = await request.json()
    const clauseId = await clauseManager.create_clause(clauseData)
    return NextResponse.json({ clause_id: clauseId })
  } catch (error) {
    console.error('Clause creation failed:', error)
    return NextResponse.json({ error: 'An error occurred during clause creation' }, { status: 500 })
  }
}
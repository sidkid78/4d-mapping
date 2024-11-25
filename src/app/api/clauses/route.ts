import { NextResponse } from 'next/server'
import { AcquisitionClauseManager } from '@/lib/acquisition_clause_manager'

const config = {
  postgresql: {
    // PostgreSQL connection details
  },
  neo4j: {
    // Neo4j connection details
  },
  search_endpoint: process.env.AZURE_SEARCH_ENDPOINT,
  search_key: process.env.AZURE_SEARCH_KEY,
  keyvault_url: process.env.KEY_VAULT_URL,
  keyvault_key: process.env.KEY_VAULT_KEY
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
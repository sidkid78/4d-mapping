import { NextRequest, NextResponse } from 'next/server'
import { ClauseAnalyzer } from '@/lib/acquisition-clause-manager'

const config = {
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
  search_endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
  search_key: process.env.AZURE_SEARCH_KEY || '',
  keyvault_url: process.env.KEY_VAULT_URL || '',
  keyvault_key: process.env.KEY_VAULT_KEY || ''
}

const clauseAnalyzer = new ClauseAnalyzer(config)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { role } = await request.json()
    const analysisResult = await clauseAnalyzer.analyze_clause(id, { role })
    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('Clause analysis failed:', error)
    return NextResponse.json({ error: 'An error occurred during clause analysis' }, { status: 500 })
  }
}
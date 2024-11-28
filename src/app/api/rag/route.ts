import { NextResponse } from 'next/server'
import { RAGAgent } from '@/lib/rag_agent'
// import { SecurityFramework } from '@/lib/security_framework'
// import { EthicalAI } from '@/lib/ethical_ai'

const config = {
  search_endpoint: process.env.AZURE_SEARCH_ENDPOINT,
  search_key: process.env.AZURE_SEARCH_KEY,
  neo4j_uri: process.env.NEO4J_URI,
  neo4j_user: process.env.NEO4J_USER,
  neo4j_password: process.env.NEO4J_PASSWORD,
  azure_openai_endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azure_openai_deployment_name: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  azure_openai_api_version: process.env.AZURE_OPENAI_API_VERSION,
  // key_vault_url: process.env.KEY_VAULT_URL,
  // azure_openai_secret_name: process.env.AZURE_OPENAI_SECRET_NAME,
  // keyvault_url: process.env.KEY_VAULT_URL,
}

const ragAgent = new RAGAgent(config)
// const securityFramework = new SecurityFramework(config)
// const ethicalAI = new EthicalAI(config)

export async function POST(request: Request) {
  try {
    const { query, userContext } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const ragResult = await ragAgent.process_query(query, userContext)
    return NextResponse.json({ result: ragResult })

  } catch (error) {
    console.error('Error processing RAG query:', error)
    return NextResponse.json({ error: 'An error occurred while processing the query' }, { status: 500 })
  }
}
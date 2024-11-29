import { NextRequest, NextResponse } from 'next/server'
import { AdvancedAIEngine } from '@/lib/advanced_ai_engine'
import { validateRequest } from '@/lib/api_utils'

const aiEngine = new AdvancedAIEngine({
  azure_openai_secret_name: process.env.AZURE_OPENAI_SECRET_NAME,
  azure_openai_api_key: process.env.AZURE_OPENAI_API_KEY,
  confidenceThreshold: 0.7
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { isValid, errorMessage } = validateRequest(body, ['query', 'expertiseLevel'])
    
    if (!isValid) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { query, expertiseLevel } = body

    const result = await aiEngine.processAdvancedQuery(query, {
      expertiseLevel,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing query:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
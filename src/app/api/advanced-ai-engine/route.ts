import { NextRequest, NextResponse } from 'next/server'
import { AdvancedAIEngine } from '@/lib/advanced_ai_engine'
import { validateRequest } from '@/lib/api_utils'

const aiEngine = new AdvancedAIEngine({   
  // Add any necessary configuration here
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { isValid, errorMessage } = validateRequest(body, ['query', 'expertiseLevel'])
    
    if (!isValid) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { query, expertiseLevel } = body

    const result = await aiEngine.processAdvancedQuery(query, { expertise_level: expertiseLevel })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing query:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
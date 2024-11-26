import { NextRequest, NextResponse } from 'next/server'
import { AlgorithmOfThought, QueryContext } from '../../../lib/algorithm-of-thought'
import { AoT_CONFIG } from '../../../config/aot_config'

const aot = new AlgorithmOfThought(AoT_CONFIG)

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json()

    // Validate input
    if (!query || !context) {
      return NextResponse.json(
        { error: 'Missing query or context' },
        { status: 400 }
      )
    }

    // Create QueryContext object
    const queryContext = new QueryContext(
      context.user_role,
      context.expertise_level,
      context.industry,
      context.region,
      new Date(context.timestamp),
      context.request_priority
    )

    // Process query using AoT
    const result = await aot.process_query(query, queryContext)

    return NextResponse.json(result)
  } catch (error) {
    console.error('AoT processing failed:', error)
    return NextResponse.json(
      { error: 'An error occurred during AoT processing' },
      { status: 500 }
    )
  }
}
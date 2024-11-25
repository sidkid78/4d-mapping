import { NextResponse } from 'next/server'
import { ClauseAnalyzer } from '@/lib/acquisition_clause_manager'

const config = {
  // Configuration for ClauseAnalyzer
}

const clauseAnalyzer = new ClauseAnalyzer(config)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { role } = await request.json()
    const analysisResult = await clauseAnalyzer.analyze_clause(params.id, { role })
    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('Clause analysis failed:', error)
    return NextResponse.json({ error: 'An error occurred during clause analysis' }, { status: 500 })
  }
}
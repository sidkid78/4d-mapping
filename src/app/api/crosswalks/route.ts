import { NextRequest, NextResponse } from 'next/server'
import { DatabaseManager } from '@/lib/database-manager'
import { validateRequest } from '@/lib/api_utils'

interface CrosswalkRequest {
  sourceId: string
  targetId: string 
  crosswalkType: string
}

const dbManager = new DatabaseManager({
  host: process.env.BACKEND_URL || 'http://localhost:8000',
  port: 5432,
  database: process.env.DATABASE_NAME || 'procurity',
  user: process.env.API_KEY!,
  password: process.env.DATABASE_PASSWORD!
}, 
process.env.API_KEY!,
'v1')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isValid, errorMessage } = validateRequest(body, ['sourceId', 'targetId', 'crosswalkType'])

    if (!isValid) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { sourceId, targetId, crosswalkType }: CrosswalkRequest = body

    await dbManager.createCrosswalk(sourceId, targetId, crosswalkType)
    
    return NextResponse.json({
      success: true,
      message: 'Crosswalk created successfully'
    })

  } catch (error) {
    console.error('Failed to create crosswalk:', error)
    return NextResponse.json(
      { error: 'Failed to create crosswalk' }, 
      { status: 500 }
    )
  }
}
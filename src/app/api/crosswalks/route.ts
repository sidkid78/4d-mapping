import { NextResponse } from 'next/server'
import { DatabaseManager } from '@/lib/database-manager'

// Initialize the DatabaseManager with connection details
const dbManager = new DatabaseManager(
  {
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
  {
    uri: process.env.NEO4J_URI,
    auth: [process.env.NEO4J_USER, process.env.NEO4J_PASSWORD],
  },
  {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
  }
)

export async function POST(request: Request) {
  try {
    const { source_id, target_id, crosswalk_type } = await request.json()

    if (!source_id || !target_id || !crosswalk_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbManager.create_crosswalk(source_id, target_id, crosswalk_type)

    return NextResponse.json({ success: true, message: 'Crosswalk created successfully' })
  } catch (error) {
    console.error('Error creating crosswalk:', error)
    return NextResponse.json({ error: 'Failed to create crosswalk' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regulation_id = searchParams.get('regulation_id')

    if (!regulation_id) {
      return NextResponse.json({ error: 'Missing regulation_id parameter' }, { status: 400 })
    }

    const regulation = await dbManager.get_regulation_with_crosswalks(regulation_id)

    return NextResponse.json(regulation)
  } catch (error) {
    console.error('Error fetching regulation with crosswalks:', error)
    return NextResponse.json({ error: 'Failed to fetch regulation with crosswalks' }, { status: 500 })
  }
}
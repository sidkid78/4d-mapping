import { NextResponse } from 'next/server'
import { DatabaseManager } from '@/lib/database-manager'

// Ensure all environment variables are defined
if (!process.env.POSTGRES_HOST || !process.env.POSTGRES_DATABASE || 
    !process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD ||
    !process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || 
    !process.env.NEO4J_PASSWORD) {
  throw new Error('Missing required environment variables')
}

const dbManager = new DatabaseManager(
  {          
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  },
  {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD
  },
  { timeout: 5000, retries: 3 }
)

interface RegulationData {
  nuremberg_number: string;
  name: string;
  original_reference: string;
  sam_tag: string;
  content: string;
  level: string;
  domain: string;
  effective_date: string;
}

export async function POST(request: Request) {
  const regulationData = await request.json() as RegulationData
try {
    // Convert to unknown first before type assertion
    const regulationId = await ((dbManager as unknown) as { 
      create_regulation(data: RegulationData): Promise<string> 
    }).create_regulation(regulationData)
    return NextResponse.json({ regulation_id: regulationId })
  } catch (error) {
    console.error('Failed to create regulation:', error)
    return NextResponse.json({ error: 'Failed to create regulation' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Regulation ID is required' }, { status: 400 })
  }
  try {
    const regulation = await dbManager.get_regulation_with_crosswalks(id)
    return NextResponse.json(regulation)
  } catch (error) {
    console.error('Failed to fetch regulation:', error)
    return NextResponse.json({ error: 'Failed to fetch regulation' }, { status: 500 })
  }
}
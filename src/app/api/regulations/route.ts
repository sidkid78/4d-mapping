import { NextResponse } from 'next/server'
import { DatabaseManager, type DatabaseConfig } from '@/lib/database-manager'

const config: DatabaseConfig = {
  host: process.env.POSTGRES_PRISMA_URL!,
  port: 5432,
  database: process.env.POSTGRES_PRISMA_DATABASE!,
  user: process.env.POSTGRES_PRISMA_USER!,
  password: process.env.POSTGRES_PRISMA_PASSWORD!
}

const dbManager = new DatabaseManager(
  config,
  process.env.POSTGRES_PRISMA_SECRET!,
  'v1'
)

export async function POST(request: Request) {
  const regulationData = await request.json()
  try {
    const regulationId = await dbManager.createRegulation(regulationData)
    return NextResponse.json({ regulation_id: regulationId })
  } catch (error) {
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
    const regulation = await dbManager.getRegulationWithCrosswalks(id)
    return NextResponse.json(regulation)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch regulation' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const regulations = await prisma.regulation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    return NextResponse.json(regulations)
  } catch (error) {
    console.error('Error fetching regulations:', error)
    return NextResponse.json({ error: 'Failed to fetch regulations' }, { status: 500 })
  }
}